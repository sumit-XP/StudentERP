import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { FeesStackParamList } from '../../navigation/features/FeesNavigator';
import feeService from '../../services/feeService';
import RazorpayCheckout from 'react-native-razorpay';

type NavProp = StackNavigationProp<FeesStackParamList, 'InvoiceList'>;

interface Invoice {
  id: string | number;
  invoice_number: string;
  total_amount: number;
  late_fee: number;
  amount_paid: number;
  due_date: string;
  invoice_date: string;
  status: 'paid' | 'partial' | 'unpaid';
  class_name?: string;
  section?: string;
}

interface FeeItem {
  id: number;
  fee_type: string;
  amount: number;
}

interface Summary {
  totalBilled: number;
  totalPaid: number;
  totalDue: number;
}

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

const StudentPaymentsScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();

  const [invoices, setInvoices]       = useState<Invoice[]>([]);
  const [itemsMap, setItemsMap]       = useState<Record<string | number, FeeItem[]>>({});
  const [summary, setSummary]         = useState<Summary>({ totalBilled: 0, totalPaid: 0, totalDue: 0 });
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [expandedId, setExpandedId]   = useState<string | number | null>(null);
  const [payingId, setPayingId]       = useState<string | number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await feeService.getMyInvoices();
      const rawInvoices: Invoice[] = (data.invoices || []).map((inv: any) => ({
        id:             inv.id,
        invoice_number: inv.invoice_number || `INV-${inv.id}`,
        total_amount:   parseFloat(inv.total_amount) || 0,
        late_fee:       parseFloat(inv.late_fee) || 0,
        amount_paid:    parseFloat(inv.amount_paid) || 0,
        due_date:       inv.due_date || '',
        invoice_date:   inv.invoice_date || '',
        status:         (inv.status || 'unpaid') as Invoice['status'],
        class_name:     inv.class_name || '',
        section:        inv.section || '',
      }));
      setInvoices(rawInvoices);
      setItemsMap(data.items || {});
      setSummary(data.summary || { totalBilled: 0, totalPaid: 0, totalDue: 0 });
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed to load fee data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const handlePayOnline = async (invoice: Invoice) => {
    const due = invoice.total_amount + invoice.late_fee - invoice.amount_paid;
    if (due <= 0) {
      Alert.alert('Already Paid', 'This invoice is fully paid.');
      return;
    }
    setPayingId(invoice.id);
    try {
      const order = await feeService.createRazorpayOrder(invoice.id);
      const options = {
        description:  `Fee Payment – ${invoice.invoice_number}`,
        image:        'https://i.imgur.com/3g7nmJC.png',
        currency:     'INR',
        key:          order.keyId || order.key_id,
        amount:       String(order.amount),
        name:         'School ERP',
        order_id:     order.orderId || order.order_id,
        theme:        { color: '#1565c0' },
        prefill:      {},
      };

      const data = await RazorpayCheckout.open(options);
      await feeService.verifyRazorpayPayment({
        invoiceId:           invoice.id,
        razorpayOrderId:     data.razorpay_order_id,
        razorpayPaymentId:   data.razorpay_payment_id,
        razorpaySignature:   data.razorpay_signature,
      });
      Alert.alert('✅ Payment Successful!', 'Your payment has been verified and recorded.');
      await loadData();
    } catch (err: any) {
      if (err?.code && err?.description) {
        Alert.alert('Payment Cancelled', err.description || 'Payment was not completed.');
      } else {
        Alert.alert('Error', err?.response?.data?.error || 'Payment failed. Please try again.');
      }
    } finally {
      setPayingId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1565c0" />
        <Text style={styles.loadingText}>Loading your fee details…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <Text style={styles.pageTitle}>My Fee Payments</Text>
        <Text style={styles.pageSubtitle}>View your invoices and make online payments</Text>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          {[
            { label: 'Total Billed',     value: fmtAmount(summary.totalBilled),  color: '#1565c0', bg: '#e3f2fd' },
            { label: 'Total Paid',       value: fmtAmount(summary.totalPaid),    color: '#2e7d32', bg: '#e8f5e9' },
            { label: 'Balance Due',      value: fmtAmount(summary.totalDue),     color: '#c62828', bg: '#ffebee' },
          ].map(s => (
            <View key={s.label} style={[styles.summaryCard, { backgroundColor: s.bg }]}>
              <Text style={[styles.summaryAmount, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.summaryLabel, { color: s.color }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Invoice list */}
        {invoices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📄</Text>
            <Text style={styles.emptyTitle}>No Invoices Found</Text>
            <Text style={styles.emptySubtitle}>You have no fee invoices yet. Contact your school admin if this seems incorrect.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Invoices ({invoices.length})</Text>
            {invoices.map(inv => {
              const totalDue = inv.total_amount + inv.late_fee - inv.amount_paid;
              const sc = STATUS_COLOR[inv.status] || STATUS_COLOR.unpaid;
              const items: FeeItem[] = itemsMap[inv.id] || [];
              const isExpanded = expandedId === inv.id;
              const isPaying = payingId === inv.id;

              return (
                <View key={String(inv.id)} style={styles.invoiceCard}>
                  {/* Invoice header */}
                  <TouchableOpacity
                    style={styles.invoiceHeader}
                    onPress={() => setExpandedId(isExpanded ? null : inv.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.invoiceHeaderLeft}>
                      <Text style={styles.invoiceNumber}>{inv.invoice_number}</Text>
                      <Text style={styles.invoiceDate}>
                        {inv.class_name ? `${inv.class_name} ${inv.section}  ·  ` : ''}
                        Due: {fmt(inv.due_date)}
                      </Text>
                    </View>
                    <View style={styles.invoiceHeaderRight}>
                      <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                        <Text style={[styles.statusText, { color: sc.text }]}>
                          {inv.status.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.invoiceTotal}>{fmtAmount(inv.total_amount + inv.late_fee)}</Text>
                      <Text style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <View style={styles.invoiceDetail}>
                      {/* Fee Breakdown */}
                      <Text style={styles.detailSectionTitle}>Fee Breakdown</Text>
                      {items.length === 0 ? (
                        <Text style={styles.noItems}>No line items available.</Text>
                      ) : items.map((it, i) => (
                        <View key={i} style={styles.itemRow}>
                          <Text style={styles.itemType}>{it.fee_type}</Text>
                          <Text style={styles.itemAmount}>{fmtAmount(it.amount)}</Text>
                        </View>
                      ))}

                      {/* Divider */}
                      <View style={styles.divider} />

                      {/* Amount summary */}
                      {[
                        { label: 'Total Billed',  value: fmtAmount(inv.total_amount + inv.late_fee), bold: false },
                        { label: 'Amount Paid',   value: fmtAmount(inv.amount_paid),                bold: false },
                        { label: 'Balance Due',   value: fmtAmount(totalDue),                       bold: true, color: totalDue > 0 ? '#c62828' : '#2e7d32' },
                      ].map(r => (
                        <View key={r.label} style={styles.summaryRowInline}>
                          <Text style={[styles.summaryRowLabel, r.bold && styles.bold]}>{r.label}</Text>
                          <Text style={[styles.summaryRowValue, r.bold && styles.bold, r.color ? { color: r.color } : {}]}>{r.value}</Text>
                        </View>
                      ))}

                      {/* Pay button */}
                      {inv.status !== 'paid' && (
                        <TouchableOpacity
                          style={[styles.payBtn, isPaying && styles.payBtnDisabled]}
                          onPress={() => handlePayOnline(inv)}
                          disabled={isPaying}
                        >
                          {isPaying ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <>
                              <Text style={styles.payBtnIcon}>💳</Text>
                              <Text style={styles.payBtnText}>
                                Pay {fmtAmount(totalDue)} Online
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}

                      {inv.status === 'paid' && (
                        <View style={styles.paidBanner}>
                          <Text style={styles.paidBannerText}>✅ Fully Paid</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8faff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#666', marginTop: 8 },
  container: { padding: 16, paddingBottom: 40 },

  pageTitle:    { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 2 },
  pageSubtitle: { fontSize: 13, color: '#6b7280', marginBottom: 20 },

  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  summaryCard: {
    flex: 1, borderRadius: 14, padding: 12, alignItems: 'center',
  },
  summaryAmount: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  summaryLabel:  { fontSize: 11, fontWeight: '600' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 12 },

  invoiceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  invoiceHeaderLeft:  { flex: 1 },
  invoiceHeaderRight: { alignItems: 'flex-end', gap: 4 },
  invoiceNumber: { fontSize: 14, fontWeight: '700', color: '#111827', fontVariant: ['tabular-nums'] },
  invoiceDate:   { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  invoiceTotal:  { fontSize: 16, fontWeight: '800', color: '#111827' },
  statusBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText:    { fontSize: 10, fontWeight: '700' },
  chevron:       { fontSize: 12, color: '#9ca3af' },

  invoiceDetail: { borderTopWidth: 1, borderTopColor: '#f3f4f6', padding: 14 },

  detailSectionTitle: { fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  noItems: { fontSize: 13, color: '#9ca3af', fontStyle: 'italic', marginBottom: 8 },

  itemRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  itemType:   { fontSize: 14, color: '#374151' },
  itemAmount: { fontSize: 14, fontWeight: '600', color: '#111827' },

  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 10 },

  summaryRowInline: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  summaryRowLabel:  { fontSize: 14, color: '#6b7280' },
  summaryRowValue:  { fontSize: 14, color: '#374151' },
  bold: { fontWeight: '700' },

  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1565c0',
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },
  payBtnDisabled: { opacity: 0.6 },
  payBtnIcon:     { fontSize: 18 },
  payBtnText:     { color: '#fff', fontWeight: '700', fontSize: 15 },

  paidBanner: {
    backgroundColor: '#d1fae5',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    alignItems: 'center',
  },
  paidBannerText: { color: '#065f46', fontWeight: '700', fontSize: 14 },

  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji:     { fontSize: 56, marginBottom: 16 },
  emptyTitle:     { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 8 },
  emptySubtitle:  { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingHorizontal: 20 },
});

export default StudentPaymentsScreen;
