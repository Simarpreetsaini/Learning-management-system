import React from 'react';

const StudentCumulativeAttendanceView = ({ records }) => {
  if (!records || records.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No cumulative attendance records found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {records.map(record => (
        <div key={record._id} className="bg-white p-4 sm:p-6 rounded-lg shadow border">
          {/* Mobile-optimized header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-2 sm:space-y-0">
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                <h3 className="text-lg sm:text-xl font-bold text-green-600">
                  Combined Subjects Attendance
                </h3>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full w-fit">
                  Cumulative
                </span>
              </div>
              <p className="text-gray-600 text-sm">Session: {record.session}</p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-base sm:text-lg font-semibold text-gray-900">
                Data up to: {new Date(record.dateUpTo).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-500">
                Total Lectures: {record.totalLecturesHeld}
              </div>
            </div>
          </div>

          {record.studentData && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded">
                <div className="font-medium text-blue-800 text-xs sm:text-sm">Lectures Attended</div>
                <div className="text-lg sm:text-xl font-bold text-blue-900">{record.studentData.lecturesAttended}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-medium text-gray-800 text-xs sm:text-sm">Total Lectures</div>
                <div className="text-lg sm:text-xl font-bold text-gray-900">{record.totalLecturesHeld}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <div className="font-medium text-purple-800 text-xs sm:text-sm">Permissible (75%)</div>
                <div className="text-lg sm:text-xl font-bold text-purple-900">{record.permissibleLectures}</div>
              </div>
              <div className={`p-3 rounded ${
                record.studentData.status === 'Adequate' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className={`font-medium text-xs sm:text-sm ${
                  record.studentData.status === 'Adequate' ? 'text-green-800' : 'text-red-800'
                }`}>
                  Status
                </div>
                <div className={`text-lg sm:text-xl font-bold ${
                  record.studentData.status === 'Adequate' ? 'text-green-900' : 'text-red-900'
                }`}>
                  {record.studentData.attendancePercentage}% - {record.studentData.status}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default StudentCumulativeAttendanceView;
