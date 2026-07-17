import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
  increment,
} from './firestore';
import { Task, CreateTaskInput, UpdateTaskInput } from '@/types/task';
import { Project } from '@/types/project';

const TASKS_COLLECTION = 'tasks';
const PROJECTS_COLLECTION = 'projects';

/**
 * Validates task title and description.
 */
function validateTaskData(title: string, description?: string) {
  if (!title || title.trim() === '') {
    throw new Error('Task title is required.');
  }
  if (title.length > 100) {
    throw new Error('Task title cannot exceed 100 characters.');
  }
  if (description && description.length > 2000) {
    throw new Error('Task description cannot exceed 2000 characters.');
  }
}

/**
 * Creates a new task and atomically updates the parent project's taskCount.
 */
export async function createTask(userId: string, input: CreateTaskInput): Promise<string> {
  validateTaskData(input.title, input.description);

  const taskRef = doc(collection(db, TASKS_COLLECTION));
  const projectRef = doc(db, PROJECTS_COLLECTION, input.projectId);

  await runTransaction(db, async (transaction) => {
    // 1. Verify parent project and user access
    const projectSnap = await transaction.get(projectRef);
    if (!projectSnap.exists()) {
      throw new Error('Associated project not found.');
    }

    const projectData = projectSnap.data() as Project;
    if (projectData.deleted) {
      throw new Error('Associated project has been deleted.');
    }

    const memberIds = projectData.memberIds || [];
    if (projectData.ownerId !== userId && !memberIds.includes(userId)) {
      throw new Error('Access denied. You do not have permission to add tasks to this project.');
    }

    // 2. Prepare task details
    const status = input.status || 'todo';
    const position = Date.now(); // Highly unique, incremental ordering position

    const taskData = {
      projectId: input.projectId,
      projectName: projectData.title,
      ownerId: userId,
      assigneeId: input.assigneeId || null,
      assigneeName: input.assigneeName || null,
      assigneeAvatarUrl: input.assigneeAvatarUrl || null,
      title: input.title.trim(),
      description: (input.description || '').trim(),
      status,
      priority: input.priority || 'medium',
      dueDate: input.dueDate || null,
      position,
      deleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // 3. Write task document
    transaction.set(taskRef, taskData);

    // 4. Update project's counters
    const isCompleted = status === 'completed';
    transaction.update(projectRef, {
      taskCount: increment(1),
      completedTaskCount: isCompleted ? increment(1) : increment(0),
      updatedAt: serverTimestamp(),
    });
  });

  return taskRef.id;
}

/**
 * Retrieves a single task and verifies user access.
 */
export async function getTask(taskId: string, userId: string): Promise<Task> {
  const taskRef = doc(db, TASKS_COLLECTION, taskId);
  const taskSnap = await getDoc(taskRef);

  if (!taskSnap.exists()) {
    throw new Error('Task not found.');
  }

  const taskData = taskSnap.data();
  if (taskData.deleted) {
    throw new Error('Task not found.');
  }

  // Verify access by checking project membership or ownership
  const projectRef = doc(db, PROJECTS_COLLECTION, taskData.projectId);
  const projectSnap = await getDoc(projectRef);

  let hasAccess = taskData.ownerId === userId;

  if (projectSnap.exists()) {
    const projectData = projectSnap.data() as Project;
    const memberIds = projectData.memberIds || [];
    if (projectData.ownerId === userId || memberIds.includes(userId)) {
      hasAccess = true;
    }
  }

  if (!hasAccess) {
    throw new Error('Access denied. You do not have permission to view this task.');
  }

  return {
    id: taskSnap.id,
    ...taskData,
  } as Task;
}

/**
 * Updates a task and atomically corrects the parent project's completedTaskCount if status changed.
 */
export async function updateTask(taskId: string, userId: string, input: UpdateTaskInput): Promise<void> {
  if (input.title !== undefined) {
    validateTaskData(input.title, input.description);
  }

  const taskRef = doc(db, TASKS_COLLECTION, taskId);

  await runTransaction(db, async (transaction) => {
    // 1. Fetch current task details
    const taskSnap = await transaction.get(taskRef);
    if (!taskSnap.exists()) {
      throw new Error('Task not found.');
    }

    const taskData = taskSnap.data() as Task;
    if (taskData.deleted) {
      throw new Error('Task has been deleted.');
    }

    // 2. Fetch project details to verify access
    const projectRef = doc(db, PROJECTS_COLLECTION, taskData.projectId);
    const projectSnap = await transaction.get(projectRef);
    if (!projectSnap.exists()) {
      throw new Error('Associated project not found.');
    }

    const projectData = projectSnap.data() as Project;
    const memberIds = projectData.memberIds || [];
    const isOwnerOrMember = projectData.ownerId === userId || memberIds.includes(userId);
    const isTaskOwner = taskData.ownerId === userId;

    if (!isOwnerOrMember && !isTaskOwner) {
      throw new Error('Access denied. You do not have permission to modify this task.');
    }

    // 3. Prepare update payload
    const updateData: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (input.title !== undefined) updateData.title = input.title.trim();
    if (input.description !== undefined) updateData.description = input.description.trim();
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.dueDate !== undefined) updateData.dueDate = input.dueDate;
    if (input.assigneeId !== undefined) updateData.assigneeId = input.assigneeId;
    if (input.assigneeName !== undefined) updateData.assigneeName = input.assigneeName;
    if (input.assigneeAvatarUrl !== undefined) updateData.assigneeAvatarUrl = input.assigneeAvatarUrl;
    if (input.position !== undefined) updateData.position = input.position;

    // 4. Handle completed counts adjustment on project if status changes
    if (input.status !== undefined && input.status !== taskData.status) {
      updateData.status = input.status;

      const wasCompleted = taskData.status === 'completed';
      const isNowCompleted = input.status === 'completed';

      if (wasCompleted && !isNowCompleted) {
        transaction.update(projectRef, {
          completedTaskCount: increment(-1),
          updatedAt: serverTimestamp(),
        });
      } else if (!wasCompleted && isNowCompleted) {
        transaction.update(projectRef, {
          completedTaskCount: increment(1),
          updatedAt: serverTimestamp(),
        });
      }
    }

    transaction.update(taskRef, updateData);
  });
}

