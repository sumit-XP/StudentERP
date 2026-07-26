import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { FeesStackParamList } from '../../navigation/features/FeesNavigator';

type NavProp = StackNavigationProp<FeesStackParamList, 'InvoiceList'>;

interface InvoiceItem {
  id: string;
  studentName: string;
  feeType: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: 'paid' | 'unpaid' | 'partial';
}

const INITIAL_INVOICES: InvoiceItem[] = [
  {
    id: '1',
    studentName: 'Alex Rivera',
    feeType: 'Tuition Fees Q3',
    amount: 15000,
    paidAmount: 15000,
    dueDate: 'Oct 30, 2023',
    status: 'paid',
  },
  {
    id: '2',
    studentName: 'Beatrice Silva',
    feeType: 'Tuition Fees Q3',
    amount: 15000,
    paidAmount: 7500,
    dueDate: 'Oct 30, 2023',
    status: 'partial',
  },
  {
    id: '3',
    studentName: 'Charlie Vance',
    feeType: 'Sports & Library Fees',
    amount: 3500,
    paidAmount: 0,
    dueDate: 'Nov 15, 2023',
    status: 'unpaid',
  },
  {
    id: '4',
    studentName: 'Diana Prince',
    feeType: 'Tuition Fees Q3',
    amount: 15000,
    paidAmount: 15000,
    dueDate: 'Oct 30, 2023',
    status: 'paid',
  },
];

const InvoiceListScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [invoices] = useState<InvoiceItem[]>(INITIAL_INVOICES);
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid' | 'partial'>('all');

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.studentName.toLowerCase().includes(query.toLowerCase()) ||
      inv.feeType.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalCollected = invoices.reduce((sum, item) => sum + item.paidAmount, 0);
  const totalAmount = invoices.reduce((sum, item) => sum + item.amount, 0);
  const totalPending = totalAmount - totalCollected;
  const progressRatio = totalAmount > 0 ? (totalCollected / totalAmount) * 100 : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* billing statistics header */}
      <View style={styles.billingStatsCard}>
        <Text style={styles.statsCardTitle}>Billing Collections</Text>
        <View style={styles.statsMetricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Total Collected</Text>
            <Text style={[styles.metricVal, styles.textGreen]}>
              ₹{totalCollected.toLocaleString()}
            </Text>
          </View>
          <View style={styles.footerDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Pending Dues</Text>
            <Text style={[styles.metricVal, styles.textRed]}>₹{totalPending.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.progressRow}>
          <View style={styles.progressBarBg}>
            {}
            <View style={[styles.progressBarFill, { width: `${progressRatio}%` }]} />
          </View>
          <Text style={styles.progressText}>{progressRatio.toFixed(1)}% Collected</Text>
        </View>
      </View>

      {/* search input and status chips */}
      <View style={styles.filtersBlock}>
        <View style={styles.searchBar}>
          <Icon name="magnify" size={20} color="#737686" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by student or fee type..."
            placeholderTextColor="#737686"
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {(['all', 'paid', 'unpaid', 'partial'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.chip, filterStatus === status && styles.chipActive]}
              onPress={() => setFilterStatus(status)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, filterStatus === status && styles.chipTextActive]}>
                {status.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* invoices list */}
      <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
        <View style={styles.listSection}>
          <Text style={styles.sectionHeaderTitle}>Invoices Ledger</Text>
          {filteredInvoices.length === 0 ? (
            <Text style={styles.emptyText}>No invoices match your selection.</Text>
          ) : (
            filteredInvoices.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.invoiceCard}
                onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: item.id })}
                activeOpacity={0.75}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{item.studentName}</Text>
                    <Text style={styles.feeTypeLabel}>{item.feeType}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      item.status === 'paid' && styles.badgePaid,
                      item.status === 'partial' && styles.badgePartial,
                      item.status === 'unpaid' && styles.badgeUnpaid,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        item.status === 'paid' && styles.textPaid,
                        item.status === 'partial' && styles.textPartial,
                        item.status === 'unpaid' && styles.textUnpaid,
                      ]}
                    >
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.amountLabel}>Total: ₹{item.amount.toLocaleString()}</Text>
                    <Text style={styles.dueLabel}>Due: {item.dueDate}</Text>
                  </View>
                  <View style={styles.balanceCol}>
                    <Text style={styles.balanceLabel}>Balance Due</Text>
                    <Text
                      style={[
                        styles.balanceVal,
                        item.status === 'paid' ? styles.textGreen : styles.textRed,
                      ]}
                    >
                      ₹{(item.amount - item.paidAmount).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
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
  billingStatsCard: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#c3c5d7',
    padding: 16,
  },
  statsCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#121c28',
  },
  statsMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#737686',
    letterSpacing: 0.5,
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  footerDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#c3c5d7',
    marginHorizontal: 12,
  },
  textGreen: {
    color: '#006c4a',
  },
  textRed: {
    color: '#ba1a1a',
  },
  textPartial: {
    color: '#6e3900',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 14,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5eeff',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#006c4a',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#434654',
  },
  filtersBlock: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#c3c5d7',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#121c28',
    padding: 0,
  },
  chipsRow: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#dfe9fa',
  },
  chipActive: {
    backgroundColor: '#003fb1',
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#434654',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  scrollList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  listSection: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 16,
    padding: 16,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121c28',
    marginBottom: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: '#737686',
    marginVertical: 20,
    fontSize: 12,
  },
  invoiceCard: {
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'start',
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9ff',
    paddingBottom: 10,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121c28',
  },
  feeTypeLabel: {
    fontSize: 11,
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#121c28',
  },
  dueLabel: {
    fontSize: 10,
    color: '#737686',
    marginTop: 2,
  },
  balanceCol: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#737686',
  },
  balanceVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
});

export default InvoiceListScreen;
