import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import feeService from '../../services/feeService';
import RazorpayCheckout from 'react-native-razorpay';
import { FeesStackParamList } from '../../navigation/features/FeesNavigator';

type RoutePropType = RouteProp<FeesStackParamList, 'OnlinePayment'>;

const OnlinePaymentScreen: React.FC = () => {
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation();
  const { invoiceId } = route.params;

  const [order, setOrder]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [paying, setPaying]   = useState(false);

  useEffect(() => {
    feeService
      .createRazorpayOrder(invoiceId)
      .then((data) => { setOrder(data); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  const handlePayment = async () => {
    if (!order) return;
    setPaying(true);
    try {
      const options = {
        description: `Fee Payment for Invoice ${invoiceId}`,
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
      Alert.alert('✅ Payment Successful!', 'Your fee payment has been verified and recorded.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      if (err?.code && err?.description) {
        Alert.alert('Cancelled', err.description || 'Payment was not completed.');
      } else {
        Alert.alert('Payment Error', err?.response?.data?.error || 'Payment verification failed. Please try again.');
      }
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1565c0" />
        <Text style={styles.loadingText}>Preparing payment…</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>❌</Text>
        <Text style={styles.errorTitle}>Could Not Create Order</Text>
        <Text style={styles.errorMsg}>{error ?? 'Failed to fetch Razorpay order. Please try again.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.retryBtnText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const amountRs = (order.amount / 100).toFixed(2);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Confirm Payment</Text>
          <Text style={styles.headerSubtitle}>You will be redirected to Razorpay secure checkout</Text>
        </View>

        {/* Amount card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount Due</Text>
          <Text style={styles.amountValue}>₹{amountRs}</Text>
          <Text style={styles.orderId}>Order ID: {order.orderId || order.order_id}</Text>
          <View style={styles.testModeBadge}>
            <Text style={styles.testModeText}>🧪 TEST MODE — No real money charged</Text>
          </View>
        </View>

        {/* Test card info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Test Card Details</Text>
          <Text style={styles.infoRow}>Card Number: <Text style={styles.infoValue}>4111 1111 1111 1111</Text></Text>
          <Text style={styles.infoRow}>Expiry: <Text style={styles.infoValue}>Any future date</Text></Text>
          <Text style={styles.infoRow}>CVV: <Text style={styles.infoValue}>Any 3 digits</Text></Text>
        </View>

        {/* Pay button */}
        <TouchableOpacity
          style={[styles.payBtn, paying && styles.payBtnDisabled]}
          onPress={handlePayment}
          disabled={paying}
        >
          {paying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payBtnText}>💳  Pay ₹{amountRs} via Razorpay</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#f8faff' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  container: { flex: 1, padding: 20 },

  loadingText: { fontSize: 14, color: '#666', marginTop: 12 },

  errorIcon:  { fontSize: 48, marginBottom: 12 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 8 },
  errorMsg:   { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 20 },
  retryBtn:   { backgroundColor: '#1565c0', borderRadius: 10, padding: 12, paddingHorizontal: 24 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  header:        { marginBottom: 24 },
  headerTitle:   { fontSize: 26, fontWeight: '800', color: '#111827' },
  headerSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 4 },

  amountCard: {
    backgroundColor: '#1565c0',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLabel: { fontSize: 14, color: '#93c5fd', fontWeight: '600', marginBottom: 6 },
  amountValue: { fontSize: 40, fontWeight: '900', color: '#fff', marginBottom: 8 },
  orderId:     { fontSize: 11, color: '#bfdbfe', fontFamily: 'monospace' },
  testModeBadge: { marginTop: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  testModeText:  { fontSize: 11, color: '#fef3c7', fontWeight: '600' },

  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  infoTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10 },
  infoRow:   { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  infoValue: { fontWeight: '700', color: '#111827', fontFamily: 'monospace' },

  payBtn: {
    backgroundColor: '#1565c0',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  cancelBtn:     { alignItems: 'center', padding: 12 },
  cancelBtnText: { color: '#6b7280', fontWeight: '600', fontSize: 14 },
});

export default OnlinePaymentScreen;
