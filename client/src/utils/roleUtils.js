/**
 * Utility functions for role-based checks
 * Handles both capitalized and lowercase role comparisons
 */

/**
 * Check if user has a specific role (case-insensitive)
 * @param {Object} user - User object with role property
 * @param {string} role - Role to check against
 * @returns {boolean} - True if user has the role
 */
export const hasRole = (user, role) => {
  if (!user || !user.role || !role) {
    return false;
  }
  return user.role.toLowerCase() === role.toLowerCase();
};

/**
 * Check if user has any of the specified roles (case-insensitive)
 * @param {Object} user - User object with role property
 * @param {string[]} roles - Array of roles to check against
 * @returns {boolean} - True if user has any of the roles
 */
export const hasAnyRole = (user, roles) => {
  if (!user || !user.role || !roles || !Array.isArray(roles)) {
    return false;
  }
  const userRole = user.role.toLowerCase();
  return roles.some(role => role.toLowerCase() === userRole);
};

/**
 * Check if user is a teacher (case-insensitive)
 * @param {Object} user - User object with role property
 * @returns {boolean} - True if user is a teacher
 */
export const isTeacher = (user) => {
  return hasRole(user, 'teacher');
};

/**
 * Check if user is an admin (case-insensitive)
 * @param {Object} user - User object with role property
 * @returns {boolean} - True if user is an admin
 */
export const isAdmin = (user) => {
  return hasRole(user, 'admin');
};

/**
 * Check if user is a student (case-insensitive)
 * @param {Object} user - User object with role property
 * @returns {boolean} - True if user is a student
 */
export const isStudent = (user) => {
  return hasRole(user, 'student');
};

/**
 * Check if user is a teacher or admin (case-insensitive)
 * @param {Object} user - User object with role property
 * @returns {boolean} - True if user is a teacher or admin
 */
export const isTeacherOrAdmin = (user) => {
  return hasAnyRole(user, ['teacher', 'admin']);
};

/**
 * Get normalized role (lowercase)
 * @param {Object} user - User object with role property
 * @returns {string|null} - Normalized role or null
 */
export const getNormalizedRole = (user) => {
  if (!user || !user.role) {
    return null;
  }
  return user.role.toLowerCase();
};
