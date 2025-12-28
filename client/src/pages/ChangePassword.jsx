import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Card, Button, PageHeader } from '../components/ui';
import { authApi } from '../api/authApi';
import { toast } from '../utils/toast';

const ChangePassword = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Change Password' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    const { currentPassword, newPassword, confirmPassword } = formData;

    if (!currentPassword.trim()) {
      toast.error('Current password is required');
      return false;
    }

    if (!newPassword.trim()) {
      toast.error('New password is required');
      return false;
    }

    if (newPassword.length < 3) {
      toast.error('New password must be at least 3 characters long');
      return false;
    }

    if (newPassword === currentPassword) {
      toast.error('New password must be different from current password');
      return false;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await authApi.changePassword(formData.currentPassword, formData.newPassword);
      
      toast.success('Password changed successfully!');
      
      // Clear form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Change password error:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 401) {
        toast.error('Current password is incorrect');
      } else if (error.response?.status === 400) {
        toast.error('Invalid input. Please check your passwords.');
      } else {
        toast.error('Failed to change password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Change Password"
        subtitle="Update your account password for better security"
        breadcrumbs={breadcrumbs}
      />

      <div className="max-w-md mx-auto">
        <Card>
          <Card.Header>
            <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">
              Change Your Password
            </h2>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              Enter your current password and choose a new one
            </p>
          </Card.Header>
          
          <Card.Body>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Current Password */}
              <div>
                <label 
                  htmlFor="currentPassword" 
                  className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2"
                >
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-700 dark:text-white pr-10"
                    placeholder="Enter your current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600"
                  >
                    {showPasswords.current ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label 
                  htmlFor="newPassword" 
                  className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2"
                >
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-700 dark:text-white pr-10"
                    placeholder="Enter your new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600"
                  >
                    {showPasswords.new ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                  Password must be at least 3 characters long
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label 
                  htmlFor="confirmPassword" 
                  className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2"
                >
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-700 dark:text-white pr-10"
                    placeholder="Confirm your new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600"
                  >
                    {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-secondary-50 dark:bg-secondary-800 p-3 rounded-md">
                <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Password Requirements:
                </h4>
                <ul className="text-xs text-secondary-600 dark:text-secondary-400 space-y-1">
                  <li className={`flex items-center ${formData.newPassword.length >= 3 ? 'text-green-600' : ''}`}>
                    <span className="mr-2">{formData.newPassword.length >= 3 ? '✅' : '❌'}</span>
                    At least 3 characters long
                  </li>
                  <li className={`flex items-center ${formData.newPassword && formData.newPassword !== formData.currentPassword ? 'text-green-600' : ''}`}>
                    <span className="mr-2">{formData.newPassword && formData.newPassword !== formData.currentPassword ? '✅' : '❌'}</span>
                    Different from current password
                  </li>
                  <li className={`flex items-center ${formData.newPassword && formData.confirmPassword && formData.newPassword === formData.confirmPassword ? 'text-green-600' : ''}`}>
                    <span className="mr-2">{formData.newPassword && formData.confirmPassword && formData.newPassword === formData.confirmPassword ? '✅' : '❌'}</span>
                    Passwords match
                  </li>
                </ul>
              </div>
            </form>
          </Card.Body>

          <Card.Footer className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </Button>
          </Card.Footer>
        </Card>
      </div>
    </div>
  );
};

export default ChangePassword;
