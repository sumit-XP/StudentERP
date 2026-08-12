import apiClient from '../api/client';

export const feeService = {
  // ── My Invoices (student/parent) ────────────────────────────
  getMyInvoices: async () => {
    const response = await apiClient.get('/fees/my-invoices');
    return response.data || { invoices: [], items: {}, summary: { totalBilled: 0, totalPaid: 0, totalDue: 0 } };
  },

  // ── Invoice detail (includes items + payments) ──────────────
  getInvoiceDetail: async (invoiceId: string | number) => {
    const response = await apiClient.get(`/fees/invoices/${invoiceId}`);
    return response.data;
  },

  // ── Fee reports ──────────────────────────────────────────────
  getFeeReports: async (endpoint: string, params?: Record<string, string>) => {
    const response = await apiClient.get(endpoint, { params });
    return response.data?.data || response.data || [];
  },

  // ── Razorpay ─────────────────────────────────────────────────
  createRazorpayOrder: async (invoiceId: string | number) => {
    const response = await apiClient.post('/fees/razorpay/create-order', { invoiceId });
    return response.data;
  },

  verifyRazorpayPayment: async (data: {
    invoiceId: string | number;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => {
    const response = await apiClient.post('/fees/razorpay/verify', data);
    return response.data;
  },
};

export default feeService;
