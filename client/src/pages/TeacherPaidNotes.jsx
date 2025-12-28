import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, TrendingUp, FileText, ToggleLeft, ToggleRight } from 'lucide-react';
import { teacherNotesApi, formatPrice, formatDate } from '../api/paidNotesApi';
import { AuthContext } from '../context/AuthContext';
import { isTeacher } from '../utils/roleUtils';
import { toast } from '../utils/toast';

const TeacherPaidNotes = () => {
  const { user } = useContext(AuthContext);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalNotes: 0,
    totalSales: 0,
    totalRevenue: 0,
    activeNotes: 0
  });

  useEffect(() => {
    if (isTeacher(user)) {
      fetchMyNotes();
    }
  }, [user]);

  const fetchMyNotes = async () => {
    try {
      setLoading(true);
      const response = await teacherNotesApi.getMyNotes();
      setNotes(response.data);
      calculateStats(response.data);
    } catch (error) {
      toast.error('Failed to fetch your notes');
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (notesData) => {
    const totalNotes = notesData.length;
    const activeNotes = notesData.filter(note => note.isActive).length;
    const totalSales = notesData.reduce((sum, note) => sum + note.salesCount, 0);
    const totalRevenue = notesData.reduce((sum, note) => sum + (note.salesCount * note.price), 0);

    setStats({
      totalNotes,
      totalSales,
      totalRevenue,
      activeNotes
    });
  };

  const handleToggleNoteStatus = async (noteId, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} this note?`)) {
      try {
        const response = await teacherNotesApi.toggleNoteStatus(noteId);
        toast.success(response.data.message);
        fetchMyNotes(); // Refresh the list
      } catch (error) {
        toast.error(`Failed to ${action} note`);
        console.error(`Error ${action}ing note:`, error);
      }
    }
  };

  if (!isTeacher(user)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">Only teachers can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto container-padding py-4 sm:py-6 lg:py-8">
      {/* Mobile-Optimized Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">My Paid Notes</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">Manage your uploaded notes and track sales</p>
          </div>
          <Link
            to="/teacher/paid-notes/create"
            className="btn-mobile inline-flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            <span className="hidden sm:inline">Upload New Note</span>
            <span className="sm:hidden">Upload Note</span>
          </Link>
        </div>
      </div>

      {/* Mobile-Optimized Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <div className="bg-white dark:bg-secondary-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-3 sm:p-4 lg:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="ml-3 sm:ml-4 lg:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Notes</dt>
                  <dd className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 dark:text-white">{stats.totalNotes}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-secondary-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-3 sm:p-4 lg:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
              </div>
              <div className="ml-3 sm:ml-4 lg:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Active Notes</dt>
                  <dd className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 dark:text-white">{stats.activeNotes}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-secondary-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-3 sm:p-4 lg:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
              </div>
              <div className="ml-3 sm:ml-4 lg:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Sales</dt>
                  <dd className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 dark:text-white">{stats.totalSales}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-secondary-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-3 sm:p-4 lg:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
              </div>
              <div className="ml-3 sm:ml-4 lg:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Revenue</dt>
                  <dd className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 dark:text-white">{formatPrice(stats.totalRevenue)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Notes Section */}
      <div className="bg-white dark:bg-secondary-800 shadow-sm overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-4 sm:px-6 sm:py-5">
          <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900 dark:text-white">Your Notes</h3>
          <p className="mt-1 max-w-2xl text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Manage and track performance of your uploaded notes
          </p>
        </div>

        {loading ? (
          <div className="px-4 py-4 sm:px-6 sm:py-5">
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="h-16 sm:h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        ) : notes.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notes.map((note) => (
              <div key={note._id} className="p-4 sm:p-6">
                {/* Mobile-Optimized Note Card */}
                <div className="space-y-3 sm:space-y-4">
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm sm:text-base font-medium text-blue-600 dark:text-blue-400 line-clamp-2 flex-1">
                          {note.title}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                          note.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {note.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Subject:</span>
                      <span>{note.subject?.name || 'Subject not specified'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Category:</span>
                      <span>{note.category}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Price:</span>
                      <span className="text-green-600 dark:text-green-400 font-medium">{formatPrice(note.price)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Sales:</span>
                      <span>{note.salesCount}</span>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Revenue:</span>
                      <span className="text-green-600 dark:text-green-400 font-medium">{formatPrice(note.salesCount * note.price)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Uploaded:</span>
                      <span>{formatDate(note.uploadDate)}</span>
                    </div>
                  </div>

                  {/* Actions Row - Mobile Optimized */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex gap-2 sm:gap-3 flex-1">
                      <Link
                        to={`/paid-notes/${note._id}`}
                        className="btn-mobile flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-secondary-700 hover:bg-gray-50 dark:hover:bg-secondary-600 transition-colors"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        View
                      </Link>
                      <Link
                        to={`/teacher/paid-notes/edit/${note._id}`}
                        className="btn-mobile flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-secondary-700 hover:bg-gray-50 dark:hover:bg-secondary-600 transition-colors"
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Edit
                      </Link>
                    </div>
                    <button
                      onClick={() => handleToggleNoteStatus(note._id, note.isActive)}
                      className={`btn-mobile flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                        note.isActive 
                          ? 'border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 bg-white dark:bg-secondary-700 hover:bg-red-50 dark:hover:bg-red-900/20' 
                          : 'border-green-300 dark:border-green-600 text-green-700 dark:text-green-400 bg-white dark:bg-secondary-700 hover:bg-green-50 dark:hover:bg-green-900/20'
                      }`}
                    >
                      {note.isActive ? (
                        <>
                          <ToggleRight className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">Deactivate</span>
                          <span className="sm:hidden">Disable</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">Activate</span>
                          <span className="sm:hidden">Enable</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 sm:px-6 sm:py-12 text-center">
            <FileText className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-500 mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">No notes uploaded yet</h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 px-4">
              Start by uploading your first paid note to share your knowledge with students.
            </p>
            <Link
              to="/teacher/paid-notes/create"
              className="btn-mobile inline-flex items-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Upload Your First Note
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherPaidNotes;
