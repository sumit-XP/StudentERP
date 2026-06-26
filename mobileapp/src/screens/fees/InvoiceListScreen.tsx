import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import apiClient from '../../api/client';
import { Invoice } from '../../types/fees';
import { FeesStackParamList } from '../../navigation/features/FeesNavigator';

type NavProp = StackNavigationProp<FeesStackParamList, 'InvoiceList'>;

const STATUS_COLORS: Record<string, string> = {
  unpaid: '#c62828',
  partial: '#ef6c00',
  paid: '#2e7d32',
};

const InvoiceListScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get('/fees/invoices')
      .then((res) => {
        const data = res.data as { data?: Invoice[] } | Invoice[];
        setInvoices(Array.isArray(data) ? data : (data as { data?: Invoice[] }).data ?? []);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1565c0" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={invoices}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={<Text style={styles.empty}>No invoices found.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: item.id })}
        >
          <View style={styles.row}>
            <Text style={styles.studentName}>{item.studentName ?? item.studentId}</Text>
            <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] ?? '#999' }]}>
              <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.amount}>Total: ₹{item.amount}</Text>
          <Text style={styles.balance}>Balance: ₹{item.amount - item.paidAmount}</Text>
          <Text style={styles.due}>Due: {item.dueDate}</Text>
        </TouchableOpacity>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  studentName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', flex: 1 },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  amount: { fontSize: 14, color: '#333' },
  balance: { fontSize: 13, color: '#c62828', marginTop: 2 },
  due: { fontSize: 12, color: '#888', marginTop: 2 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  error: { color: 'red', fontSize: 14 },
});

export default InvoiceListScreen;
