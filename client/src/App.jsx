import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Public Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PinEntryPage from './pages/PinEntryPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import PublicPYQs from './pages/PublicPYQs';
import PublicFeedback from './pages/PublicFeedback';

// Dashboard Components
import Dashboard from './pages/Dashboard';
import Departments from './pages/Departments';
import Semesters from './pages/Semesters';
import Subjects from './pages/Subjects';
import Assignments from './pages/Assignments';
import Tests from './pages/Tests';
import TakeTest from './pages/TakeTest';
import TestReview from './pages/TestReview';
import TestRecords from './pages/TestRecords';
import Noticeboard from './pages/Noticeboard';
import StudyMaterials from './pages/StudyMaterials';
import Attendance from './pages/Attendance';
import PreviousYearQuestions from './pages/PreviousYearQuestions';
import ELibrary from './pages/ELibrary';
import ImportantDocuments from './pages/ImportantDocuments';
import ImageGallery from './pages/ImageGallery';
import HotLinks from './pages/HotLinks';
import AcademicDetails from './pages/AcademicDetails';
import ChangePassword from './pages/ChangePassword';

// Paid Notes Components
import PaidNotes from './pages/PaidNotes';
import PaidNoteDetails from './pages/PaidNoteDetails';
import TeacherPaidNotes from './pages/TeacherPaidNotes';
import CreatePaidNote from './pages/CreatePaidNote';
import EditPaidNote from './pages/EditPaidNote';
import DownloadPage from './pages/DownloadPage';
import TeacherTestSubmissions from './pages/TeacherTestSubmissions';
import TeacherTestAnalytics from './pages/TeacherTestAnalytics';
import TeacherAssignmentSubmissions from './pages/TeacherAssignmentSubmissions';
import TeacherStudentManagement from './pages/TeacherStudentManagement';
import TeacherAcademicMarks from './pages/TeacherAcademicMarks';
import StudentAcademicMarks from './pages/StudentAcademicMarks';
import Activities from './pages/Activities';
import TeacherFeedbackManagement from './pages/TeacherFeedbackManagement';
import AdminBulkUserImport from './pages/AdminBulkUserImport';
import AdminUserManagement from './pages/AdminUserManagement';
import Notifications from './pages/Notifications';
 
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<PinEntryPage />} />
          <Route path="/register/form" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Public PYQ Route - No authentication needed */}
          <Route path="/public-pyqs" element={<PublicPYQs />} />

          {/* Public Feedback Route - No authentication needed */}
          <Route path="/feedback" element={<PublicFeedback />} />

          {/* Public Paid Notes Routes - No authentication needed */}
          <Route path="/paid-notes" element={<PaidNotes />} />
          <Route path="/paid-notes/:id" element={<PaidNoteDetails />} />
          <Route path="/noticeboard" element={<Noticeboard />} />

          {/* Download Route - No Layout (standalone page) */}
          <Route path="/download/:orderId/:accessKey" element={<DownloadPage />} />

          {/* Protected Dashboard Route */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/departments" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Layout><Departments /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/semesters" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Layout><Semesters /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/subjects" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Layout><Subjects /></Layout>
            </ProtectedRoute>
          } />

          {/* Teacher & Admin Routes */}
          <Route path="/assignments" element={
            <ProtectedRoute>
              <Layout><Assignments /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/tests" element={
            <ProtectedRoute>
              <Layout><Tests /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/tests/:testId/take" element={
            <ProtectedRoute allowedRoles={['Student']}>
              <Layout><TakeTest /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/tests/:testId/review" element={
            <ProtectedRoute allowedRoles={['Student']}>
              <Layout><TestReview /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/tests/my-records" element={
            <ProtectedRoute allowedRoles={['Student']}>
              <Layout><TestRecords /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/study-materials" element={
            <ProtectedRoute>
              <Layout><StudyMaterials /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/attendance" element={
            <ProtectedRoute allowedRoles={['Teacher', 'Admin', 'Student']}>
              <Layout><Attendance /></Layout>
            </ProtectedRoute>
          } />

          {/* Additional LMS Features */}
          <Route path="/previous-year-questions" element={
            <ProtectedRoute>
              <Layout><PreviousYearQuestions /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/e-library" element={
            <ProtectedRoute>
              <Layout><ELibrary /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/important-documents" element={
            <ProtectedRoute>
              <Layout><ImportantDocuments /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/image-gallery" element={
            <ProtectedRoute>
              <Layout><ImageGallery /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/hot-links" element={
            <ProtectedRoute>
              <Layout><HotLinks /></Layout>
            </ProtectedRoute>
          } />

          {/* Academic Details Route - Student Only */}
          <Route path="/academic-details" element={
            <ProtectedRoute allowedRoles={['Student']}>
              <Layout><AcademicDetails /></Layout>
            </ProtectedRoute>
          } />

          {/* Change Password Route - All authenticated users */}
          <Route path="/change-password" element={
            <ProtectedRoute>
              <Layout><ChangePassword /></Layout>
            </ProtectedRoute>
          } />

          {/* Teacher Paid Notes Routes */}
          <Route path="/teacher/paid-notes" element={
            <ProtectedRoute allowedRoles={['Teacher']}>
              <Layout><TeacherPaidNotes /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/teacher/paid-notes/create" element={
            <ProtectedRoute allowedRoles={['Teacher']}>
              <Layout><CreatePaidNote /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/teacher/paid-notes/edit/:id" element={
            <ProtectedRoute allowedRoles={['Teacher']}>
              <Layout><EditPaidNote /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/teacher/tests/:id/submissions" element={
            <ProtectedRoute allowedRoles={['Teacher']}>
              <Layout><TeacherTestSubmissions /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/teacher/tests/analytics" element={
            <ProtectedRoute allowedRoles={['Teacher']}>
              <Layout><TeacherTestAnalytics /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/teacher/assignments/:id/submissions" element={
            <ProtectedRoute allowedRoles={['Teacher']}>
              <Layout><TeacherAssignmentSubmissions /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/teacher/student-management" element={
            <ProtectedRoute allowedRoles={['Teacher']}>
              <Layout><TeacherStudentManagement /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/teacher/academic-marks" element={
            <ProtectedRoute allowedRoles={['Teacher', 'Admin']}>
              <Layout><TeacherAcademicMarks /></Layout>
            </ProtectedRoute>
          } />

          {/* Student Academic Marks Route */}
          <Route path="/student/academic-marks" element={
            <ProtectedRoute allowedRoles={['Student']}>
              <Layout><StudentAcademicMarks /></Layout>
            </ProtectedRoute>
          } />

          {/* Activities Route - Teacher and Student access */}
          <Route path="/activities" element={
            <ProtectedRoute allowedRoles={['Teacher', 'Student']}>
              <Layout><Activities /></Layout>
            </ProtectedRoute>
          } />

          {/* Teacher Feedback Management Route */}
          <Route path="/teacher/feedback" element={
            <ProtectedRoute allowedRoles={['Teacher', 'Admin']}>
              <Layout><TeacherFeedbackManagement /></Layout>
            </ProtectedRoute>
          } />

          {/* Admin Bulk User Import Route */}
          <Route path="/admin/bulk-import" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Layout><AdminBulkUserImport /></Layout>
            </ProtectedRoute>
          } />

          {/* Admin User Management Route */}
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Layout><AdminUserManagement /></Layout>
            </ProtectedRoute>
          } />

          {/* Notifications Route - Teacher and Student access */}
          <Route path="/notifications" element={
            <ProtectedRoute allowedRoles={['Teacher', 'Student']}>
              <Layout><Notifications /></Layout>
            </ProtectedRoute>
          } />

          {/* Redirect unknown routes to homepage */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
