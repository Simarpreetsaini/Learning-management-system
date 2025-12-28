import axios from './axios';

// Submit feedback (public - no authentication required)
export const submitFeedback = async (feedbackData) => {
  try {
    const response = await axios.post('/feedback/submit', feedbackData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to submit feedback' };
  }
};

// Get all feedback (teachers/admins only)
export const getAllFeedback = async () => {
  try {
    const response = await axios.get('/feedback');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch feedback' };
  }
};

// Respond to feedback (teachers/admins only)
export const respondToFeedback = async (feedbackId, adminResponse) => {
  try {
    const response = await axios.put(`/feedback/${feedbackId}/respond`, {
      adminResponse
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to respond to feedback' };
  }
};

// Update feedback status (teachers/admins only)
export const updateFeedbackStatus = async (feedbackId, status) => {
  try {
    const response = await axios.put(`/feedback/${feedbackId}/status`, {
      status
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update feedback status' };
  }
};
