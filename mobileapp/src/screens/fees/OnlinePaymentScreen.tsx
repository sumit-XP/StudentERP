import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import feeService from '../../services/feeService';
import { RazorpayOrder } from '../../types/fees';
import RazorpayCheckout from 'react-native-razorpay';
import { FeesStackParamList } from '../../navigation/features/FeesNavigator';

type RoutePropType = RouteProp<FeesStackParamList, 'OnlinePayment'>;

const OnlinePaymentScreen: React.FC = () => {
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation();
  const { invoiceId } = route.params;
  const [order, setOrder] = useState<RazorpayOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    feeService
      .createRazorpayOrder(invoiceId)
      .then((data) => {
        setOrder(data);
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

  const handlePayment = () => {
    if (!order) return;
    const options = {
      description: `Fee Payment for Invoice ${invoiceId}`,
      image: 'https://i.imgur.com/3g7nmJC.png',
      currency: 'INR',
      key: order.keyId,
      amount: order.amount,
      name: 'Student ERP',
      order_id: order.orderId,
      theme: { color: '#1565c0' },
    };

    RazorpayCheckout.open(options)
      .then((data: any) => {
        feeService
          .verifyRazorpayPayment({
            invoiceId,
            razorpayOrderId: data.razorpay_order_id,
            razorpayPaymentId: data.razorpay_payment_id,
            razorpaySignature: data.razorpay_signature,
          })
          .then(() => {
            Alert.alert('Success', 'Payment completed successfully!');
            navigation.goBack();
          })
          .catch((err: Error) => {
            Alert.alert('Error verifying payment', err.message);
          });
      })
      .catch((error: any) => {
        Alert.alert('Payment failed', `Error: ${error.code} | ${error.description}`);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pay Online</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Amount</Text>
        <Text style={styles.amount}>₹{(order.amount / 100).toFixed(2)}</Text>
        <Text style={styles.label}>Order ID</Text>
        <Text style={styles.orderId}>{order.orderId}</Text>
        <Text style={styles.note}>
          Payment will be processed via Razorpay.
        </Text>
      </View>
      <TouchableOpacity
        style={styles.btn}
        onPress={handlePayment}
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
