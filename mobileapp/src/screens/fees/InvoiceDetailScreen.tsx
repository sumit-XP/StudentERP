import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { FeesStackParamList } from '../../navigation/features/FeesNavigator';

type NavProp = StackNavigationProp<FeesStackParamList, 'InvoiceDetail'>;
type RoutePropType = RouteProp<FeesStackParamList, 'InvoiceDetail'>;

interface InvoiceDetail {
  id: string;
  studentName: string;
  className: string;
  feeType: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: 'paid' | 'unpaid' | 'partial';
  items: { id: string; feeType: string; amount: number }[];
}

const InvoiceDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { invoiceId } = route.params;

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash');
  const [cashAmount, setCashAmount] = useState('');
  const [receiptRef, setReceiptRef] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Simulate loading details based on invoiceId
    const timer = setTimeout(() => {
      setInvoice({
        id: invoiceId,
        studentName:
          invoiceId === '2'
            ? 'Beatrice Silva'
            : invoiceId === '3'
            ? 'Charlie Vance'
            : 'Alex Rivera',
        className: 'Grade 10-B',
        feeType: invoiceId === '3' ? 'Sports & Library Fees' : 'Tuition Fees Q3',
        amount: invoiceId === '3' ? 3500 : 15000,
        paidAmount: invoiceId === '2' ? 7500 : 0,
        dueDate: invoiceId === '3' ? 'Nov 15, 2023' : 'Oct 30, 2023',
        status: invoiceId === '2' ? 'partial' : 'unpaid',
        items: [
          { id: '1', feeType: 'Tuition Core Fee', amount: invoiceId === '3' ? 2500 : 12000 },
          { id: '2', feeType: 'Laboratory Charges', amount: invoiceId === '3' ? 500 : 2000 },
          { id: '3', feeType: 'Exam Materials', amount: invoiceId === '3' ? 500 : 1000 },
        ],
      });
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [invoiceId]);

  const handleRecordCashPayment = async () => {
    if (!invoice) {
      return;
    }

    const amountNum = parseFloat(cashAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid cash amount to pay.');
      return;
    }

    const remaining = invoice.amount - invoice.paidAmount;
    if (amountNum > remaining) {
      Alert.alert('Overpayment', `Enter an amount equal to or less than ₹${remaining}.`);
      return;
    }

    setProcessing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const newPaid = invoice.paidAmount + amountNum;
      const newStatus = newPaid >= invoice.amount ? 'paid' : 'partial';

      Alert.alert(
        'Payment Recorded',
        `Cash payment of ₹${amountNum} successfully recorded!\nReceipt Reference: ${
          receiptRef || 'N/A'
        }`,
        [
          {
            text: 'OK',
            onPress: () => {
              setInvoice({
                ...invoice,
                paidAmount: newPaid,
                status: newStatus,
              });
              navigation.goBack();
            },
          },
        ],
      );
    } catch {
      Alert.alert('Error', 'Failed to process cash payment.');
    } finally {
      setProcessing(false);
      setCashAmount('');
      setReceiptRef('');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#003fb1" />
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Invoice not found.</Text>
      </View>
    );
  }

  const balance = invoice.amount - invoice.paidAmount;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Ledger Header */}
        <View style={styles.invoiceHeaderCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.invoiceTitle}>{invoice.studentName}</Text>
              <Text style={styles.invoiceSubtitle}>
                {invoice.className} • {invoice.feeType}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                invoice.status === 'paid' && styles.badgePaid,
                invoice.status === 'partial' && styles.badgePartial,
                invoice.status === 'unpaid' && styles.badgeUnpaid,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  invoice.status === 'paid' && styles.textPaid,
                  invoice.status === 'partial' && styles.textPartial,
                  invoice.status === 'unpaid' && styles.textUnpaid,
                ]}
              >
                {invoice.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Fee breakdown list */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Invoice Ledger Details</Text>
          {invoice.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemLabel}>{item.feeType}</Text>
              <Text style={styles.itemAmount}>₹{item.amount.toLocaleString()}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Amount</Text>
            <Text style={styles.summaryVal}>₹{invoice.amount.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Paid To Date</Text>
            <Text style={[styles.summaryVal, styles.textGreen]}>
              ₹{invoice.paidAmount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Balance Due</Text>
            <Text style={[styles.summaryVal, styles.textRed, styles.fontExtraBold]}>
              ₹{balance.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Payment Portal Composer */}
        {invoice.status !== 'paid' && (
          <View style={styles.paymentComposerCard}>
            <Text style={styles.sectionTitle}>Record Payment Transaction</Text>

            {/* Segment Tab Selector */}
            <View style={styles.segmentContainer}>
              <TouchableOpacity
                style={[styles.segmentBtn, paymentMethod === 'cash' && styles.segmentBtnActive]}
                onPress={() => setPaymentMethod('cash')}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.segmentText, paymentMethod === 'cash' && styles.segmentTextActive]}
                >
                  Cash Payment
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentBtn, paymentMethod === 'online' && styles.segmentBtnActive]}
                onPress={() => setPaymentMethod('online')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.segmentText,
                    paymentMethod === 'online' && styles.segmentTextActive,
                  ]}
                >
                  Pay Online
                </Text>
              </TouchableOpacity>
            </View>

            {paymentMethod === 'cash' ? (
              <View style={styles.cashForm}>
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>CASH AMOUNT RECEIVED (₹)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={cashAmount}
                    onChangeText={setCashAmount}
                    placeholder={`e.g. ${balance}`}
                    placeholderTextColor="#737686"
                    editable={!processing}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>RECEIPT / REFERENCE NUMBER</Text>
                  <TextInput
                    style={styles.textInput}
                    value={receiptRef}
                    onChangeText={setReceiptRef}
                    placeholder="e.g. REC-98725"
                    placeholderTextColor="#737686"
                    editable={!processing}
                  />
                </View>

                <TouchableOpacity
                  style={styles.payBtn}
                  onPress={handleRecordCashPayment}
                  disabled={processing}
                  activeOpacity={0.85}
                >
                  {processing ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.payBtnText}>Record Cash Payment</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.onlineSection}>
                <Text style={styles.onlineDesc}>
                  Generate payment invoice checkout link and send gateway instructions to student
                  registered email details.
                </Text>
                <TouchableOpacity
                  style={styles.payBtn}
                  onPress={() => navigation.navigate('OnlinePayment', { invoiceId: invoice.id })}
                  activeOpacity={0.85}
                >
                  <Text style={styles.payBtnText}>Proceed to Checkout</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    fontSize: 14,
    color: '#ba1a1a',
  },
  invoiceHeaderCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#121c28',
  },
  invoiceSubtitle: {
    fontSize: 12,
    color: '#737686',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePaid: {
    backgroundColor: '#82f5c1',
  },
  badgePartial: {
    backgroundColor: '#ffdcc3',
  },
  badgeUnpaid: {
    backgroundColor: '#ffdad6',
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: '800',
  },
  textPaid: {
    color: '#005137',
  },
  textUnpaid: {
    color: '#ba1a1a',
  },
  textPartial: {
    color: '#6e3900',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121c28',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  itemLabel: {
    fontSize: 13,
    color: '#434654',
  },
  itemAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#121c28',
  },
  divider: {
    height: 1,
    backgroundColor: '#f8f9ff',
    marginVertical: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#737686',
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#121c28',
  },
  textGreen: {
    color: '#006c4a',
  },
  textRed: {
    color: '#ba1a1a',
  },
  fontExtraBold: {
    fontWeight: '800',
  },
  paymentComposerCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 16,
    padding: 16,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9ff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 10,
    padding: 2,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#003fb1',
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#737686',
  },
  segmentTextActive: {
    color: '#ffffff',
  },
  cashForm: {
    gap: 12,
  },
  formGroup: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#003fb1',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#f8f9ff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
    color: '#121c28',
  },
  payBtn: {
    backgroundColor: '#003fb1',
    height: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  payBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  onlineSection: {
    gap: 12,
  },
  onlineDesc: {
    fontSize: 12,
    color: '#434654',
    lineHeight: 18,
  },
});

export default InvoiceDetailScreen;
