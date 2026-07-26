import { useState, useEffect } from 'react';
import { IndianRupee, Play, ReceiptText } from 'lucide-react';
import api from '../services/api';

export default function Payroll() {
    const [payrollRecords, setPayrollRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [generating, setGenerating] = useState(false);

    const fetchPayroll = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/payroll/legacy', {
                params: { month, year }
            });
            setPayrollRecords(response.data.payroll || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch payroll records');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayroll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [month, year]);

    const handleGeneratePayroll = async () => {
        if (!confirm(`Generate payroll for ${month}/${year}? This cannot be undone if records already exist.`)) {
            return;
        }

        setGenerating(true);
        try {
            await api.post(
                '/payroll/generate',
                { month: parseInt(month), year: parseInt(year) },
            );
            alert('Payroll generated successfully!');
            fetchPayroll();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to generate payroll');
        } finally {
            setGenerating(false);
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            generated: 'bg-blue-100 text-blue-800',
            paid: 'bg-green-100 text-green-800'
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
                        <h1 className="text-2xl font-bold text-gray-950">Payroll Management</h1>
                        <p className="text-sm text-gray-500">Generate salary records and verify payout status by month.</p>
                    </div>
                    <div className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-700">
                        <ReceiptText className="h-4 w-4" />
                        {payrollRecords.length} record{payrollRecords.length === 1 ? '' : 's'}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex gap-2 items-center">
                        <label className="text-sm font-medium">Month:</label>
                        <select
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="input w-32"
                        >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                <option key={m} value={m}>
                                    {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2 items-center">
                        <label className="text-sm font-medium">Year:</label>
                        <select
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="input w-32"
                        >
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleGeneratePayroll}
                        disabled={generating}
                        className="btn btn-primary"
                    >
                        <Play className="h-4 w-4" />
                        {generating ? 'Generating...' : 'Generate Payroll'}
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Stats */}
                {payrollRecords.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="text-sm text-blue-600 font-medium">Total Records</div>
                            <div className="text-2xl font-bold text-blue-900">{payrollRecords.length}</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <div className="text-sm text-green-600 font-medium">Total Payout</div>
                            <div className="flex items-center text-2xl font-bold text-green-900">
                                <IndianRupee className="h-5 w-5" />
                                {payrollRecords.reduce((sum, r) => sum + parseFloat(r.net_salary || 0), 0).toFixed(2)}
                            </div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <div className="text-sm text-purple-600 font-medium">Paid</div>
                            <div className="text-2xl font-bold text-purple-900">
                                {payrollRecords.filter(r => r.status === 'paid').length}
                            </div>
                        </div>
                    </div>
                )}

                {/* Table */}
                {loading ? (
                    <div className="py-8 text-center text-sm text-gray-500">Loading payroll records...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table-modern">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Employee
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Period
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Basic Salary
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Deductions
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Net Salary
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {payrollRecords.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{record.user_name}</div>
                                            <div className="text-sm text-gray-500">{record.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {record.month}/{record.year}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            Rs. {parseFloat(record.basic_salary || 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                            -Rs. {parseFloat(record.deductions || 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                            Rs. {parseFloat(record.net_salary || 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(record.status)}
                                        </td>
                                    </tr>
                                ))}
                                {payrollRecords.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                            No payroll records found for {month}/{year}. Click "Generate Payroll" to create.
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
