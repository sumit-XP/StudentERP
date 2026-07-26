import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SecurityIcon, CheckCircleIcon, WalletIcon, CloseIcon } from '../../assets/svgs';

interface PendingFee {
  id: string;
  title: string;
  dueDate: string;
  amount: number;
  status: 'Overdue' | 'Upcoming';
}

interface RecentTransaction {
  id: string;
  title: string;
  date: string;
  amount: number;
}

const StudentPaymentsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [step, setStep] = useState<'select' | 'details' | 'processing' | 'success'>('select');
  const [selectedFees, setSelectedFees] = useState<string[]>(['1', '2']); // Default all selected
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'paypal'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [upiId, setUpiId] = useState('');

  // Transactions local state
  const [transactions, setTransactions] = useState<RecentTransaction[]>([
    {
      id: 'TXN8921',
      title: 'Library Fine Payment',
      date: 'Sep 28, 2024',
      amount: 15.0,
    },
    {
      id: 'TXN7740',
      title: 'Tuition Fee - Quarter 2',
      date: 'Aug 12, 2024',
      amount: 1100.0,
    },
  ]);

  // Fees local state
  const [pendingFees, setPendingFees] = useState<PendingFee[]>([
    {
      id: '1',
      title: 'Tuition Fee - Quarter 3',
      dueDate: 'Oct 15, 2024',
      amount: 1100.0,
      status: 'Overdue',
    },
    {
      id: '2',
      title: 'Laboratory Charges',
      dueDate: 'Nov 05, 2024',
      amount: 150.0,
      status: 'Upcoming',
    },
  ]);

  const toggleSelectFee = (id: string) => {
    if (selectedFees.includes(id)) {
      setSelectedFees(selectedFees.filter((fId) => fId !== id));
    } else {
      setSelectedFees([...selectedFees, id]);
    }
  };

  const getSelectedTotal = () => {
    return pendingFees
      .filter((fee) => selectedFees.includes(fee.id))
      .reduce((sum, fee) => sum + fee.amount, 0);
  };

  const handleProceedToPay = () => {
    if (selectedFees.length === 0) {
      Alert.alert('No Selection', 'Please select at least one fee item to pay.');
      return;
    }
    setStep('details');
  };

  const handleStartPayment = () => {
    if (paymentMethod === 'card') {
      if (!cardNumber || !cardHolder || !expiry || !cvv) {
        Alert.alert('Missing Details', 'Please fill in all card details.');
        return;
      }
    } else if (paymentMethod === 'upi') {
      if (!upiId) {
        Alert.alert('Missing Details', 'Please enter your UPI ID.');
        return;
      }
    }

    setStep('processing');
    setTimeout(() => {
      // Simulate successful payment
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });
      const newTxnId = 'TXN' + Math.floor(1000 + Math.random() * 9000);

      const paidItems = pendingFees.filter((fee) => selectedFees.includes(fee.id));
      const newTransactions: RecentTransaction[] = paidItems.map((item, idx) => ({
        id: `${newTxnId}-${idx}`,
        title: item.title,
        date: dateStr,
        amount: item.amount,
      }));

      setTransactions([...newTransactions, ...transactions]);
      setPendingFees(pendingFees.filter((fee) => !selectedFees.includes(fee.id)));
      setSelectedFees([]);
      setStep('success');
    }, 2000);
  };

  const handleReturn = () => {
    setStep('select');
    // Clear inputs
    setCardNumber('');
    setCardHolder('');
    setExpiry('');
    setCvv('');
    setUpiId('');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <Text style={styles.headerText}>Parent Portal - Fees</Text>
        <TouchableOpacity
          style={styles.closeBtnIcon}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <CloseIcon size={20} color="#003fb1" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {step === 'select' && (
          <View>
            {/* Balance Hero Card */}
            <View style={styles.heroCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.heroLabel}>Total Pending Balance</Text>
                  <Text style={styles.heroAmount}>
                    ${pendingFees.reduce((sum, f) => sum + f.amount, 0).toFixed(2)}
                  </Text>
                </View>
                <WalletIcon size={48} color="rgba(255, 255, 255, 0.2)" />
              </View>
            </View>

            {/* Section Title */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Select Fees to Pay</Text>
              <Text style={styles.sectionRightBadge}>{pendingFees.length} Items Pending</Text>
            </View>

            {/* Pending Items List with Checkboxes */}
            <View style={styles.listContainer}>
              {pendingFees.length === 0 ? (
                <View style={styles.emptyState}>
                  <CheckCircleIcon size={36} color="#006c4a" />
                  <Text style={styles.emptyText}>All fees are fully paid!</Text>
                </View>
              ) : (
                pendingFees.map((fee) => {
                  const isSelected = selectedFees.includes(fee.id);
                  return (
                    <TouchableOpacity
                      key={fee.id}
                      style={[styles.feeCard, isSelected && styles.feeCardSelected]}
                      onPress={() => toggleSelectFee(fee.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.feeRow}>
                        <View style={styles.feeMetaCol}>
                          {/* Checkbox circle */}
                          <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                            {isSelected && <View style={styles.checkboxInner} />}
                          </View>
                          <View style={styles.feeDetails}>
                            <Text style={styles.feeTitle}>{fee.title}</Text>
                            <Text style={styles.feeDueDate}>Due Date: {fee.dueDate}</Text>
                            <View
                              style={[
                                styles.statusBadge,
                                fee.status === 'Overdue' ? styles.badgeRed : styles.badgeGrey,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusBadgeText,
                                  fee.status === 'Overdue' ? styles.textRed : styles.textGrey,
                                ]}
                              >
                                {fee.status}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <Text style={styles.feeAmount}>${fee.amount.toFixed(2)}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {pendingFees.length > 0 && (
              <TouchableOpacity
                style={styles.proceedBtn}
                onPress={handleProceedToPay}
                activeOpacity={0.8}
              >
                <Text style={styles.proceedBtnText}>
                  Proceed to Pay (${getSelectedTotal().toFixed(2)})
                </Text>
              </TouchableOpacity>
            )}

            {/* Recent Transactions */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
            </View>

            <View style={styles.txnCard}>
              {transactions.map((txn, idx) => (
                <View
                  key={txn.id}
                  style={[styles.txnRow, idx < transactions.length - 1 && styles.borderBottom]}
                >
                  <View style={styles.txnMetaCol}>
                    <CheckCircleIcon size={20} color="#006c4a" />
                    <View style={styles.txnDetails}>
                      <Text style={styles.txnTitle}>{txn.title}</Text>
                      <Text style={styles.txnSubText}>
                        {txn.date} • ID: #{txn.id}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.txnAmount}>-${txn.amount.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {step === 'details' && (
          <View style={styles.flowContainer}>
            <Text style={styles.flowTitle}>Choose Payment Method</Text>

            {/* Payment Method Selector */}
            <View style={styles.methodSelector}>
              <TouchableOpacity
                style={[styles.methodTab, paymentMethod === 'card' && styles.methodTabActive]}
                onPress={() => setPaymentMethod('card')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.methodTabText,
                    paymentMethod === 'card' && styles.methodTabTextActive,
                  ]}
                >
                  Card
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.methodTab, paymentMethod === 'upi' && styles.methodTabActive]}
                onPress={() => setPaymentMethod('upi')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.methodTabText,
                    paymentMethod === 'upi' && styles.methodTabTextActive,
                  ]}
                >
                  UPI
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.methodTab, paymentMethod === 'paypal' && styles.methodTabActive]}
                onPress={() => setPaymentMethod('paypal')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.methodTabText,
                    paymentMethod === 'paypal' && styles.methodTabTextActive,
                  ]}
                >
                  PayPal
                </Text>
              </TouchableOpacity>
            </View>

            {paymentMethod === 'card' && (
              <View style={styles.inputForm}>
                <Text style={styles.inputLabel}>CARDHOLDER NAME</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Sarah Jenkins"
                  value={cardHolder}
                  onChangeText={setCardHolder}
                  placeholderTextColor="#a0a4b8"
                />

                <Text style={styles.inputLabel}>CARD NUMBER</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="xxxx xxxx xxxx xxxx"
                  keyboardType="numeric"
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  maxLength={19}
                  placeholderTextColor="#a0a4b8"
                />

                <View style={styles.inputRow}>
                  <View style={styles.flexHalf}>
                    <Text style={styles.inputLabel}>EXPIRY DATE</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="MM/YY"
                      value={expiry}
                      onChangeText={setExpiry}
                      maxLength={5}
                      placeholderTextColor="#a0a4b8"
                    />
                  </View>
                  <View style={styles.flexHalf}>
                    <Text style={styles.inputLabel}>CVV</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="xxx"
                      keyboardType="numeric"
                      secureTextEntry
                      value={cvv}
                      onChangeText={setCvv}
                      maxLength={3}
                      placeholderTextColor="#a0a4b8"
                    />
                  </View>
                </View>
              </View>
            )}

            {paymentMethod === 'upi' && (
              <View style={styles.inputForm}>
                <Text style={styles.inputLabel}>UPI ID / VPA</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="username@bank"
                  value={upiId}
                  onChangeText={setUpiId}
                  autoCapitalize="none"
                  placeholderTextColor="#a0a4b8"
                />
                <Text style={styles.inputHelp}>
                  A payment request will be sent to your UPI app.
                </Text>
              </View>
            )}

            {paymentMethod === 'paypal' && (
              <View style={styles.paypalMessage}>
                <Text style={styles.paypalText}>
                  Proceed to PayPal checkout. You will be redirected to complete your payment
                  securely.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.payNowConfirmBtn}
              onPress={handleStartPayment}
              activeOpacity={0.8}
            >
              <Text style={styles.payNowConfirmText}>
                Pay ${getSelectedTotal().toFixed(2)} Securely
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setStep('select')}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Back to Selection</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'processing' && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#003fb1" />
            <Text style={styles.processingText}>Processing payment securely...</Text>
            <Text style={styles.processingSubText}>Please do not close the app or press back.</Text>
          </View>
        )}

        {step === 'success' && (
          <View style={styles.successContainer}>
            <View style={styles.successIconCircle}>
              <CheckCircleIcon size={52} color="#ffffff" />
            </View>
            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successSubtitle}>
              Your transaction has been processed and a receipt has been sent to your email.
            </Text>

            <View style={styles.receiptCard}>
              <Text style={styles.receiptHeader}>RECEIPT DETAILS</Text>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Transaction Date</Text>
                <Text style={styles.receiptValue}>
                  {new Date().toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Status</Text>
                <Text style={styles.receiptSuccessValue}>COMPLETED</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.doneBtn} onPress={handleReturn} activeOpacity={0.8}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Security Badge */}
        <View style={styles.securityBadge}>
          <SecurityIcon size={14} color="#737686" />
          <Text style={styles.securityText}>Secure 256-bit SSL Encrypted Payments</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#c3c5d7',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#003fb1',
  },
  closeBtnIcon: {
    padding: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#003fb1',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#121c28',
  },
  sectionRightBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#003fb1',
  },
  listContainer: {
    gap: 12,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c3c5d7',
    width: '100%',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#006c4a',
    marginTop: 8,
  },
  feeCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 16,
    padding: 16,
  },
  feeCardSelected: {
    borderColor: '#003fb1',
    borderWidth: 2,
    backgroundColor: '#f8faff',
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeMetaCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#c3c5d7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    borderColor: '#003fb1',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#003fb1',
  },
  feeDetails: {
    flex: 1,
    gap: 2,
  },
  feeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121c28',
  },
  feeDueDate: {
    fontSize: 11,
    color: '#737686',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
  },
  badgeRed: {
    backgroundColor: '#ffdad6',
  },
  badgeGrey: {
    backgroundColor: '#e5eeff',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  textRed: {
    color: '#ba1a1a',
  },
  textGrey: {
    color: '#434654',
  },
  feeAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#003fb1',
    flex: 0.9,
    textAlign: 'right',
  },
  proceedBtn: {
    backgroundColor: '#003fb1',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  proceedBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  txnCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  txnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#c3c5d7',
  },
  txnMetaCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  txnDetails: {
    marginLeft: 10,
  },
  txnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#121c28',
  },
  txnSubText: {
    fontSize: 10,
    color: '#737686',
    marginTop: 2,
  },
  txnAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ba1a1a',
  },
  flowContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c3c5d7',
    padding: 16,
    marginBottom: 24,
  },
  flowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#121c28',
    marginBottom: 16,
    textAlign: 'center',
  },
  methodSelector: {
    flexDirection: 'row',
    backgroundColor: '#f0f2fa',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  methodTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  methodTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  methodTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#737686',
  },
  methodTabTextActive: {
    color: '#003fb1',
    fontWeight: '700',
  },
  inputForm: {
    gap: 12,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#737686',
    letterSpacing: 0.5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#121c28',
    backgroundColor: '#fcfdff',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  flexHalf: {
    flex: 1,
  },
  inputHelp: {
    fontSize: 11,
    color: '#737686',
    textAlign: 'center',
  },
  paypalMessage: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#fcfdff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c3c5d7',
    marginBottom: 20,
  },
  paypalText: {
    fontSize: 13,
    color: '#434654',
    textAlign: 'center',
    lineHeight: 18,
  },
  payNowConfirmBtn: {
    backgroundColor: '#006c4a',
    borderRadius: 10,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  payNowConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  cancelBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ba1a1a',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c3c5d7',
    marginBottom: 24,
  },
  processingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#121c28',
    marginTop: 16,
  },
  processingSubText: {
    fontSize: 12,
    color: '#737686',
    marginTop: 4,
  },
  successContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c3c5d7',
    marginBottom: 24,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#006c4a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#006c4a',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 12,
    color: '#737686',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
  },
  receiptCard: {
    width: '100%',
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5eeff',
    marginBottom: 20,
    gap: 10,
  },
  receiptHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#737686',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptLabel: {
    fontSize: 12,
    color: '#737686',
  },
  receiptValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#121c28',
  },
  receiptSuccessValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#006c4a',
  },
  doneBtn: {
    backgroundColor: '#003fb1',
    borderRadius: 10,
    height: 48,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    opacity: 0.65,
    marginVertical: 16,
  },
  securityText: {
    fontSize: 10,
    color: '#737686',
    fontWeight: '600',
  },
});

export default StudentPaymentsScreen;
