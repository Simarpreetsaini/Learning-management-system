import React, { useState, useEffect, useContext, useCallback } from 'react';
import { toast } from '../utils/toast';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { getStudentPhotoUrl } from '../utils/fileUtils';
import {
  getMyAcademicDetails,
  createAcademicDetails,
  updateAcademicDetails,
  deleteAcademicDetails,
  getDepartments,
  getSemesters
} from '../api/academicDetailsApi';
import {
  User,
  Calendar,
  Phone,
  Mail,
  GraduationCap,
  Building,
  Users,
  BookOpen,
  Edit3,
  Trash2,
  Save,
  X,
  Upload,
  Camera,
  CheckCircle,
  AlertCircle,
  FileText,
  Home,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';

// Move InputField component outside to prevent re-creation on every render
const InputField = React.memo(({ label, name, type = "text", required = false, icon: Icon, placeholder, options, formData, errors, onChange, ...props }) => {
  const hasError = errors[name];
  const hasValue = formData[name] && formData[name].toString().trim() !== '';

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-secondary-700 dark:text-secondary-300">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-secondary-500" />}
          {label}
          {required && <span className="text-error-500">*</span>}
        </div>
      </label>
      
      <div className="relative">
        {type === 'select' ? (
          <select
            name={name}
            value={formData[name]}
            onChange={onChange}
            className={`input w-full transition-all duration-200 ${
              hasError 
                ? 'border-error-300 focus:border-error-500 focus:ring-error-500' 
                : hasValue 
                  ? 'border-success-300 focus:border-primary-500 focus:ring-primary-500' 
                  : 'border-secondary-300 focus:border-primary-500 focus:ring-primary-500'
            }`}
            {...props}
          >
            <option value="">{placeholder}</option>
            {options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            name={name}
            value={formData[name]}
            onChange={onChange}
            placeholder={placeholder}
            className={`input w-full transition-all duration-200 resize-none ${
              hasError 
                ? 'border-error-300 focus:border-error-500 focus:ring-error-500' 
                : hasValue 
                  ? 'border-success-300 focus:border-primary-500 focus:ring-primary-500' 
                  : 'border-secondary-300 focus:border-primary-500 focus:ring-primary-500'
            }`}
            rows={3}
            {...props}
          />
        ) : (
          <input
            type={type}
            name={name}
            value={formData[name]}
            onChange={onChange}
            placeholder={placeholder}
            className={`input w-full transition-all duration-200 ${
              hasError 
                ? 'border-error-300 focus:border-error-500 focus:ring-error-500' 
                : hasValue 
                  ? 'border-success-300 focus:border-primary-500 focus:ring-primary-500' 
                  : 'border-secondary-300 focus:border-primary-500 focus:ring-primary-500'
            }`}
            {...props}
          />
        )}
        
        {hasValue && !hasError && (
          <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-success-500" />
        )}
        
        {hasError && (
          <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-error-500" />
        )}
      </div>
      
      {hasError && (
        <p className="text-sm text-error-600 flex items-center gap-1 animate-slide-down">
          <AlertCircle className="h-4 w-4" />
          {hasError}
        </p>
      )}
    </div>
  );
});

