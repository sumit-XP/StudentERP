import apiClient from '../api/client';

export const feeService = {
  getFeeReports: async (endpoint: string) => {
    // Allows passing dynamic endpoints based on the active tab (e.g., /fees/pending, /fees/history)
    const response = await apiClient.get(endpoint);
    return response.data?.data || response.data;
  },
  
  processPayment: async (paymentData: any) => {
    const response = await apiClient.post('/fees/pay', paymentData);
    return response.data?.data || response.data;
  },
  
  createRazorpayOrder: async (invoiceId: string) => {
    const response = await apiClient.post('/fees/razorpay/create-order', { invoiceId });
    return response.data?.data || response.data;
  },

  verifyRazorpayPayment: async (data: any) => {
    const response = await apiClient.post('/fees/razorpay/verify', data);
    return response.data?.data || response.data;
  }
};

export default feeService;
