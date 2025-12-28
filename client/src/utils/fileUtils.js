// Utility functions for handling file URLs

/**
 * Get the base URL for the server (without /api suffix)
 * @returns {string} Base server URL
 */
export const getServerBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://192.168.1.7:3000/api';
  // Remove /api suffix if present
  return apiUrl.replace(/\/api$/, '');
};

/**
 * Get the full URL for an uploaded file
 * @param {string} filename - The filename stored in the database
 * @returns {string} Full URL to the file
 */
export const getFileUrl = (filename) => {
  if (!filename) return null;
  const baseUrl = getServerBaseUrl();
  return `${baseUrl}/uploads/temp/${filename}`;
};

/**
 * Get the full URL for a student photo
 * @param {string} photoFilename - The photo filename from student data
 * @returns {string|null} Full URL to the photo or null if no photo
 */
export const getStudentPhotoUrl = (photoFilename) => {
  return getFileUrl(photoFilename);
};