const AcademicDetails = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [academicDetails, setAcademicDetails] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [formProgress, setFormProgress] = useState(0);

  const [formData, setFormData] = useState({
    universityRollNo: '',
    classRollNo: '',
    fullname: '',
    fathername: '',
    mothername: '',
    dob: '',
    department: '',
    semester: '',
    section: '',
    phone: '',
    fatherphone: '',
    email: '',
    photo: null,
    session: '',
    lateralEntry: false
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    calculateFormProgress();
  }, [formData]);

  const calculateFormProgress = () => {
    const requiredFields = [
      'universityRollNo', 'classRollNo', 'fullname', 'fathername', 'mothername',
      'dob', 'department', 'semester', 'section', 'phone', 'fatherphone', 'email', 'session'
    ];
    
    const filledFields = requiredFields.filter(field => {
      if (field === 'department' || field === 'semester') {
        return formData[field] !== '';
      }
      return formData[field] && formData[field].toString().trim() !== '';
    });
    
    const progress = Math.round((filledFields.length / requiredFields.length) * 100);
    setFormProgress(progress);
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      const [deptResponse, semResponse] = await Promise.all([
        getDepartments(),
        getSemesters()
      ]);
      
      setDepartments(deptResponse.departments || []);
      setSemesters(semResponse.semesters || []);

      try {
        const response = await getMyAcademicDetails();
        if (response.success && response.academicDetails) {
          setAcademicDetails(response.academicDetails);
          populateFormData(response.academicDetails);
        }
      } catch (error) {
        console.log('No academic details found');
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load page data');
    } finally {
      setLoading(false);
    }
  };

  const populateFormData = (details) => {
    setFormData({
      universityRollNo: details.universityRollNo || '',
      classRollNo: details.classRollNo || '',
      fullname: details.fullname || '',
      fathername: details.fathername || '',
      mothername: details.mothername || '',
      dob: details.dob ? new Date(details.dob).toISOString().split('T')[0] : '',
      department: details.department?._id || '',
      semester: details.semester?._id || '',
      section: details.section || '',
      phone: details.phone || '',
      fatherphone: details.fatherphone || '',
      email: details.email || '',
      photo: null,
      session: details.session || '',
      lateralEntry: details.lateralEntry || false
    });
    
    if (details.photo) {
      setPhotoPreview(getStudentPhotoUrl(details.photo));
    }
  };

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      const file = files[0];
      setFormData(prevData => ({
        ...prevData,
        [name]: file
      }));
      
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPhotoPreview(e.target.result);
        reader.readAsDataURL(file);
      }
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    if (errors[name]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: ''
      }));
    }
  }, [errors]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setFormData(prevData => ({
          ...prevData,
          photo: file
        }));
        const reader = new FileReader();
        reader.onload = (e) => setPhotoPreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        toast.error('Please upload an image file');
      }
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.universityRollNo.trim()) newErrors.universityRollNo = 'Registration Number is required';
    if (!formData.classRollNo.trim()) newErrors.classRollNo = 'Class Roll No is required';
    if (!formData.fullname.trim()) newErrors.fullname = 'Full Name is required';
    if (!formData.fathername.trim()) newErrors.fathername = 'Father Name is required';
    if (!formData.mothername.trim()) newErrors.mothername = 'Mother Name is required';
    if (!formData.dob) newErrors.dob = 'Date of Birth is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.semester) newErrors.semester = 'Semester is required';
    if (!formData.section.trim()) newErrors.section = 'Section is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    else if (!/^[0-9]{10}$/.test(formData.phone)) newErrors.phone = 'Phone must be 10 digits';
    if (!formData.fatherphone.trim()) newErrors.fatherphone = 'Father Phone is required';
    else if (!/^[0-9]{10}$/.test(formData.fatherphone)) newErrors.fatherphone = 'Father Phone must be 10 digits';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.session.trim()) newErrors.session = 'Session is required';
    else if (!/^[0-9]{4}-[0-9]{4}$/.test(formData.session)) newErrors.session = 'Session format should be YYYY-YYYY (e.g., 2023-2024)';
    
    if (!academicDetails && !formData.photo) {
      newErrors.photo = 'Photo is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    try {
      setSubmitting(true);
      
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'photo') {
          if (formData[key]) {
            submitData.append(key, formData[key]);
          }
        } else {
          submitData.append(key, formData[key]);
        }
      });

      let response;
      if (academicDetails) {
        response = await updateAcademicDetails(submitData);
        toast.success('Academic details updated successfully!');
      } else {
        response = await createAcademicDetails(submitData);
        toast.success('Academic details created successfully!');
      }

      if (response.success) {
        setAcademicDetails(response.academicDetails);
        setIsEditing(false);
        populateFormData(response.academicDetails);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error.message || 'Failed to save academic details');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      await deleteAcademicDetails();
      toast.success('Academic details deleted successfully!');
      setAcademicDetails(null);
      setFormData({
        universityRollNo: '',
        classRollNo: '',
        fullname: '',
        fathername: '',
        mothername: '',
        dob: '',
        department: '',
        semester: '',
        section: '',
        phone: '',
        fatherphone: '',
        email: '',
        photo: null,
        session: '',
        lateralEntry: false
      });
      setPhotoPreview(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting academic details:', error);
      toast.error(error.message || 'Failed to delete academic details');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-secondary-900 dark:to-secondary-800 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-secondary-600 dark:text-secondary-400">Loading academic details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-secondary-900 dark:to-secondary-800">
      {/* Header */}
      <div className="bg-white dark:bg-secondary-800 shadow-soft border-b border-secondary-200 dark:border-secondary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 py-3 text-sm text-secondary-600 dark:text-secondary-400">
            <Home className="h-4 w-4" />
            <ChevronRight className="h-4 w-4" />
            <span>Student Portal</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-primary-600 dark:text-primary-400 font-medium">Academic Details</span>
          </div>
          
          {/* Main Header */}
          <div className="py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-xl">
                    <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  Academic Details
                </h1>
                <p className="mt-2 text-secondary-600 dark:text-secondary-400">
                  {academicDetails ? 'Manage your academic information' : 'Complete your academic profile'}
                </p>
              </div>
              
              {academicDetails && !isEditing && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit Details
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="btn-error flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
            
            {/* Progress Bar for Form */}
            {isEditing && (
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm text-secondary-600 dark:text-secondary-400 mb-2">
                  <span>Form Completion</span>
                  <span>{formProgress}%</span>
                </div>
                <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${formProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!academicDetails && !isEditing ? (
          /* Empty State */
          <div className="card max-w-2xl mx-auto text-center animate-fade-in">
            <div className="card-body py-12">
              <div className="mx-auto w-24 h-24 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mb-6">
                <FileText className="h-12 w-12 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">
                No Academic Details Found
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400 mb-6">
                You haven't filled your academic details yet. Complete your profile to access all features.
              </p>
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary btn-lg flex items-center gap-2 mx-auto"
              >
                <Edit3 className="h-5 w-5" />
                Fill Academic Details
              </button>
            </div>
          </div>
        ) : !isEditing ? (
          /* View Mode */
          <div className="space-y-6 animate-fade-in">
            {/* Student Photo & Basic Info Card */}
            <div className="card">
              <div className="card-header bg-gradient-to-r from-primary-600 to-primary-700 text-white">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Student Profile
                </h2>
              </div>
              <div className="card-body">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Photo Section */}
                  <div className="lg:w-64 flex-shrink-0">
                    <div className="bg-secondary-50 dark:bg-secondary-800 rounded-xl p-6 text-center">
                      <div className="mb-4">
                        {academicDetails.photo ? (
                          <img
                            src={getStudentPhotoUrl(academicDetails.photo)}
                            alt={academicDetails.fullname}
                            className="w-32 h-40 sm:w-36 sm:h-44 object-cover rounded-xl border-4 border-white shadow-medium mx-auto"
                          />
                        ) : (
                          <div className="w-32 h-40 sm:w-36 sm:h-44 bg-secondary-200 dark:bg-secondary-700 rounded-xl border-4 border-white shadow-medium mx-auto flex items-center justify-center">
                            <div className="text-center">
                              <User className="h-12 w-12 text-secondary-400 mx-auto mb-2" />
                              <p className="text-sm text-secondary-500">No Photo</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="bg-white dark:bg-secondary-700 rounded-lg p-3 shadow-sm">
                          <p className="text-xs font-medium text-secondary-600 dark:text-secondary-400">Registration Number</p>
                          <p className="font-bold text-secondary-900 dark:text-white">{academicDetails.universityRollNo}</p>
                        </div>
                        <div className="bg-white dark:bg-secondary-700 rounded-lg p-3 shadow-sm">
                          <p className="text-xs font-medium text-secondary-600 dark:text-secondary-400">Class Roll</p>
                          <p className="font-bold text-secondary-900 dark:text-white">{academicDetails.classRollNo}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-secondary-600 dark:text-secondary-400">Full Name</label>
                        <p className="text-lg font-semibold text-secondary-900 dark:text-white">{academicDetails.fullname}</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-secondary-600 dark:text-secondary-400">Date of Birth</label>
                        <p className="text-lg text-secondary-900 dark:text-white flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-secondary-500" />
                          {new Date(academicDetails.dob).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-secondary-600 dark:text-secondary-400">Father's Name</label>
                        <p className="text-lg text-secondary-900 dark:text-white">{academicDetails.fathername}</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-secondary-600 dark:text-secondary-400">Mother's Name</label>
                        <p className="text-lg text-secondary-900 dark:text-white">{academicDetails.mothername}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="card">
              <div className="card-header bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Academic Information
                </h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-secondary-600 dark:text-secondary-400">Department</label>
                    <p className="text-lg text-secondary-900 dark:text-white flex items-center gap-2">
                      <Building className="h-4 w-4 text-secondary-500" />
                      {academicDetails.department?.name} ({academicDetails.department?.code})
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-secondary-600 dark:text-secondary-400">Semester</label>
                    <p className="text-lg text-secondary-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-secondary-500" />
                      {academicDetails.semester?.name}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-secondary-600 dark:text-secondary-400">Section</label>
                    <p className="text-lg text-secondary-900 dark:text-white flex items-center gap-2">
                      <Users className="h-4 w-4 text-secondary-500" />
                      Section {academicDetails.section}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-secondary-600 dark:text-secondary-400">Session</label>
                    <p className="text-lg text-secondary-900 dark:text-white">{academicDetails.session}</p>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-secondary-200 dark:border-secondary-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-secondary-600 dark:text-secondary-400">Entry Type</span>
                    <span className={`badge ${academicDetails.lateralEntry ? 'badge-warning' : 'badge-success'}`}>
                      {academicDetails.lateralEntry ? 'Lateral Entry' : 'Regular Entry'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="card">
              <div className="card-header bg-gradient-to-r from-green-600 to-green-700 text-white">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                    <label className="text-sm font-semibold text-secondary-600 dark:text-secondary-400">Email Address</label>
                    <p className="text-lg text-secondary-900 dark:text-white flex items-center gap-2">
                      <Mail className="h-4 w-4 text-secondary-500 flex-shrink-0" />
                      <span className="break-all">{academicDetails.email}</span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-secondary-600 dark:text-secondary-400">Phone Number</label>
                    <p className="text-lg text-secondary-900 dark:text-white flex items-center gap-2">
                      <Phone className="h-4 w-4 text-secondary-500" />
                      {academicDetails.phone}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-secondary-600 dark:text-secondary-400">Father's Phone</label>
                    <p className="text-lg text-secondary-900 dark:text-white flex items-center gap-2">
                      <Phone className="h-4 w-4 text-secondary-500" />
                      {academicDetails.fatherphone}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
            {/* Photo Upload Section */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Student Photograph
                </h3>
              </div>
              <div className="card-body">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Photo Preview */}
                  <div className="lg:w-64 flex-shrink-0">
                    <div className="bg-secondary-50 dark:bg-secondary-800 rounded-xl p-6 text-center">
                      {photoPreview ? (
                        <div className="relative">
                          <img
                            src={photoPreview}
                            alt="Preview"
                            className="w-32 h-40 sm:w-36 sm:h-44 object-cover rounded-xl border-4 border-white shadow-medium mx-auto"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPhotoPreview(null);
                              setFormData(prevData => ({
                                ...prevData,
                                photo: null
                              }));
                            }}
                            className="absolute -top-2 -right-2 bg-error-500 text-white rounded-full p-1 hover:bg-error-600 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-32 h-40 sm:w-36 sm:h-44 bg-secondary-200 dark:bg-secondary-700 rounded-xl border-4 border-dashed border-secondary-300 dark:border-secondary-600 mx-auto flex items-center justify-center">
                          <div className="text-center">
                            <Camera className="h-8 w-8 text-secondary-400 mx-auto mb-2" />
                            <p className="text-sm text-secondary-500">Upload Photo</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload Area */}
                  <div className="flex-1">
                    <div
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
                        dragActive
                          ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                          : errors.photo
                            ? 'border-error-300 bg-error-50 dark:bg-error-900/20'
                            : 'border-secondary-300 dark:border-secondary-600 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        name="photo"
                        onChange={handleInputChange}
                        accept="image/*"
                        className="hidden"
                        id="photo-upload"
                      />
                      <label htmlFor="photo-upload" className="cursor-pointer">
                        <Upload className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
                          Upload Student Photo
                        </h4>
                        <p className="text-secondary-600 dark:text-secondary-400 mb-4">
                          Drag and drop your photo here, or click to browse
                        </p>
                        <div className="btn-primary inline-flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          Choose Photo
                        </div>
                      </label>
                      <p className="text-xs text-secondary-500 mt-4">
                        Supported formats: JPG, PNG, GIF (Max 5MB)
                      </p>
                    </div>
                    {errors.photo && (
                      <p className="text-sm text-error-600 flex items-center gap-1 mt-2">
                        <AlertCircle className="h-4 w-4" />
                        {errors.photo}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="card">
              <div className="card-header bg-gradient-to-r from-primary-600 to-primary-700 text-white">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <InputField
                    label="Registration Number"
                    name="universityRollNo"
                    icon={FileText}
                    placeholder="Enter university roll number"
                    formData={formData}
                    errors={errors}
                    onChange={handleInputChange}
                    required
                  />
                  <InputField
                    label="Class Roll Number"
                    name="classRollNo"
                    icon={FileText}
                    placeholder="Enter class roll number"
                    formData={formData}
                    errors={errors}
                    onChange={handleInputChange}
                    required
                  />
                  <InputField
                    label="Full Name"
                    name="fullname"
                    icon={User}
                    placeholder="Enter full name"
                    formData={formData}
                    errors={errors}
                    onChange={handleInputChange}
                    required
                  />
                  <InputField
                    label="Date of Birth"
                    name="dob"
                    type="date"
                    icon={Calendar}
                    formData={formData}
                    errors={errors}
                    onChange={handleInputChange}
                    required
                  />
                  <InputField
                    label="Father's Name"
                    name="fathername"
                    icon={User}
                    placeholder="Enter father's name"
                    formData={formData}
                    errors={errors}
                    onChange={handleInputChange}
                    required
                  />
                  <InputField
                    label="Mother's Name"
                    name="mothername"
                    icon={User}
                    placeholder="Enter mother's name"
                    formData={formData}
                    errors={errors}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="card">
              <div className="card-header bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Academic Information
                </h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <InputField
                    label="Department"
                    name="department"
                    type="select"
                    icon={Building}
                    placeholder="Select Department"
                    options={departments.map(dept => ({
                      value: dept._id,
                      label: `${dept.name} (${dept.code})`
                    }))}
                    formData={formData}
                    errors={errors}
                    onChange={handleInputChange}
                    required
                  />
                  <InputField
                    label="Semester"
                    name="semester"
                    type="select"
                    icon={BookOpen}
                    placeholder="Select Semester"
                    options={semesters.map(sem => ({
                      value: sem._id,
                      label: sem.name
                    }))}
                    formData={formData}
                    errors={errors}
                    onChange={handleInputChange}
                    required
                  />
                  <InputField
                    label="Section"
                    name="section"
                    type="select"
                    icon={Users}
                    placeholder="Select Section"
                    options={[
                      { value: 'A', label: 'Section A' },
                      { value: 'B', label: 'Section B' },
                      { value: 'C', label: 'Section C' },
                      { value: 'D', label: 'Section D' }
                    ]}
                    formData={formData}
                    errors={errors}
                    onChange={handleInputChange}
                    required
                  />
                  <InputField
                    label="Academic Session"
                    name="session"
                    icon={Calendar}
                    placeholder="e.g., 2023-2024"
                    formData={formData}
                    errors={errors}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="mt-6 pt-6 border-t border-secondary-200 dark:border-secondary-700">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="lateralEntry"
                      checked={formData.lateralEntry}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                    />
                    <label className="ml-3 block text-sm font-medium text-secondary-900 dark:text-white">
                      Lateral Entry Student
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="card">
              <div className="card-header bg-gradient-to-r from-green-600 to-green-700 text-white">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <InputField
                      label="Email Address"
                      name="email"
                      type="email"
                      icon={Mail}
                      placeholder="Enter email address"
                      formData={formData}
                      errors={errors}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <InputField
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    icon={Phone}
                    placeholder="Enter 10-digit phone number"
                    formData={formData}
                    errors={errors}
                    onChange={handleInputChange}
                    required
                  />
                  <InputField
                    label="Father's Phone Number"
                    name="fatherphone"
                    type="tel"
                    icon={Phone}
                    placeholder="Enter 10-digit phone number"
                    formData={formData}
                    errors={errors}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="card">
              <div className="card-body">
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      if (academicDetails) {
                        populateFormData(academicDetails);
                      }
                    }}
                    className="btn-secondary flex items-center gap-2 justify-center"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary flex items-center gap-2 justify-center disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {academicDetails ? 'Update Details' : 'Save Details'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-xl max-w-md w-full animate-scale-in">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-error-100 dark:bg-error-900 rounded-full mb-4">
                <AlertCircle className="h-6 w-6 text-error-600 dark:text-error-400" />
              </div>
              <h3 className="text-lg font-semibold text-center text-secondary-900 dark:text-white mb-2">
                Delete Academic Details
              </h3>
              <p className="text-center text-secondary-600 dark:text-secondary-400 mb-6">
                Are you sure you want to delete your academic details? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="flex-1 btn-error disabled:opacity-50"
                >
                  {submitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicDetails;
