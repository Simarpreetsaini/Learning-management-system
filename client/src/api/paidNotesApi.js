import axiosInstance from './axios';

// Public API calls (no authentication required)
export const paidNotesApi = {
  // Get all paid notes with optional filters
  getAllNotes: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.subject) params.append('subject', filters.subject);
    if (filters.search) params.append('search', filters.search);
    
    const response = await axiosInstance.get(`/paid-notes?${params.toString()}`);
    return response.data;
  },

  // Get single note details
  getNoteById: async (noteId) => {
    const response = await axiosInstance.get(`/paid-notes/${noteId}`);
    return response.data;
  },

  // Initiate purchase (guest checkout)
  initiatePurchase: async (noteId, buyerEmail) => {
    const response = await axiosInstance.post(`/paid-notes/${noteId}/initiate-purchase`, {
      buyerEmail
    });
    return response.data;
  },

  // Resend download link
  resendDownloadLink: async (buyerEmail, orderId = null) => {
    const response = await axiosInstance.post('/paid-notes/resend-link', {
      buyerEmail,
      orderId
    });
    return response.data;
  },

  // Download note (redirects to secure download)
  downloadNote: (orderId, accessKey) => {
    return `${axiosInstance.defaults.baseURL}/paid-notes/download/${orderId}/${accessKey}`;
  },

  // Get download URL after successful payment
  getDownloadUrl: async (orderId) => {
    const response = await axiosInstance.get(`/paid-notes/payment-success/${orderId}`);
    return response.data;
  }
};

// Teacher API calls (authentication required)
export const teacherNotesApi = {
  // Create new paid note
  createNote: async (noteData) => {
    const formData = new FormData();
    formData.append('title', noteData.title);
    formData.append('description', noteData.description);
    formData.append('subject', noteData.subject);
    formData.append('category', noteData.category);
    formData.append('price', noteData.price);
    if (noteData.file) {
      formData.append('file', noteData.file);
    }

    const response = await axiosInstance.post('/paid-notes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get teacher's notes
  getMyNotes: async () => {
    const response = await axiosInstance.get('/paid-notes/teacher/my-notes');
    return response.data;
  },

  // Update existing note
  updateNote: async (noteId, noteData) => {
    const formData = new FormData();
    formData.append('title', noteData.title);
    formData.append('description', noteData.description);
    formData.append('subject', noteData.subject);
    formData.append('category', noteData.category);
    formData.append('price', noteData.price);
    if (noteData.isActive !== undefined) {
      formData.append('isActive', noteData.isActive);
    }
    if (noteData.file) {
      formData.append('file', noteData.file);
    }

    const response = await axiosInstance.put(`/paid-notes/${noteId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Deactivate note
  deactivateNote: async (noteId) => {
    const response = await axiosInstance.delete(`/paid-notes/${noteId}`);
    return response.data;
  },

  // Toggle note status (activate/deactivate)
  toggleNoteStatus: async (noteId) => {
    const response = await axiosInstance.patch(`/paid-notes/${noteId}/toggle-status`);
    return response.data;
  }
};

// Utility functions
export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(price);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const getFileExtension = (filename) => {
  return filename.split('.').pop().toUpperCase();
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePrice = (price) => {
  const numPrice = parseFloat(price);
  return !isNaN(numPrice) && numPrice > 0;
};
