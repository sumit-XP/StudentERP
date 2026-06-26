import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import apiClient from '../../api/client';
import { Invoice } from '../../types/fees';
import { FeesStackParamList } from '../../navigation/features/FeesNavigator';

type NavProp = StackNavigationProp<FeesStackParamList, 'InvoiceDetail'>;
type RoutePropType = RouteProp<FeesStackParamList, 'InvoiceDetail'>;

const InvoiceDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { invoiceId } = route.params;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get(`/fees/invoices/${invoiceId}`)
      .then((res) => {
        const data = res.data as { data?: Invoice } | Invoice;
        setInvoice((data as { data?: Invoice }).data ?? (data as Invoice));
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1565c0" />
      </View>
    );
  }
  if (error || !invoice) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? 'Not found'}</Text>
      </View>
    );
  }

  const balance = invoice.amount - invoice.paidAmount;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Invoice Details</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fee Breakdown</Text>
        {invoice.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemLabel}>{item.feeType}</Text>
            <Text style={styles.itemAmount}>₹{item.amount}</Text>
          </View>
        ))}
      </View>
      <View style={styles.summary}>
        <Text style={styles.summaryRow}>Total: ₹{invoice.amount}</Text>
        <Text style={styles.summaryRow}>Paid: ₹{invoice.paidAmount}</Text>
        <Text style={[styles.summaryRow, styles.balanceText]}>Balance: ₹{balance}</Text>
      </View>
      {invoice.status !== 'paid' && (
        <TouchableOpacity
          style={styles.payBtn}
          onPress={() => navigation.navigate('OnlinePayment', { invoiceId: invoice.id })}
        >
          <Text style={styles.payBtnText}>Pay Online</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 16 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#555', marginBottom: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemLabel: { fontSize: 14, color: '#333' },
  itemAmount: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  summary: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    elevation: 1,
  },
  summaryRow: { fontSize: 15, color: '#333', marginBottom: 6 },
  balanceText: { color: '#c62828', fontWeight: '700' },
  payBtn: { backgroundColor: '#1565c0', borderRadius: 8, padding: 16, alignItems: 'center' },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: { color: 'red', fontSize: 14 },
});

export default InvoiceDetailScreen;
