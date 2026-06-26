export interface InvoiceItem {
  id: string;
  feeType: string;
  amount: number;
}

export interface Invoice {
  id: string;
  studentId: string;
  studentName?: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: 'unpaid' | 'partial' | 'paid';
  items: InvoiceItem[];
}

export interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}
