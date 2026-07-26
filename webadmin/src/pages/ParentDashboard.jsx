import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ParentDashboard() {
    const [activeTab, setActiveTab] = useState('attendance');
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Tab data states
    const [attendanceData, setAttendanceData] = useState({ records: [], summary: null });
    const [feesData, setFeesData] = useState({ invoices: [], totalDue: 0 });
    const [noticesData, setNoticesData] = useState([]);

    // Loading states for each tab
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [feesLoading, setFeesLoading] = useState(false);
    const [noticesLoading, setNoticesLoading] = useState(false);

    useEffect(() => {
        fetchStudentData();
    }, []);

    useEffect(() => {
        if (student) {
            if (activeTab === 'attendance') fetchAttendanceData();
            if (activeTab === 'fees') fetchFeesData();
            if (activeTab === 'notices') fetchNoticesData();
        }
    }, [activeTab, student]);

    const fetchStudentData = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('erp_jwt') || localStorage.getItem('token');
            const user = (function() {
                try {
                    const raw = localStorage.getItem('erp_user') || localStorage.getItem('user');
                    if (!raw || raw === 'undefined') return {};
                    return JSON.parse(raw);
                } catch(e) { return {}; }
            })();

            // Get student linked to parent
            const studentsRes = await axios.get(`${API_URL}/academic/students`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { parentId: user.id }
            });

            const studentData = studentsRes.data.students?.[0];
            if (!studentData) {
                setStudent(null);
                setError("No student linked to your account");
                setLoading(false);
                return;
            }

            setStudent(studentData);
        } catch (err) {
            console.error('Failed to fetch student data:', err);
            setError("Failed to load student data");
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendanceData = async () => {
        if (!student) return;
        setAttendanceLoading(true);
        try {
            const token = localStorage.getItem('erp_jwt') || localStorage.getItem('token');
            const currentMonth = new Date();
            const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
            const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

            // Fetch attendance for current month
            const attendanceRes = await axios.get(`${API_URL}/attendance/student`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { studentId: student.id, startDate: start, endDate: end }
            });

            setAttendanceData({
                records: attendanceRes.data.records || [],
                summary: attendanceRes.data.summary || null
            });
        } catch (err) {
            console.error('Failed to fetch attendance:', err);
            setAttendanceData({ records: [], summary: null });
        } finally {
            setAttendanceLoading(false);
        }
    };

    const fetchFeesData = async () => {
        if (!student) return;
        setFeesLoading(true);
        try {
            const token = localStorage.getItem('erp_jwt') || localStorage.getItem('token');

            const feesRes = await axios.get(`${API_URL}/fees/invoices`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { studentId: student.id }
            });

            const invoices = feesRes.data.invoices || [];
            const totalDue = invoices.reduce((sum, inv) => {
                return inv.status !== 'paid' ? sum + parseFloat(inv.total_amount || 0) : sum;
            }, 0);

            setFeesData({ invoices, totalDue });
        } catch (err) {
            console.error('Failed to fetch fees:', err);
            setFeesData({ invoices: [], totalDue: 0 });
        } finally {
            setFeesLoading(false);
        }
    };

    const fetchNoticesData = async () => {
        setNoticesLoading(true);
        try {
            const token = localStorage.getItem('erp_jwt') || localStorage.getItem('token');

            const noticesRes = await axios.get(`${API_URL}/communication/announcements`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { targetAudience: 'parents' }
            });

            setNoticesData(noticesRes.data.announcements || []);
        } catch (err) {
            console.error('Failed to fetch notices:', err);
            setNoticesData([]);
        } finally {
            setNoticesLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            present: 'bg-green-100 text-green-800',
            absent: 'bg-red-100 text-red-800',
            late: 'bg-yellow-100 text-yellow-800',
            excused: 'bg-blue-100 text-blue-800'
        };
        return styles[status] || 'bg-gray-100 text-gray-800';
    };

    const getFeeStatusBadge = (status) => {
        const styles = {
            paid: 'bg-green-100 text-green-800',
            unpaid: 'bg-red-100 text-red-800',
            partial: 'bg-yellow-100 text-yellow-800',
            cancelled: 'bg-gray-100 text-gray-800'
        };
        return styles[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-600">Loading...</div>
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="card text-center py-12">
                <div className="text-6xl mb-4">👨‍👩‍👧</div>
                <h2 className="text-xl font-bold text-gray-700 mb-2">No Student Linked</h2>
                <p className="text-gray-600 max-w-md mx-auto">
                    {error || "Please contact the school administration to link your child's account."}
                </p>
            </div>
        );
    }

    const tabs = [
        { id: 'attendance', label: '📋 Attendance', color: 'blue' },
        { id: 'fees', label: '💰 Fees', color: 'yellow' },
        { id: 'notices', label: '📢 Notices', color: 'purple' },
    ];

    return (
        <div className="space-y-6">
            {/* Student Info Header */}
            <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                        {student.name?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
                        <p className="text-sm text-gray-600">
                            {student.class_name} {student.section} • Roll No: {student.roll_number}
                        </p>
                        <p className="text-sm text-gray-600">Student ID: {student.student_id}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Parent Portal</p>
                        <p className="text-xs text-gray-400">{format(new Date(), 'MMMM d, yyyy')}</p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                ${activeTab === tab.id
                                    ? `border-${tab.color}-500 text-${tab.color}-600`
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }
                            `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {/* Attendance Tab */}
                {activeTab === 'attendance' && (
                    <div className="space-y-4">
                        {attendanceLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-lg text-gray-600">Loading attendance...</div>
                            </div>
                        ) : attendanceData.records.length === 0 ? (
                            <div className="card text-center py-12">
                                <div className="text-5xl mb-4">📋</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Records</h3>
                                <p className="text-gray-500">No attendance data found for the current month.</p>
                            </div>
                        ) : (
                            <>
                                {/* Attendance Summary */}
                                {attendanceData.summary && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="card bg-green-50 text-center">
                                            <div className="text-2xl font-bold text-green-600">{attendanceData.summary.present || 0}</div>
                                            <div className="text-sm text-gray-600">Present</div>
                                        </div>
                                        <div className="card bg-red-50 text-center">
                                            <div className="text-2xl font-bold text-red-600">{attendanceData.summary.absent || 0}</div>
                                            <div className="text-sm text-gray-600">Absent</div>
                                        </div>
                                        <div className="card bg-yellow-50 text-center">
                                            <div className="text-2xl font-bold text-yellow-600">{attendanceData.summary.late || 0}</div>
                                            <div className="text-sm text-gray-600">Late</div>
                                        </div>
                                        <div className="card bg-blue-50 text-center">
                                            <div className="text-2xl font-bold text-blue-600">{attendanceData.summary.percentage || 0}%</div>
                                            <div className="text-sm text-gray-600">Attendance</div>
                                        </div>
                                    </div>
                                )}

                                {/* Attendance Table */}
                                <div className="card">
                                    <h3 className="font-semibold text-lg mb-4">
                                        Attendance for {format(new Date(), 'MMMM yyyy')}
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {attendanceData.records.map((record, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                            {format(new Date(record.date), 'MMM d, yyyy')}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                            {format(new Date(record.date), 'EEEE')}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(record.status)}`}>
                                                                {record.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                            {record.remarks || '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Fees Tab */}
                {activeTab === 'fees' && (
                    <div className="space-y-4">
                        {feesLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-lg text-gray-600">Loading fees...</div>
                            </div>
                        ) : feesData.invoices.length === 0 ? (
                            <div className="card text-center py-12">
                                <div className="text-5xl mb-4">💰</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Fee Records</h3>
                                <p className="text-gray-500">No fee invoices found for your child.</p>
                            </div>
                        ) : (
                            <>
                                {/* Fee Summary */}
                                <div className="card bg-yellow-50 border border-yellow-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Outstanding Balance</h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {feesData.invoices.filter(inv => inv.status !== 'paid').length} unpaid invoice(s)
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-bold text-yellow-600">
                                                ₹{feesData.totalDue.toFixed(2)}
                                            </div>
                                            <Link to="/parent-payments" className="text-sm text-blue-600 hover:underline mt-1 inline-block">
                                                Pay Now →
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* Fees Table */}
                                <div className="card">
                                    <h3 className="font-semibold text-lg mb-4">Fee Invoices</h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice Date</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {feesData.invoices.map((invoice, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {invoice.invoice_number}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                            {format(new Date(invoice.invoice_date), 'MMM d, yyyy')}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                            {invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : '-'}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            ₹{parseFloat(invoice.total_amount).toFixed(2)}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFeeStatusBadge(invoice.status)}`}>
                                                                {invoice.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Notices Tab */}
                {activeTab === 'notices' && (
                    <div className="space-y-4">
                        {noticesLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-lg text-gray-600">Loading notices...</div>
                            </div>
                        ) : noticesData.length === 0 ? (
                            <div className="card text-center py-12">
                                <div className="text-5xl mb-4">📢</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Notices</h3>
                                <p className="text-gray-500">No announcements or notices at this time.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {noticesData.map((notice) => (
                                    <div key={notice.id} className="card hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                <span className="text-2xl">📢</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-gray-900">{notice.title}</h3>
                                                    {notice.announcement_type === 'urgent' && (
                                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                            Urgent
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">{notice.content}</p>
                                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                                    <span>Posted: {format(new Date(notice.created_at), 'MMM d, yyyy')}</span>
                                                    <span>Target: {notice.target_audience}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