/**
 * Soft deletes a task and updates the project counters.
 */
export async function deleteTask(taskId: string, userId: string): Promise<void> {
  const taskRef = doc(db, TASKS_COLLECTION, taskId);

  await runTransaction(db, async (transaction) => {
    // 1. Fetch current task details
    const taskSnap = await transaction.get(taskRef);
    if (!taskSnap.exists()) {
      throw new Error('Task not found.');
    }

    const taskData = taskSnap.data() as Task;
    if (taskData.deleted) {
      return; // Already deleted
    }

    // 2. Fetch project details to verify access
    const projectRef = doc(db, PROJECTS_COLLECTION, taskData.projectId);
    const projectSnap = await transaction.get(projectRef);
    if (!projectSnap.exists()) {
      throw new Error('Associated project not found.');
    }

    const projectData = projectSnap.data() as Project;
    const memberIds = projectData.memberIds || [];
    const isOwnerOrMember = projectData.ownerId === userId || memberIds.includes(userId);
    const isTaskOwner = taskData.ownerId === userId;

    if (!isOwnerOrMember && !isTaskOwner) {
      throw new Error('Access denied. You do not have permission to delete this task.');
    }

    // 3. Soft-delete the task
    transaction.update(taskRef, {
      deleted: true,
      updatedAt: serverTimestamp(),
    });

    // 4. Adjust project counters
    const wasCompleted = taskData.status === 'completed';
    transaction.update(projectRef, {
      taskCount: increment(-1),
      completedTaskCount: wasCompleted ? increment(-1) : increment(0),
      updatedAt: serverTimestamp(),
    });
  });
}

/**
 * Static getter for tasks of a project. Good for simple queries.
 */
export async function getTasks(projectId: string, userId: string): Promise<Task[]> {
  // First, verify access
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  const projectSnap = await getDoc(projectRef);

  if (!projectSnap.exists()) {
    throw new Error('Project not found.');
  }

  const projectData = projectSnap.data() as Project;
  const memberIds = projectData.memberIds || [];
  if (projectData.ownerId !== userId && !memberIds.includes(userId)) {
    throw new Error('Access denied. You do not have permission to view tasks in this project.');
  }

  const q = query(
    collection(db, TASKS_COLLECTION),
    where('projectId', '==', projectId),
    where('deleted', '==', false),
    orderBy('position', 'asc')
  );

  const querySnapshot = await getDocs(q);
  const tasks: Task[] = [];

  querySnapshot.forEach((docSnap) => {
    tasks.push({
      id: docSnap.id,
      ...docSnap.data(),
    } as Task);
  });

  return tasks;
}
