import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from './firestore';
import { db } from './firestore';
import { Project, CreateProjectInput, UpdateProjectInput } from '@/types/project';

const PROJECTS_COLLECTION = 'projects';

/**
 * Validates a project title and description.
 */
function validateProjectData(title: string, description?: string) {
  if (!title || title.trim() === '') {
    throw new Error('Project title is required.');
  }
  if (title.length > 100) {
    throw new Error('Project title cannot exceed 100 characters.');
  }
  if (description && description.length > 1000) {
    throw new Error('Project description cannot exceed 1000 characters.');
  }
}

/**
 * Create a new project in Firestore.
 */
export async function createProject(userId: string, input: CreateProjectInput): Promise<string> {
  validateProjectData(input.title, input.description);

  // Generate a new document reference to get the ID
  const projectRef = doc(collection(db, PROJECTS_COLLECTION));

  const projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'archivedAt'> & {
    createdAt: unknown;
    updatedAt: unknown;
    archivedAt: unknown;
  } = {
    ownerId: userId,
    workspaceId: input.workspaceId || 'default-workspace',
    title: input.title.trim(),
    description: (input.description || '').trim(),
    status: 'active',
    color: input.color || '#6366f1', // default indigo-500
    icon: input.icon || 'FolderKanban',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    archivedAt: null,
    memberIds: [userId],
    taskCount: 0,
    completedTaskCount: 0,
    deleted: false,
  };

  await setDoc(projectRef, projectData);
  return projectRef.id;
}

/**
 * Retrieve a project by ID with ownership verification.
 */
export async function getProject(projectId: string, userId: string): Promise<Project> {
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  const projectSnap = await getDoc(projectRef);

  if (!projectSnap.exists()) {
    throw new Error('Project not found.');
  }

  const data = projectSnap.data();

  if (data.deleted) {
    throw new Error('Project not found.');
  }

  // Allow access if user is owner or member
  const memberIds = data.memberIds || [];
  if (data.ownerId !== userId && !memberIds.includes(userId)) {
    throw new Error('Access denied. You do not have permission to view this project.');
  }

  return {
    id: projectSnap.id,
    ...data,
  } as Project;
}

/**
 * Update project details with ownership checks.
 */
export async function updateProject(
  projectId: string,
  userId: string,
  input: UpdateProjectInput
): Promise<void> {
  if (input.title !== undefined) {
    validateProjectData(input.title, input.description);
  }

  const project = await getProject(projectId, userId);

  // Only the owner can edit project settings
  if (project.ownerId !== userId) {
    throw new Error('Permission denied. Only the owner can modify this project.');
  }

  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);

  const updateData: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (input.title !== undefined) updateData.title = input.title.trim();
  if (input.description !== undefined) updateData.description = input.description.trim();
  if (input.status !== undefined) updateData.status = input.status;
  if (input.color !== undefined) updateData.color = input.color;
  if (input.icon !== undefined) updateData.icon = input.icon;
  if (input.taskCount !== undefined) updateData.taskCount = input.taskCount;
  if (input.completedTaskCount !== undefined) updateData.completedTaskCount = input.completedTaskCount;

  // Handle archived transitions
  if (input.status === 'archived' && project.status !== 'archived') {
    updateData.archivedAt = serverTimestamp();
  } else if (input.status !== undefined && input.status !== 'archived' && project.status === 'archived') {
    updateData.archivedAt = null;
  }

  await updateDoc(projectRef, updateData);
}

/**
 * Archive a project.
 */
export async function archiveProject(projectId: string, userId: string): Promise<void> {
  await updateProject(projectId, userId, { status: 'archived' });
}

/**
 * Restore a project from archive.
 */
export async function restoreProject(projectId: string, userId: string): Promise<void> {
  await updateProject(projectId, userId, { status: 'active' });
}

/**
 * Soft delete a project.
 */
export async function deleteProject(projectId: string, userId: string): Promise<void> {
  const project = await getProject(projectId, userId);

  if (project.ownerId !== userId) {
    throw new Error('Permission denied. Only the owner can delete this project.');
  }

  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  await updateDoc(projectRef, {
    deleted: true,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Retrieve all active and completed projects for a user.
 */
export async function getProjects(userId: string, workspaceId: string = 'default-workspace'): Promise<Project[]> {
  const q = query(
    collection(db, PROJECTS_COLLECTION),
    where('workspaceId', '==', workspaceId),
    where('memberIds', 'array-contains', userId),
    where('deleted', '==', false),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const projects: Project[] = [];

  querySnapshot.forEach((docSnap) => {
    projects.push({
      id: docSnap.id,
      ...docSnap.data(),
    } as Project);
  });

  return projects;
}
