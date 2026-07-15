/**
 * Validates a username based on the following rules:
 * - 3–20 characters
 * - Only lowercase letters, numbers, and underscores
 * - No consecutive underscores
 * - Cannot start or end with an underscore
 */
export const validateUsername = (username: string): string | null => {
  if (username.length < 3) {
    return 'Username must be at least 3 characters long.';
  }
  if (username.length > 20) {
    return 'Username cannot exceed 20 characters.';
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return 'Username can only contain lowercase letters, numbers, and underscores.';
  }
  if (username.startsWith('_')) {
    return 'Username cannot start with an underscore.';
  }
  if (username.endsWith('_')) {
    return 'Username cannot end with an underscore.';
  }
  if (username.includes('__')) {
    return 'Username cannot contain consecutive underscores.';
  }
  return null;
};

/**
 * Normalizes a username by converting it to lowercase and trimming whitespace.
 */
export const normalizeUsername = (username: string): string => {
  return username.toLowerCase().trim();
};
