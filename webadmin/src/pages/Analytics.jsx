import { useEffect, useState } from 'react'
import api from '../services/api'

export default function Analytics() {
  const [overview, setOverview] = useState(null)
  const [attendance, setAttendance] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/analytics/dashboard'),
      api.get('/analytics/attendance')
    ])
      .then(([o, a]) => {
        setOverview(o.data.overview || null)
        setAttendance(a.data.attendanceAnalytics || null)
      })
      .catch(err => setError(err?.response?.data?.error || 'Failed to load analytics'))
  }, [])

  if (error) return <div className="card text-red-600">{error}</div>

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="font-semibold mb-2">Key Metrics</div>
        {!overview ? 'Loading...' : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {overview.totalUsers !== undefined && (
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-gray-500">Users</div>
                <div className="text-2xl font-semibold">{overview.totalUsers}</div>
              </div>
            )}
            {overview.totalStudents !== undefined && (
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-gray-500">Students</div>
                <div className="text-2xl font-semibold">{overview.totalStudents}</div>
              </div>
            )}
            {overview.totalTeachers !== undefined && (
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-gray-500">Teachers</div>
                <div className="text-2xl font-semibold">{overview.totalTeachers}</div>
              </div>
            )}
            {overview.totalClasses !== undefined && (
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-gray-500">Classes</div>
                <div className="text-2xl font-semibold">{overview.totalClasses}</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <div className="font-semibold mb-2">Attendance Summary</div>
        {!attendance ? 'Loading...' : (
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-3 border rounded-lg">
              <div className="text-sm text-gray-500">Total Records</div>
              <div className="text-2xl font-semibold">{attendance.total_records ?? 0}</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-sm text-gray-500">Present</div>
              <div className="text-2xl font-semibold text-teal-700">{attendance.present_count ?? 0}</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-sm text-gray-500">Absent</div>
              <div className="text-2xl font-semibold text-red-600">{attendance.absent_count ?? 0}</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-sm text-gray-500">Late</div>
              <div className="text-2xl font-semibold text-amber-600">{attendance.late_count ?? 0}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
