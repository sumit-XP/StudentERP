import { useState, useEffect } from 'react';
import { Check, X, ClipboardList } from 'lucide-react';
import api from '../services/api';

export default function Leaves() {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all

    const fetchLeaves = async () => {
        setLoading(true);
        setError('');
        try {
            const params = filter !== 'all' ? { status: filter } : {};
            const response = await api.get('/hr/leaves', { params });
            setLeaves(response.data.leaves || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch leave applications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    const handleApproveReject = async (leaveId, status) => {
        try {
            const user = (function() {
                try {
                    const raw = localStorage.getItem('erp_user') || localStorage.getItem('user');
                    if (!raw || raw === 'undefined') return {};
                    return JSON.parse(raw);
                } catch(e) { return {}; }
            })();

            await api.put(`/hr/leaves/${leaveId}/approve`, {
                status,
                approverId: user.id || user.userId
            });

            alert(`Leave ${status} successfully!`);
            fetchLeaves();
        } catch (err) {
            alert(err.response?.data?.error || `Failed to ${status} leave`);
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
                {status?.toUpperCase()}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="card">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-950">Leave Management</h1>
                        <p className="text-sm text-gray-500">Review staff leave requests and keep approvals moving.</p>
                    </div>
                    <div className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-700">
                        <ClipboardList className="h-4 w-4" />
                        {leaves.length} request{leaves.length === 1 ? '' : 's'}
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-4">
                    {['pending', 'approved', 'rejected', 'all'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`btn ${filter === f ? 'btn-primary' : 'btn-outline'}`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="py-8 text-center text-sm text-gray-500">Loading leave requests...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table-modern">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Employee
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Leave Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        From
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        To
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Reason
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {leaves.map((leave) => (
                                    <tr key={leave.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{leave.user_name}</div>
                                            <div className="text-sm text-gray-500">{leave.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                                            {leave.leave_type}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(leave.from_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(leave.to_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {leave.reason || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(leave.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {leave.status === 'pending' ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApproveReject(leave.id, 'approved')}
                                                    className="btn bg-green-600 px-3 py-1.5 text-white hover:bg-green-700"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleApproveReject(leave.id, 'rejected')}
                                                    className="btn bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                            ) : (
                                                <span className="text-gray-500">
                                                    {leave.approved_by_name ? `By ${leave.approved_by_name}` : '-'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {leaves.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                            No leave applications found for {filter} status.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
