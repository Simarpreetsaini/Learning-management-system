import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axiosInstance from '../api/axios';
import { toast } from '../utils/toast';
import LoadingSpinner from '../components/LoadingSpinner';

const Tests = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
    semester: '',
    subject: '',
    duration: 60,
    totalMarks: 100,
    instructions: '',
    allowReview: false,
    randomizeQuestions: false,
    randomizeOptions: false,
    maxAttempts: 1,
    questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0, marks: 1 }]
  });

  useEffect(() => {
    if (!authLoading && user) {
      fetchTests();
      if (user?.role === 'Teacher' || user?.role === 'Admin') {
        fetchMetadata();
      }
    }
  }, [user, authLoading]);

  const fetchTests = async () => {
    try {
      const endpoint = user?.role === 'Student' ? '/student/tests/available' : '/tests';
      const response = await axiosInstance.get(endpoint);
      setTests(response.data.tests || []);
    } catch (error) {
      toast.error('Failed to fetch tests');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [deptRes, semRes] = await Promise.all([
        axiosInstance.get('/departments'),
        axiosInstance.get('/semesters')
      ]);
      setDepartments(deptRes.data.departments || []);
      setSemesters(semRes.data.semesters || []);
    } catch (error) {
      toast.error('Failed to fetch metadata');
    }
  };

  const fetchSubjects = async (departmentId, semesterId) => {
    if (!departmentId || !semesterId) return;
    try {
      const response = await axiosInstance.get(`/subjects/department/${departmentId}/semester/${semesterId}`);
      setSubjects(response.data.subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to fetch subjects');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'department' || name === 'semester') {
      const departmentId = name === 'department' ? value : formData.department;
      const semesterId = name === 'semester' ? value : formData.semester;
      
      if (departmentId && semesterId) {
        fetchSubjects(departmentId, semesterId);
      } else {
        // Clear subjects if either department or semester is not selected
        setSubjects([]);
      }
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...formData.questions];
    if (field === 'options') {
      updatedQuestions[index].options = value;
    } else {
      updatedQuestions[index][field] = value;
    }
    setFormData(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, { question: '', options: ['', '', '', ''], correctAnswer: 0, marks: 1 }]
    }));
  };

  const removeQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Test title is required');
      return;
    }
    
    if (!formData.department || !formData.semester || !formData.subject) {
      toast.error('Please select department, semester, and subject');
      return;
    }
    
    if (formData.questions.length === 0) {
      toast.error('Test must have at least one question');
      return;
    }
    
    for (let i = 0; i < formData.questions.length; i++) {
      const q = formData.questions[i];
      if (!q.question.trim()) {
        toast.error(`Question ${i + 1} text is required`);
        return;
      }
      
      if (q.options.some(opt => !opt.trim())) {
        toast.error(`All options for Question ${i + 1} must be filled`);
        return;
      }
      
      if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        toast.error(`Invalid correct answer for Question ${i + 1}`);
        return;
      }
      
      if (!q.marks || q.marks < 1) {
        toast.error(`Question ${i + 1} must have at least 1 mark`);
        return;
      }
    }

    try {
      const transformedQuestions = formData.questions.map(q => ({
        questionText: q.question.trim(),
        options: q.options.map(opt => opt.trim()),
        correctAnswerIndex: q.correctAnswer,
        marks: parseInt(q.marks)
      }));

      const calculatedTotalMarks = transformedQuestions.reduce((sum, q) => sum + q.marks, 0);

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        department: formData.department,
        semester: formData.semester,
        subject: formData.subject,
        duration: parseInt(formData.duration),
        totalMarks: calculatedTotalMarks,
        instructions: formData.instructions.trim(),
        allowReview: formData.allowReview,
        randomizeQuestions: formData.randomizeQuestions,
        randomizeOptions: formData.randomizeOptions,
        maxAttempts: parseInt(formData.maxAttempts),
        questions: transformedQuestions
      };

      await axiosInstance.post('/tests', payload);
      toast.success('Test created successfully');
      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        department: '',
        semester: '',
        subject: '',
        duration: 60,
        totalMarks: 100,
        instructions: '',
        allowReview: false,
        randomizeQuestions: false,
        randomizeOptions: false,
        maxAttempts: 1,
        questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0, marks: 1 }]
      });
      fetchTests();
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const errorMessages = validationErrors.map(err => err.msg || err.message).join(', ');
        toast.error(`Validation Error: ${errorMessages}`);
      } else {
        toast.error(error.response?.data?.message || 'Failed to create test');
      }
    }
  };

  const startTest = async (testId) => {
    try {
      const response = await axiosInstance.post(`/student/tests/${testId}/start`);
      toast.success('Test started successfully');
      navigate(`/tests/${testId}/take`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start test');
    }
  };

  const openEditModal = (test) => {
    setEditingTest(test);
    setFormData({
      title: test.title,
      description: test.description,
      department: test.department._id,
      semester: test.semester._id,
      subject: test.subject._id,
      duration: test.duration,
      totalMarks: test.totalMarks,
      instructions: test.instructions || '',
      allowReview: test.allowReview,
      randomizeQuestions: test.randomizeQuestions,
      randomizeOptions: test.randomizeOptions,
      maxAttempts: test.maxAttempts,
      questions: test.questions.map(q => ({
        question: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswerIndex,
        marks: q.marks
      }))
    });
    
    if (test.department._id && test.semester._id) {
      fetchSubjects(test.department._id, test.semester._id);
    }
    
    setShowEditForm(true);
  };

  const closeEditModal = () => {
    setShowEditForm(false);
    setEditingTest(null);
    setFormData({
      title: '',
      description: '',
      department: '',
      semester: '',
      subject: '',
      duration: 60,
      totalMarks: 100,
      instructions: '',
      allowReview: false,
      randomizeQuestions: false,
      randomizeOptions: false,
      maxAttempts: 1,
      questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0, marks: 1 }]
    });
    setSubjects([]);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Test title is required');
      return;
    }
    
    if (formData.questions.length === 0) {
      toast.error('Test must have at least one question');
      return;
    }
    
    for (let i = 0; i < formData.questions.length; i++) {
      const q = formData.questions[i];
      if (!q.question.trim()) {
        toast.error(`Question ${i + 1} text is required`);
        return;
      }
      
      if (q.options.some(opt => !opt.trim())) {
        toast.error(`All options for Question ${i + 1} must be filled`);
        return;
      }
      
      if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        toast.error(`Invalid correct answer for Question ${i + 1}`);
        return;
      }
      
      if (!q.marks || q.marks < 1) {
        toast.error(`Question ${i + 1} must have at least 1 mark`);
        return;
      }
    }

    try {
      const transformedQuestions = formData.questions.map(q => ({
        questionText: q.question.trim(),
        options: q.options.map(opt => opt.trim()),
        correctAnswerIndex: q.correctAnswer,
        marks: parseInt(q.marks)
      }));

      const calculatedTotalMarks = transformedQuestions.reduce((sum, q) => sum + q.marks, 0);

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        department: formData.department,
        semester: formData.semester,
        subject: formData.subject,
        duration: parseInt(formData.duration),
        totalMarks: calculatedTotalMarks,
        instructions: formData.instructions.trim(),
        allowReview: formData.allowReview,
        randomizeQuestions: formData.randomizeQuestions,
        randomizeOptions: formData.randomizeOptions,
        maxAttempts: parseInt(formData.maxAttempts),
        questions: transformedQuestions
      };

      const response = await axiosInstance.put(`/tests/${editingTest._id}`, payload);
      
      if (response.data.success) {
        toast.success('Test updated successfully');
        closeEditModal();
        fetchTests();
      } else {
        throw new Error(response.data.message || 'Failed to update test');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update test';
      toast.error(errorMessage);
    }
  };

  const openDeleteModal = (test) => {
    setSelectedTest(test);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedTest(null);
  };

  const handleDeleteTest = async () => {
    if (!selectedTest) return;

    setDeleteLoading(true);
    try {
      const response = await axiosInstance.delete(`/tests/${selectedTest._id}`);

      if (response.data.success) {
        toast.success('Test deleted successfully');
        closeDeleteModal();
        fetchTests();
      } else {
        throw new Error(response.data.message || 'Failed to delete test');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete test';
      
      if (error.response?.status === 400 && errorMessage.includes('submissions')) {
        toast.error('Cannot delete test: This test already has student submissions.');
      } else if (error.response?.status === 403) {
        toast.error('Access denied: You can only delete your own tests.');
      } else if (error.response?.status === 404) {
        toast.error('Test not found. It may have already been deleted.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="container-padding safe-top safe-bottom min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-500">Please log in to view online tests.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-padding safe-top safe-bottom min-h-screen">
      {/* Mobile-optimized header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Online Tests</h1>
          <p className="text-sm text-gray-600 mt-1 sm:hidden">
            {user?.role === 'Student' ? 'Take online tests and view results' : 'Manage your online tests'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          {user?.role === 'Student' && (
            <button
              onClick={() => navigate('/tests/my-records')}
              className="w-full sm:w-auto bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              📊 My Test Records
            </button>
          )}
          {(user?.role === 'Teacher' || user?.role === 'Admin') && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Create Online Test
            </button>
          )}
        </div>
      </div>

      {/* Mobile-optimized Create Test Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header - Fixed */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Create New Online Test</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <span className="text-xl text-gray-500">×</span>
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter online test title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</label>
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      required
                      min="1"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter online test description"
                  />
                </div>

                {/* Academic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept._id} value={dept._id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
                    <select
                      name="semester"
                      value={formData.semester}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Semester</option>
                      {semesters.map(sem => (
                        <option key={sem._id} value={sem._id}>{sem.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(subj => (
                        <option key={subj._id} value={subj._id}>{subj.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                  <textarea
                    name="instructions"
                    value={formData.instructions}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter online test instructions for students"
                  />
                </div>

                {/* Test Settings */}
                <div className="border-t pt-4">
                  <h3 className="text-base sm:text-lg font-medium mb-4 text-gray-900">Test Settings</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Attempts</label>
                      <input
                        type="number"
                        name="maxAttempts"
                        value={formData.maxAttempts}
                        onChange={handleInputChange}
                        min="1"
                        max="5"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="allowReview"
                          checked={formData.allowReview}
                          onChange={(e) => setFormData(prev => ({ ...prev, allowReview: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm font-medium text-gray-700">Allow Review</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="randomizeQuestions"
                          checked={formData.randomizeQuestions}
                          onChange={(e) => setFormData(prev => ({ ...prev, randomizeQuestions: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm font-medium text-gray-700">Randomize Questions</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="randomizeOptions"
                          checked={formData.randomizeOptions}
                          onChange={(e) => setFormData(prev => ({ ...prev, randomizeOptions: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm font-medium text-gray-700">Randomize Options</label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Questions Section */}
                <div className="border-t pt-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900">Questions</h3>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      ➕ Add Question
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.questions.map((question, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                          <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                          {formData.questions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeQuestion(index)}
                              className="w-full sm:w-auto text-red-600 hover:text-red-800 text-sm font-medium py-1 px-2 hover:bg-red-50 rounded transition-colors"
                            >
                              🗑️ Remove
                            </button>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Question Text *</label>
                            <textarea
                              placeholder="Enter your question here"
                              value={question.question}
                              onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                              required
                              rows="2"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Options *</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {question.options.map((option, optIndex) => (
                                <input
                                  key={optIndex}
                                  type="text"
                                  placeholder={`Option ${optIndex + 1}`}
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...question.options];
                                    newOptions[optIndex] = e.target.value;
                                    handleQuestionChange(index, 'options', newOptions);
                                  }}
                                  required
                                  className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer *</label>
                              <select
                                value={question.correctAnswer}
                                onChange={(e) => handleQuestionChange(index, 'correctAnswer', parseInt(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                {question.options.map((_, optIndex) => (
                                  <option key={optIndex} value={optIndex}>Option {optIndex + 1}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Marks *</label>
                              <input
                                type="number"
                                value={question.marks}
                                onChange={(e) => handleQuestionChange(index, 'marks', parseInt(e.target.value))}
                                min="1"
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modal Footer - Fixed */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-200 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Create Online Test
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-optimized Tests Grid */}
      <div className="space-y-4 sm:space-y-6">
        {tests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No online tests found</h3>
            <p className="text-gray-500 text-sm">
              {user?.role === 'Student' 
                ? 'No online tests are currently available for you.' 
                : 'Create your first online test to get started.'}
            </p>
          </div>
        ) : (
          tests.map(test => (
            <div key={test._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Mobile-optimized test header */}
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{test.title}</h3>
                    {test.description && (
                      <p className="text-gray-600 mt-1 text-sm line-clamp-2">{test.description}</p>
                    )}
                  </div>
                  
                  {/* Mobile-optimized action buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 flex-shrink-0">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium text-center ${
                      test.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {test.isActive ? '✅ Active' : '⏸️ Inactive'}
                    </span>
                    
                    {user?.role === 'Student' && test.isActive && (
                      <button
                        onClick={() => startTest(test._id)}
                        className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                      >
                        🚀 Start Online Test
                      </button>
                    )}
                    
                    {(user?.role === 'Teacher' || user?.role === 'Admin') && (
                      <button
                        onClick={() => navigate(`/teacher/tests/${test._id}/submissions`)}
                        className="bg-purple-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors"
                      >
                        📊 Submissions
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Mobile-optimized test details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-4">
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <span className="font-medium text-gray-700 block">Subject</span>
                    <p className="truncate">{test.subject?.name || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <span className="font-medium text-gray-700 block">Duration</span>
                    <p>{test.duration} min</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <span className="font-medium text-gray-700 block">Marks</span>
                    <p>{test.totalMarks}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <span className="font-medium text-gray-700 block">Questions</span>
                    <p>{test.questions?.length || 0}</p>
                  </div>
                </div>

                {/* Instructions */}
                {test.instructions && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-blue-700 text-sm">📋 Instructions:</span>
                    <p className="text-blue-600 mt-1 text-sm leading-relaxed">{test.instructions}</p>
                  </div>
                )}

                {/* Mobile-optimized Teacher Actions */}
                {(user?.role === 'Teacher' || user?.role === 'Admin') && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <span className="font-medium text-gray-700 text-sm">🎓 Teacher Actions</span>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => openEditModal(test)}
                          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          ✏️ Edit Online Test
                        </button>
                        <button
                          onClick={() => openDeleteModal(test)}
                          className="w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                          🗑️ Delete Online Test
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mobile-optimized Edit Test Modal */}
      {showEditForm && editingTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-1 sm:p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[98vh] sm:max-h-[90vh] overflow-hidden flex flex-col mx-1 sm:mx-0">
            {/* Modal Header - Fixed */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Edit Online Test</h2>
              <button
                onClick={closeEditModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <span className="text-xl text-gray-500">×</span>
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <form onSubmit={handleEditSubmit} className="space-y-4 sm:space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</label>
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      required
                      min="1"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Academic Info - Disabled */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      disabled
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-gray-100 cursor-not-allowed"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept._id} value={dept._id}>{dept.name}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">Cannot be changed after creation</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                    <select
                      name="semester"
                      value={formData.semester}
                      onChange={handleInputChange}
                      disabled
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-gray-100 cursor-not-allowed"
                    >
                      <option value="">Select Semester</option>
                      {semesters.map(sem => (
                        <option key={sem._id} value={sem._id}>{sem.name}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">Cannot be changed after creation</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      disabled
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-gray-100 cursor-not-allowed"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(subj => (
                        <option key={subj._id} value={subj._id}>{subj.name}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">Cannot be changed after creation</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                  <textarea
                    name="instructions"
                    value={formData.instructions}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Test Settings */}
                <div className="border-t pt-4">
                  <h3 className="text-base sm:text-lg font-medium mb-4 text-gray-900">Test Settings</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Attempts</label>
                      <input
                        type="number"
                        name="maxAttempts"
                        value={formData.maxAttempts}
                        onChange={handleInputChange}
                        min="1"
                        max="5"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="allowReview"
                          checked={formData.allowReview}
                          onChange={(e) => setFormData(prev => ({ ...prev, allowReview: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm font-medium text-gray-700">Allow Review</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="randomizeQuestions"
                          checked={formData.randomizeQuestions}
                          onChange={(e) => setFormData(prev => ({ ...prev, randomizeQuestions: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm font-medium text-gray-700">Randomize Questions</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="randomizeOptions"
                          checked={formData.randomizeOptions}
                          onChange={(e) => setFormData(prev => ({ ...prev, randomizeOptions: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm font-medium text-gray-700">Randomize Options</label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Questions Section */}
                <div className="border-t pt-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900">Questions</h3>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      ➕ Add Question
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.questions.map((question, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                          <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                          {formData.questions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeQuestion(index)}
                              className="w-full sm:w-auto text-red-600 hover:text-red-800 text-sm font-medium py-1 px-2 hover:bg-red-50 rounded transition-colors"
                            >
                              🗑️ Remove
                            </button>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Question Text *</label>
                            <textarea
                              placeholder="Enter your question here"
                              value={question.question}
                              onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                              required
                              rows="2"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Options *</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {question.options.map((option, optIndex) => (
                                <input
                                  key={optIndex}
                                  type="text"
                                  placeholder={`Option ${optIndex + 1}`}
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...question.options];
                                    newOptions[optIndex] = e.target.value;
                                    handleQuestionChange(index, 'options', newOptions);
                                  }}
                                  required
                                  className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer *</label>
                              <select
                                value={question.correctAnswer}
                                onChange={(e) => handleQuestionChange(index, 'correctAnswer', parseInt(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                {question.options.map((_, optIndex) => (
                                  <option key={optIndex} value={optIndex}>Option {optIndex + 1}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Marks *</label>
                              <input
                                type="number"
                                value={question.marks}
                                onChange={(e) => handleQuestionChange(index, 'marks', parseInt(e.target.value))}
                                min="1"
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modal Footer - Fixed */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-200 flex-shrink-0">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Update Online Test
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-optimized Delete Test Modal */}
      {showDeleteModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold mb-4 text-red-600">Delete Online Test</h2>
              <div className="mb-4">
                <p className="text-gray-700 mb-3 text-sm sm:text-base">
                  Are you sure you want to delete this online test?
                </p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{selectedTest.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Subject: {selectedTest.subject?.name}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Duration: {selectedTest.duration} minutes
                  </p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-xs sm:text-sm text-red-800">
                  <strong>Warning:</strong> This action cannot be undone. All student submissions for this online test will also be deleted.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={deleteLoading}
                  className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTest}
                  disabled={deleteLoading}
                  className="w-full sm:w-auto px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Online Test'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tests;
