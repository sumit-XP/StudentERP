import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ParentPayments() {
    const [studentId, setStudentId] = useState('');
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchInvoices = async () => {
        if (!studentId.trim()) {
            setError('Please enter a Student ID');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/fees/invoices`, {
                params: { studentId },
                headers: { Authorization: `Bearer ${token}` }
            });
            setInvoices(response.data.invoices || []);
            if (response.data.invoices.length === 0) {
                setError('No invoices found for this student');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch invoices');
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePayNow = async (invoice) => {
        try {
            const token = localStorage.getItem('token');

            // Create Razorpay order
            const orderResponse = await axios.post(
                `${API_URL}/fees/razorpay/create-order`,
                { invoiceId: invoice.id },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const { orderId, amount, currency, keyId } = orderResponse.data;

            // Razorpay Checkout Options
            const options = {
                key: keyId,
                amount: amount,
                currency: currency,
                name: 'School ERP System',
                description: `Payment for Invoice ${invoice.invoice_number}`,
                order_id: orderId,
                handler: async function (response) {
                    try {
                        // Verify payment
                        await axios.post(
                            `${API_URL}/fees/razorpay/verify`,
                            {
                                invoiceId: invoice.id,
                                razorpayOrderId: response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpaySignature: response.razorpay_signature
                            },
                            { headers: { Authorization: `Bearer ${token}` } }
                        );

                        alert('Payment successful!');
                        fetchInvoices(); // Refresh invoices
                    } catch (err) {
                        alert('Payment verification failed: ' + (err.response?.data?.error || err.message));
                    }
                },
                prefill: {
                    name: invoice.student_name,
                    email: invoice.student_email || ''
                },
                theme: {
                    color: '#3399cc'
                }
            };

            // Open Razorpay Checkout
            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (err) {
            alert('Failed to initiate payment: ' + (err.response?.data?.error || err.message));
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            paid: 'bg-green-100 text-green-800',
            partial: 'bg-yellow-100 text-yellow-800',
            unpaid: 'bg-red-100 text-red-800'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
                {status?.toUpperCase()}
            </span>
        );
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Parent Fee Payment</h1>

            {/* Student ID Input */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Student ID
                        </label>
                        <input
                            type="text"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && fetchInvoices()}
                            placeholder="Enter student ID"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={fetchInvoices}
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Loading...' : 'Get Invoices'}
                        </button>
                    </div>
                </div>
                {error && (
                    <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}
            </div>

            {/* Invoices Table */}
            {invoices.length > 0 && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Invoice Number
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Student
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Due Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {invoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                            {invoice.invoice_number}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{invoice.student_name}</div>
                                            <div className="text-sm text-gray-500">{invoice.class_name} {invoice.section}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ₹{parseFloat(invoice.total_amount || 0).toFixed(2)}
                                            {invoice.late_fee > 0 && (
                                                <span className="text-red-600 text-xs ml-1">
                                                    (+₹{parseFloat(invoice.late_fee).toFixed(2)} late fee)
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(invoice.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {invoice.status !== 'paid' ? (
                                                <button
                                                    onClick={() => handlePayNow(invoice)}
                                                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                                                >
                                                    Pay Now
                                                </button>
                                            ) : (
                                                <span className="text-green-600 text-sm font-medium">✓ Paid</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Enter the Student ID and click "Get Invoices" to view pending fees</li>
                    <li>Click "Pay Now" to make a payment via Razorpay</li>
                    <li>You will need to add Razorpay credentials in the backend .env file</li>
                    <li>For testing, use Razorpay test mode credentials</li>
                </ul>
            </div>

            {/* Load Razorpay Script */}
            <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        </div>
    );
}
