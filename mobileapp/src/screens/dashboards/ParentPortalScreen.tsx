import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import {
  SchoolIcon,
  SendIcon,
  CreditCardOutlineIcon,
  ChevronRightIcon,
  FactCheckIcon,
  AlertCircleIcon,
  InformationOutlineIcon,
} from '../../assets/svgs';
import attendanceService from '../../services/attendanceService';
import communicationService from '../../services/communicationService';
import feeService from '../../services/feeService';

const ParentPortalScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [attendance, setAttendance] = useState('0%');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [totalDue, setTotalDue] = useState(0);
  const [nextDueDate, setNextDueDate] = useState<string | null>(null);

  const fetchParentData = async () => {
    try {
      const [attData, commData, feeData] = await Promise.allSettled([
        attendanceService.getMyAttendance(),
        communicationService.getAnnouncements(),
        feeService.getMyInvoices(),
      ]);

      if (attData.status === 'fulfilled' && attData.value) {
        const val = attData.value;
        if (typeof val.percentage === 'number') {
          setAttendance(`${val.percentage}%`);
        } else if (Array.isArray(val) && val.length > 0) {
          const present = val.filter((a: any) => a.status === 'present').length;
          setAttendance(`${Math.round((present / val.length) * 100)}%`);
        }
      }

      if (commData.status === 'fulfilled' && Array.isArray(commData.value)) {
        setAnnouncements(commData.value);
      }

      if (feeData.status === 'fulfilled' && feeData.value) {
        const invs = feeData.value.invoices || [];
        const sum = feeData.value.summary;
        if (sum && typeof sum.totalDue === 'number') {
          setTotalDue(sum.totalDue);
        } else {
          const dueSum = invs.reduce((acc: number, inv: any) => {
            const total = (parseFloat(inv.total_amount) || 0) + (parseFloat(inv.late_fee) || 0);
            const paid = parseFloat(inv.amount_paid) || 0;
            return acc + Math.max(0, total - paid);
          }, 0);
          setTotalDue(dueSum);
        }

        const unpaidInvs = invs.filter((inv: any) => inv.status !== 'paid' && inv.due_date);
        if (unpaidInvs.length > 0) {
          unpaidInvs.sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
          setNextDueDate(new Date(unpaidInvs[0].due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));
        } else {
          setNextDueDate(null);
        }
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchParentData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchParentData();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Parent Portal</Text>
        <Text style={styles.headerSubtitle}>
          Monitor your child's academic progress, messages, and invoices.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e65100']} />
        }
      >
        {/* Child Profile Quick Info */}
        <View style={styles.infoBox}>
          <InformationOutlineIcon size={20} color="#e65100" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Student Account Associated</Text>
            <Text style={styles.infoDesc}>
              Linked to student record: {user?.name || 'Student'}
            </Text>
          </View>
        </View>

        {/* 1. Results / Academics Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconBgGreen}>
              <SchoolIcon size={22} color="#2e7d32" />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Academic Performance</Text>
              <Text style={styles.sectionSubtitle}>Report Card, grades, and attendance</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>ATTENDANCE</Text>
              <Text style={styles.statValueGreen}>{attendance}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>STATUS</Text>
              <Text style={styles.statValueBlue}>Active</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('StudentReportCard' as never)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>View Detailed Report Card</Text>
            <ChevronRightIcon size={16} color="#e65100" />
          </TouchableOpacity>
        </View>

        {/* 2. Communication / Bulletins Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconBgBlue}>
              <SendIcon size={20} color="#1565c0" />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Communications & Bulletins</Text>
              <Text style={styles.sectionSubtitle}>School announcements and teacher chats</Text>
            </View>
          </View>

          <View style={styles.announcementsList}>
            {loading ? (
              <ActivityIndicator color="#e65100" style={{ marginVertical: 12 }} />
            ) : announcements.length === 0 ? (
              <Text style={styles.emptyText}>No new announcements today.</Text>
            ) : (
              announcements.slice(0, 2).map((ann, idx) => (
                <View key={ann.id || idx} style={styles.announcementItem}>
                  <Text style={styles.announcementTitle}>{ann.title}</Text>
                  <Text style={styles.announcementBody} numberOfLines={2}>
                    {ann.content}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.doubleActionRow}>
            <TouchableOpacity
              style={styles.actionBtnHalf}
              onPress={() => navigation.navigate('Announcements' as never)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>School Notices</Text>
              <ChevronRightIcon size={14} color="#e65100" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnHalf}
              onPress={() => navigation.navigate('Messaging' as never)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>Teacher Chat</Text>
              <ChevronRightIcon size={14} color="#e65100" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Fees & Invoices Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconBgOrange}>
              <CreditCardOutlineIcon size={20} color="#e65100" />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Tuition & Fee Accounts</Text>
              <Text style={styles.sectionSubtitle}>Outstanding invoices and payment history</Text>
            </View>
          </View>

          <View style={styles.feeOverviewCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AlertCircleIcon size={18} color={totalDue > 0 ? "#ba1a1a" : "#2e7d32"} />
              <Text style={styles.feeLabel}>Total Outstanding Amount</Text>
            </View>
            <Text style={[styles.feeValue, { color: totalDue > 0 ? '#ba1a1a' : '#2e7d32' }]}>
              ₹{totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
            <Text style={styles.feeDueDate}>
              {totalDue > 0
                ? (nextDueDate ? `Next Payment Due: ${nextDueDate}` : 'Payment Pending')
                : 'All fee invoices paid'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('StudentPayments' as never)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>Make Fee Payment</Text>
            <ChevronRightIcon size={16} color="#e65100" />
          </TouchableOpacity>
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#eef0f6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#121c28',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#737686',
    marginTop: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffe0b2',
  },
  infoTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e65100',
  },
  infoDesc: {
    fontSize: 11,
    color: '#737686',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eef0f6',
    ...Platform.select({
      ios: {
        shadowColor: '#121c28',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBgGreen: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 8,
  },
  iconBgBlue: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 8,
  },
  iconBgOrange: {
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 8,
  },
  sectionTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#121c28',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#737686',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8f9ff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#737686',
  },
  statValueGreen: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e7d32',
    marginTop: 4,
  },
  statValueBlue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1565c0',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#c3c5d7',
  },
  announcementsList: {
    marginBottom: 12,
  },
  announcementItem: {
    backgroundColor: '#f8f9ff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  announcementTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#121c28',
  },
  announcementBody: {
    fontSize: 11,
    color: '#434654',
    marginTop: 4,
    lineHeight: 15,
  },
  emptyText: {
    fontSize: 12,
    color: '#737686',
    textAlign: 'center',
    paddingVertical: 12,
  },
  feeOverviewCard: {
    backgroundColor: '#fff5f5',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ffebee',
    marginBottom: 14,
  },
  feeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#c62828',
    marginLeft: 6,
  },
  feeValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#c62828',
    marginTop: 6,
  },
  feeDueDate: {
    fontSize: 10,
    color: '#737686',
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#f0f2f8',
    marginTop: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e65100',
  },
  doubleActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: '#f0f2f8',
    paddingTop: 8,
    marginTop: 4,
  },
  actionBtnHalf: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '48%',
  },
});

export default ParentPortalScreen;
