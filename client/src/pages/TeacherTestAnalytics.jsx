import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import { toast } from '../utils/toast';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const TeacherTestAnalytics = () => {
  const [statistics, setStatistics] = useState(null);
  const [testsWithStats, setTestsWithStats] = useState([]);
  const [studentPerformance, setStudentPerformance] = useState([]);
  const [studentsWithoutTests, setStudentsWithoutTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [statsRes, testsRes, performanceRes] = await Promise.all([
        axios.get('/teacher/statistics'),
        axios.get('/teacher/tests/with-stats'),
        axios.get('/teacher/student-performance')
      ]);

      setStatistics(statsRes.data.statistics);
      setTestsWithStats(testsRes.data.tests);
      setStudentPerformance(performanceRes.data.studentPerformance);
      setStudentsWithoutTests(performanceRes.data.studentsWithoutTests);
    } catch (error) {
      toast.error('Failed to fetch analytics data');
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader title="Test Analytics Dashboard" />
      
      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('tests')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Test Performance
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'students'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Student Performance
            </button>
          </nav>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && statistics && (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="text-sm font-medium text-gray-500">Total Tests</div>
              <div className="text-2xl font-bold text-gray-900">{statistics.totalTests}</div>
              <div className="text-sm text-gray-600">
                {statistics.activeTests} active, {statistics.inactiveTests} inactive
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-sm font-medium text-gray-500">Total Submissions</div>
              <div className="text-2xl font-bold text-gray-900">{statistics.totalSubmissions}</div>
              <div className="text-sm text-gray-600">
                Across all tests
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-sm font-medium text-gray-500">Average Score</div>
              <div className={`text-2xl font-bold ${getScoreColor(statistics.averageScore)}`}>
                {statistics.averageScore}%
              </div>
              <div className="text-sm text-gray-600">
                Overall performance
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-sm font-medium text-gray-500">Tests Without Submissions</div>
              <div className="text-2xl font-bold text-orange-600">
                {statistics.testsWithNoSubmissions?.length || 0}
              </div>
              <div className="text-sm text-gray-600">
                Need attention
              </div>
            </Card>
          </div>

          {/* Subject Performance */}
          {statistics.subjectPerformance && statistics.subjectPerformance.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Subject-wise Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statistics.subjectPerformance.map((subject, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="font-medium text-gray-900">{subject._id}</div>
                    <div className={`text-xl font-bold ${getScoreColor(subject.averageScore)}`}>
                      {Math.round(subject.averageScore)}%
                    </div>
                    <div className="text-sm text-gray-600">
                      {subject.totalSubmissions} submissions
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Tests Without Submissions */}
          {statistics.testsWithNoSubmissions && statistics.testsWithNoSubmissions.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-orange-600">
                Tests Without Submissions ({statistics.testsWithNoSubmissions.length})
              </h3>
              <div className="space-y-2">
                {statistics.testsWithNoSubmissions.map((test) => (
                  <div key={test._id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <div className="font-medium text-gray-900">{test.title}</div>
                      <div className="text-sm text-gray-600">
                        Created: {formatDate(test.createdAt)}
                      </div>
                    </div>
                    <Link to={`/teacher/tests/${test._id}/submissions`}>
                      <Button size="sm">View Details</Button>
                    </Link>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Test Performance Tab */}
      {activeTab === 'tests' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">All Tests Performance</h3>
          <Table>
            <thead>
              <tr>
                <th>Test Title</th>
                <th>Subject</th>
                <th>Submissions</th>
                <th>Average Score</th>
                <th>Last Submission</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {testsWithStats.map((test) => (
                <tr key={test._id}>
                  <td className="font-medium">{test.title}</td>
                  <td>{test.subject?.name || 'N/A'}</td>
                  <td>
                    <Badge variant={test.submissionCount > 0 ? 'success' : 'secondary'}>
                      {test.submissionCount}
                    </Badge>
                  </td>
                  <td>
                    <span className={getScoreColor(test.averageScore)}>
                      {test.averageScore}%
                    </span>
                  </td>
                  <td>
                    {test.lastSubmission ? formatDate(test.lastSubmission) : 'No submissions'}
                  </td>
                  <td>
                    <Badge variant={test.isActive ? 'success' : 'secondary'}>
                      {test.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <Link to={`/teacher/tests/${test._id}/submissions`}>
                        <Button size="sm">View Submissions</Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Student Performance Tab */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Students with Test Performance */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Student Performance ({studentPerformance.length} students)
            </h3>
            <Table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Username</th>
                  <th>Tests Taken</th>
                  <th>Average Score</th>
                  <th>Best Score</th>
                  <th>Worst Score</th>
                  <th>Subjects</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentPerformance.map((student) => (
                  <tr key={student.studentInfo._id}>
                    <td className="font-medium">{student.studentInfo.fullname}</td>
                    <td>{student.studentInfo.username}</td>
                    <td>
                      <Badge variant="primary">{student.totalTests}</Badge>
                    </td>
                    <td>
                      <span className={getScoreColor(student.averageScore)}>
                        {student.averageScore}%
                      </span>
                    </td>
                    <td>
                      <span className={getScoreColor(student.bestScore)}>
                        {student.bestScore}%
                      </span>
                    </td>
                    <td>
                      <span className={getScoreColor(student.worstScore)}>
                        {student.worstScore}%
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {student.subjects.slice(0, 2).map((subject, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {subject}
                          </Badge>
                        ))}
                        {student.subjects.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{student.subjects.length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>

          {/* Students Without Tests */}
          {studentsWithoutTests.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-orange-600">
                Students Who Haven't Taken Any Tests ({studentsWithoutTests.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {studentsWithoutTests.map((student) => (
                  <div key={student._id} className="border rounded-lg p-4">
                    <div className="font-medium text-gray-900">{student.fullname}</div>
                    <div className="text-sm text-gray-600">{student.username}</div>
                    <div className="mt-2">
                      <Badge variant="warning">No tests taken</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-8 flex justify-between">
        <Link to="/tests">
          <Button variant="outline">Back to Tests</Button>
        </Link>
        <Button onClick={fetchAnalyticsData}>
          Refresh Data
        </Button>
      </div>
    </div>
  );
};

export default TeacherTestAnalytics;
