import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { FeesStackParamList } from '../../navigation/features/FeesNavigator';
import feeService from '../../services/feeService';
import RazorpayCheckout from 'react-native-razorpay';

type NavProp = StackNavigationProp<FeesStackParamList, 'InvoiceDetail'>;
type RoutePropType = RouteProp<FeesStackParamList, 'InvoiceDetail'>;

const fmt = (d: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const fmtAmount = (n: number) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  paid:    { bg: '#d1fae5', text: '#065f46' },
  partial: { bg: '#fef3c7', text: '#92400e' },
  unpaid:  { bg: '#fee2e2', text: '#991b1b' },
};

const InvoiceDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { invoiceId } = route.params;

  const [loading, setLoading]   = useState(true);
  const [invoice, setInvoice]   = useState<any>(null);
  const [items, setItems]       = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalDue, setTotalDue]   = useState(0);
  const [paying, setPaying]       = useState(false);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const data = await feeService.getInvoiceDetail(invoiceId);
      setInvoice(data.invoice || null);
      setItems(data.items || []);
      setPayments(data.payments || []);
      setTotalPaid(parseFloat(data.totalPaid) || 0);
      setTotalDue(parseFloat(data.totalDue) || 0);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed to load invoice');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDetail(); }, [invoiceId]);

  const handlePayOnline = async () => {
    if (totalDue <= 0) {
      Alert.alert('No dues', 'This invoice is fully paid.');
      return;
    }
    setPaying(true);
    try {
      const order = await feeService.createRazorpayOrder(invoiceId);
      const options = {
        description: `Invoice ${invoice?.invoice_number}`,
        image:       'https://i.imgur.com/3g7nmJC.png',
        currency:    'INR',
        key:         order.keyId || order.key_id,
        amount:      String(order.amount),
        name:        'School ERP',
        order_id:    order.orderId || order.order_id,
        theme:       { color: '#1565c0' },
        prefill:     {},
      };
      const data = await RazorpayCheckout.open(options);
      await feeService.verifyRazorpayPayment({
        invoiceId,
        razorpayOrderId:   data.razorpay_order_id,
        razorpayPaymentId: data.razorpay_payment_id,
        razorpaySignature: data.razorpay_signature,
      });
      Alert.alert('✅ Payment Successful!', 'Your payment has been verified.');
      await loadDetail();
    } catch (err: any) {
      if (err?.code && err?.description) {
        Alert.alert('Cancelled', err.description || 'Payment was not completed.');
      } else {
        Alert.alert('Error', err?.response?.data?.error || 'Payment failed.');
      }
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1565c0" />
      </View>
    );
  }

  if (!invoice) return null;

  const totalBilled = parseFloat(invoice.total_amount) + parseFloat(invoice.late_fee || 0);
  const sc = STATUS_COLOR[invoice.status] || STATUS_COLOR.unpaid;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
              <Text style={styles.studentName}>{invoice.student_name}</Text>
              <Text style={styles.studentMeta}>
                {invoice.class_name} {invoice.section}  ·  {invoice.student_number}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
              <Text style={[styles.statusText, { color: sc.text }]}>{invoice.status.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.headerDates}>
            <Text style={styles.dateLabel}>Issued: {fmt(invoice.invoice_date)}</Text>
            <Text style={styles.dateLabel}>Due: {fmt(invoice.due_date)}</Text>
          </View>
        </View>

        {/* Fee Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fee Breakdown</Text>
          {items.map((it: any, i: number) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemType}>{it.fee_type}</Text>
              <Text style={styles.itemAmount}>{fmtAmount(parseFloat(it.amount))}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          {[
            { label: 'Total Billed', value: fmtAmount(totalBilled), bold: false },
            { label: 'Amount Paid',  value: fmtAmount(totalPaid),   bold: false, color: '#2e7d32' },
            { label: 'Balance Due',  value: fmtAmount(totalDue),    bold: true,  color: totalDue > 0 ? '#c62828' : '#2e7d32' },
          ].map(r => (
            <View key={r.label} style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, r.bold && styles.bold]}>{r.label}</Text>
              <Text style={[styles.summaryValue, r.bold && styles.bold, r.color ? { color: r.color } : {}]}>{r.value}</Text>
            </View>
          ))}
        </View>

        {/* Payment History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          {payments.length === 0 ? (
            <Text style={styles.emptyText}>No payments recorded yet.</Text>
          ) : (
            payments.map((p: any, i: number) => (
              <View key={i} style={styles.paymentRow}>
                <View>
                  <Text style={styles.paymentAmount}>{fmtAmount(parseFloat(p.amount_paid))}</Text>
                  <Text style={styles.paymentMeta}>
                    {(p.payment_method || '').toUpperCase()}  ·  {fmt(p.payment_date)}
                  </Text>
                  {p.receipt_number ? <Text style={styles.paymentReceipt}>{p.receipt_number}</Text> : null}
                  {p.remarks ? <Text style={styles.paymentRemarks}>{p.remarks}</Text> : null}
                </View>
                <View style={styles.paidTag}>
                  <Text style={styles.paidTagText}>✓ PAID</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Actions */}
        {invoice.status !== 'paid' && (
          <TouchableOpacity
            style={[styles.payBtn, paying && styles.payBtnDisabled]}
            onPress={handlePayOnline}
            disabled={paying}
          >
            {paying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payBtnText}>💳  Pay {fmtAmount(totalDue)} Online (Razorpay)</Text>
            )}
          </TouchableOpacity>
        )}

        {invoice.status === 'paid' && (
          <View style={styles.paidBanner}>
            <Text style={styles.paidBannerText}>✅ This invoice is fully paid</Text>
          </View>
        )}

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back to Invoices</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#f8faff' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16, paddingBottom: 40 },

  headerCard: {
    backgroundColor: '#1565c0',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceNumber: { fontSize: 13, color: '#93c5fd', fontWeight: '700', fontVariant: ['tabular-nums'] },
  studentName:   { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 2 },
  studentMeta:   { fontSize: 12, color: '#bfdbfe', marginTop: 3 },
  statusBadge:   { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  statusText:    { fontSize: 11, fontWeight: '800' },
  headerDates:   { flexDirection: 'row', gap: 16 },
  dateLabel:     { fontSize: 12, color: '#bfdbfe' },

  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 },

  itemRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  itemType:   { fontSize: 14, color: '#374151' },
  itemAmount: { fontSize: 14, fontWeight: '600', color: '#111827' },

  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 8 },

  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { fontSize: 14, color: '#6b7280' },
  summaryValue: { fontSize: 14, color: '#374151' },
  bold:         { fontWeight: '700' },

  emptyText: { fontSize: 13, color: '#9ca3af', fontStyle: 'italic' },

  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  paymentAmount:  { fontSize: 15, fontWeight: '700', color: '#065f46' },
  paymentMeta:    { fontSize: 12, color: '#6b7280', marginTop: 2 },
  paymentReceipt: { fontSize: 11, color: '#9ca3af', fontFamily: 'monospace', marginTop: 1 },
  paymentRemarks: { fontSize: 11, color: '#9ca3af', fontStyle: 'italic', marginTop: 1 },
  paidTag: { backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  paidTagText: { fontSize: 11, color: '#065f46', fontWeight: '700' },

  payBtn: {
    backgroundColor: '#1565c0',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  paidBanner: { backgroundColor: '#d1fae5', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12 },
  paidBannerText: { color: '#065f46', fontWeight: '700', fontSize: 15 },

  backBtn: { alignItems: 'center', padding: 12 },
  backBtnText: { color: '#1565c0', fontWeight: '600', fontSize: 14 },
});

export default InvoiceDetailScreen;
