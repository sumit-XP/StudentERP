import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import apiClient from '../../api/client';
import { RazorpayOrder } from '../../types/fees';
import { FeesStackParamList } from '../../navigation/features/FeesNavigator';

type RoutePropType = RouteProp<FeesStackParamList, 'OnlinePayment'>;

const OnlinePaymentScreen: React.FC = () => {
  const route = useRoute<RoutePropType>();
  const { invoiceId } = route.params;
  const [order, setOrder] = useState<RazorpayOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .post('/fees/razorpay/create-order', { invoiceId })
      .then((res) => {
        const data = res.data as { data?: RazorpayOrder } | RazorpayOrder;
        setOrder((data as { data?: RazorpayOrder }).data ?? (data as RazorpayOrder));
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
  if (error || !order) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? 'Could not create order'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pay Online</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Amount</Text>
        <Text style={styles.amount}>₹{(order.amount / 100).toFixed(2)}</Text>
        <Text style={styles.label}>Order ID</Text>
        <Text style={styles.orderId}>{order.orderId}</Text>
        <Text style={styles.note}>
          ⓘ Razorpay SDK checkout will be integrated in a future update.
        </Text>
      </View>
      <TouchableOpacity
        style={styles.btn}
        onPress={() =>
          Alert.alert(
            'Payment',
            `Razorpay checkout for Order ${order.orderId} (₹${(order.amount / 100).toFixed(
              2,
            )}) will open here once the SDK is integrated.`,
          )
        }
      >
        <Text style={styles.btnText}>Proceed to Pay</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    marginBottom: 24,
  },
  label: { fontSize: 12, color: '#888', marginBottom: 4, marginTop: 10 },
  amount: { fontSize: 28, fontWeight: '700', color: '#1565c0' },
  orderId: { fontSize: 13, color: '#555', fontFamily: 'monospace' },
  note: { fontSize: 12, color: '#888', marginTop: 16, lineHeight: 18 },
  btn: { backgroundColor: '#1565c0', borderRadius: 8, padding: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: { color: 'red', fontSize: 14 },
});

export default OnlinePaymentScreen;
