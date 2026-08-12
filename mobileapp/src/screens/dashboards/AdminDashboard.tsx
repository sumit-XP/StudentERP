import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DashboardStackParamList } from '../../navigation/features/DashboardNavigator';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import { communicationService } from '../../services/communicationService';
import {
  MenuIcon,
  BellIcon,
  ProfileIcon,
  AccountDetailsIcon,
  LogoutIcon,
  MegaphoneIcon,
  ReportIcon,
  PlusIcon,
  FactCheckIcon,
  SchoolIcon,
  SendIcon,
} from '../../assets/svgs';

type NavProp = StackNavigationProp<DashboardStackParamList, 'Overview'>;

interface Announcement {
  id: string | number;
  title: string;
  content: string;
  priority?: string;
  target_role?: string;
  created_at?: string;
}

const AdminDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<NavProp>();
  const [attendanceType, setAttendanceType] = useState<'students' | 'staff'>('students');
  const [showDrawer, setShowDrawer] = useState(false);

  // Dynamic API state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [attendanceAnalytics, setAttendanceAnalytics] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      // 1. Fetch main dashboard overview
      const overviewRes = await dashboardService.getDashboardAnalytics().catch(() => null);
      if (overviewRes) {
        setOverview(overviewRes);
      }

      // 2. Fetch live announcements
      const announcementsRes = await communicationService.getAnnouncements().catch(() => []);
      if (Array.isArray(announcementsRes)) {
        setAnnouncements(announcementsRes);
      }

      // 3. Fetch attendance analytics
      const attendanceRes = await dashboardService.getAttendanceAnalytics('day').catch(() => []);
      if (Array.isArray(attendanceRes)) {
        setAttendanceAnalytics(attendanceRes);
      }
    } catch (e: unknown) {
      console.error('Error fetching admin dashboard data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derive attendance graph values strictly from backend attendance analytics
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  const currentGraphData = React.useMemo(() => {
    if (Array.isArray(attendanceAnalytics) && attendanceAnalytics.length > 0) {
      return weekDays.map((dayName) => {
        const match = attendanceAnalytics.find((item) => {
          if (!item.period) return false;
          const d = new Date(item.period);
          const dayIndex = d.getDay(); // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri
          const dayMap: Record<number, string> = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri' };
          return dayMap[dayIndex] === dayName;
        });

        if (match) {
          const rate = Math.round(parseFloat(match.attendance_rate) || 0);
          return {
            day: dayName,
            rate,
            present: parseInt(match.present_count, 10) || 0,
            total: parseInt(match.total_records, 10) || 0,
          };
        }
        return { day: dayName, rate: 0, present: 0, total: 0 };
      });
    }

    return weekDays.map((dayName) => ({ day: dayName, rate: 0, present: 0, total: 0 }));
  }, [attendanceAnalytics]);

  // Calculate dynamic summary stats directly from database records
  const totalDaysWithData = currentGraphData.filter((item) => item.rate > 0);
  const calculatedAvgRate = totalDaysWithData.length > 0
    ? (totalDaysWithData.reduce((acc, curr) => acc + curr.rate, 0) / totalDaysWithData.length).toFixed(1) + '%'
    : (overview?.weeklyAttendance?.attendance_rate ? `${overview.weeklyAttendance.attendance_rate}%` : '0%');

  const calculatedPresent = overview?.weeklyAttendance?.present_count ?? currentGraphData.reduce((acc, curr) => acc + curr.present, 0);
  const calculatedTotal = overview?.weeklyAttendance?.total_records ?? currentGraphData.reduce((acc, curr) => acc + curr.total, 0);
  const calculatedAbsent = calculatedTotal - calculatedPresent > 0 ? calculatedTotal - calculatedPresent : 0;

  const handleLogout = async () => {
    try {
      setShowDrawer(false);
      await signOut();
    } catch {
      Alert.alert('Error', 'Logout failed.');
    }
  };

  const handleAddUser = () => {
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('UsersTab');
    } else {
      Alert.alert('System Navigation', 'Navigating to User Directory Tab.');
    }
  };

  const handleNewAlert = () => {
    navigation.navigate('CreateAnnouncement');
  };

  const handleViewReports = () => {
    navigation.navigate('AdminResultsOverview');
  };

  const handleConfig = () => {
    Alert.alert('System Configuration', 'Accessing institutional system configurations.');
  };

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Recently';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Side Navigation Drawer Overlay */}
      {showDrawer && (
        <Modal
          transparent
          visible={showDrawer}
          animationType="none"
          onRequestClose={() => setShowDrawer(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.drawerContentContainer}>
              {/* Drawer Header: User Profile */}
              <View style={styles.drawerHeader}>
                <View style={styles.drawerAvatarWrapper}>
                  <Image
                    style={styles.drawerAvatarImg}
                    source={{
                      uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBB-Qz_VWidTvF94GrrGOrPhV2pGkXIF46b5DF5E8sEhtZeDLVZJXLpAkUyLJGnElGMJvlzyVXN-vjiT-w_N5n5KLq38eW83VWX9XciTmJbdLLw-1p95AiuPFUIgoEo8P4PF4W7qRkmTW6NxYvGe9z0HhZf2D_uOu5VwBPaYSPbvemEmCqnUrM1PLtgAab3rZiNXOCqkXsdZlDZjzT7NMU8Mq7tLGlmeztwzVTf80uW96EesABEW_xN',
                    }}
                  />
                </View>
                <View>
                  <Text style={styles.drawerAdminName}>{user?.name || 'Administrator'}</Text>
                  <Text style={styles.drawerAdminRole}>
                    {user?.role ? user.role.toUpperCase() : 'ADMINISTRATOR'}
                  </Text>
                  <Text style={styles.drawerAdminId}>{user?.email || 'admin@sikhsha.edu'}</Text>
                </View>
              </View>

              {/* Drawer Links */}
              <ScrollView style={styles.drawerNav}>
                <TouchableOpacity
                  style={styles.drawerNavItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setShowDrawer(false);
                    navigation.navigate('UserList' as never);
                  }}
                >
                  <AccountDetailsIcon size={22} color="#003fb1" />
                  <Text style={styles.drawerNavItemText}>Users & Staff</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.drawerNavItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setShowDrawer(false);
                    navigation.navigate('AdminAttendanceOverview' as never);
                  }}
                >
                  <FactCheckIcon size={22} color="#003fb1" />
                  <Text style={styles.drawerNavItemText}>Class Attendance</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.drawerNavItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setShowDrawer(false);
                    navigation.navigate('Announcements' as never);
                  }}
                >
                  <MegaphoneIcon size={22} color="#003fb1" />
                  <Text style={styles.drawerNavItemText}>Announcements</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.drawerNavItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setShowDrawer(false);
                    navigation.navigate('AdminResultsOverview' as never);
                  }}
                >
                  <ReportIcon size={22} color="#003fb1" />
                  <Text style={styles.drawerNavItemText}>Student Results</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.drawerNavItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setShowDrawer(false);
                    navigation.navigate('Messaging' as never);
                  }}
                >
                  <SendIcon size={22} color="#003fb1" />
                  <Text style={styles.drawerNavItemText}>Messages & Chat</Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Drawer Bottom Logout */}
              <View style={styles.drawerFooter}>
                <TouchableOpacity
                  style={styles.drawerLogoutBtn}
                  activeOpacity={0.7}
                  onPress={handleLogout}
                >
                  <LogoutIcon size={20} color="#ba1a1a" />
                  <Text style={styles.drawerLogoutText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              style={styles.drawerOverlayTouch}
              activeOpacity={1}
              onPress={() => setShowDrawer(false)}
            />
          </View>
        </Modal>
      )}

      {/* Top Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.avatarTouchBtn}
          activeOpacity={0.8}
          onPress={() => setShowDrawer(true)}
        >
          <View style={styles.avatarWrapper}>
            <Image
              style={styles.avatarImg}
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBB-Qz_VWidTvF94GrrGOrPhV2pGkXIF46b5DF5E8sEhtZeDLVZJXLpAkUyLJGnElGMJvlzyVXN-vjiT-w_N5n5KLq38eW83VWX9XciTmJbdLLw-1p95AiuPFUIgoEo8P4PF4W7qRkmTW6NxYvGe9z0HhZf2D_uOu5VwBPaYSPbvemEmCqnUrM1PLtgAab3rZiNXOCqkXsdZlDZjzT7NMU8Mq7tLGlmeztwzVTf80uW96EesABEW_xN',
              }}
            />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.notifBtn}
          activeOpacity={0.6}
          onPress={() => Alert.alert('Notifications', 'No new alerts.')}
        >
          <BellIcon size={22} color="#003fb1" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#003fb1']} />}
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#003fb1" />
            <Text style={styles.loadingText}>Fetching live dashboard analytics...</Text>
          </View>
        ) : null}

        {/* Attendance Overview Weekly Graph */}
        <TouchableOpacity
          style={styles.attendanceOverviewCard}
          onPress={() => navigation.navigate('AdminAttendanceOverview')}
          activeOpacity={0.9}
        >
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Attendance Overview</Text>
              <Text style={styles.cardSubtitle}>Current Week Statistics</Text>
            </View>
            {/* Toggle Chips */}
            <View style={styles.toggleChips}>
              <TouchableOpacity
                style={[
                  styles.toggleChip,
                  attendanceType === 'students' && styles.toggleChipActive,
                ]}
                onPress={() => setAttendanceType('students')}
              >
                <Text
                  style={[
                    styles.toggleChipText,
                    attendanceType === 'students' && styles.toggleChipTextActive,
                  ]}
                >
                  Students
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleChip, attendanceType === 'staff' && styles.toggleChipActive]}
                onPress={() => setAttendanceType('staff')}
              >
                <Text
                  style={[
                    styles.toggleChipText,
                    attendanceType === 'staff' && styles.toggleChipTextActive,
                  ]}
                >
                  Staff
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Visual Bar Chart */}
          <View style={styles.barChartContainer}>
            {currentGraphData.map((item) => {
              const barHeight = item.rate;
              return (
                <View key={item.day} style={styles.chartCol}>
                  <Text style={styles.colLabelTop}>{barHeight > 0 ? `${barHeight}%` : '0%'}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFillBlue,
                        { height: `${barHeight}%`, opacity: barHeight > 0 ? 1 : 0.2 },
                      ]}
                    />
                  </View>
                  <Text style={styles.colLabelBottom}>{item.day}</Text>
                </View>
              );
            })}
          </View>

          {/* Summary Ratios Footer */}
          <View style={styles.statsSummaryFooter}>
            <View style={styles.footerStatBox}>
              <Text style={styles.footerStatLabel}>Average</Text>
              <Text style={[styles.footerStatVal, styles.textBlue]}>{calculatedAvgRate}</Text>
            </View>
            <View style={styles.footerDivider} />
            <View style={styles.footerStatBox}>
              <Text style={styles.footerStatLabel}>Present</Text>
              <Text style={styles.footerStatVal}>{calculatedPresent.toLocaleString()}</Text>
            </View>
            <View style={styles.footerDivider} />
            <View style={styles.footerStatBox}>
              <Text style={styles.footerStatLabel}>Absent</Text>
              <Text style={[styles.footerStatVal, styles.textRed]}>{calculatedAbsent.toLocaleString()}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Announcement Center */}
        <View style={styles.announcementCenterCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Announcement Center</Text>
            <TouchableOpacity
              style={styles.createNewBtn}
              onPress={handleNewAlert}
              activeOpacity={0.7}
            >
              <PlusIcon size={14} color="#ffffff" style={styles.btnIcon} />
              <Text style={styles.createNewBtnText}>Create New</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.announcementsList}>
            {announcements.length > 0 ? (
              announcements.slice(0, 3).map((item, idx) => {
                const borderStyle =
                  idx % 3 === 0
                    ? styles.borderBlue
                    : idx % 3 === 1
                    ? styles.borderGrey
                    : styles.borderGreen;
                const priorityLabel = item.priority
                  ? item.priority.charAt(0).toUpperCase() + item.priority.slice(1)
                  : 'Normal';
                const timeAgo = formatTimeAgo(item.created_at);

                return (
                  <View key={item.id || idx} style={styles.announcementItem}>
                    <View style={[styles.announcementBorder, borderStyle]} />
                    <View style={styles.announcementDetails}>
                      <Text style={styles.announcementHeading}>{item.title}</Text>
                      <Text style={styles.announcementTime}>
                        Sent to: {item.target_role || 'All'} • {timeAgo}
                      </Text>
                      <View style={styles.announcementTagsRow}>
                        <View style={styles.tagBadge}>
                          <Text style={styles.tagBadgeText}>Priority: {priorityLabel}</Text>
                        </View>
                        <View style={styles.tagBadge}>
                          <Text style={styles.tagBadgeText}>Status: Live</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyAnnouncements}>
                <Text style={styles.emptyAnnouncementsText}>No active announcements.</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions Card */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={handleNewAlert}
              activeOpacity={0.7}
            >
              <MegaphoneIcon size={24} color="#ffffff" style={styles.quickActionIcon} />
              <Text style={styles.quickActionBtnText}>New Alert</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={handleViewReports}
              activeOpacity={0.7}
            >
              <ReportIcon size={24} color="#ffffff" style={styles.quickActionIcon} />
              <Text style={styles.quickActionBtnText}>Report</Text>
            </TouchableOpacity>

            {/* <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={handleConfig}
              activeOpacity={0.7}
            >
              <ConfigIcon size={24} color="#ffffff" style={styles.quickActionIcon} />
              <Text style={styles.quickActionBtnText}>Config</Text>
            </TouchableOpacity> */}
          </View>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  avatarTouchBtn: {
    borderRadius: 20,
    shadowColor: '#121c28',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#003fb1',
    backgroundColor: '#ffffff',
  },
  avatarImg: { width: '100%', height: '100%' },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#121c28',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 63, 177, 0.05)',
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#003fb1',
  },
  attendanceOverviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.5)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121c28',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#737686',
    marginTop: 2,
  },
  toggleChips: {
    flexDirection: 'row',
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#c3c5d7',
  },
  toggleChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  toggleChipActive: {
    backgroundColor: '#003fb1',
  },
  toggleChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#737686',
  },
  toggleChipTextActive: {
    color: '#ffffff',
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 135,
    marginTop: 20,
    paddingHorizontal: 8,
  },
  chartCol: {
    alignItems: 'center',
    width: '16%',
  },
  colLabelTop: {
    fontSize: 9,
    fontWeight: '600',
    color: '#003fb1',
    marginBottom: 4,
  },
  barTrack: {
    width: 14,
    height: 90,
    backgroundColor: 'rgba(0, 63, 177, 0.1)',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFillBlue: {
    width: '100%',
    backgroundColor: '#003fb1',
    borderRadius: 8,
  },
  colLabelBottom: {
    fontSize: 10,
    fontWeight: '600',
    color: '#737686',
    marginTop: 6,
  },
  statsSummaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: 'rgba(195, 197, 215, 0.4)',
  },
  footerStatBox: {
    alignItems: 'center',
  },
  footerStatLabel: {
    fontSize: 10,
    color: '#737686',
    fontWeight: '500',
  },
  footerStatVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121c28',
    marginTop: 2,
  },
  textBlue: {
    color: '#003fb1',
  },
  textRed: {
    color: '#ba1a1a',
  },
  textGreen: {
    color: '#006c4a',
  },
  footerDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(195, 197, 215, 0.4)',
  },
  feesOverviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.5)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardSubtitleRight: {
    fontSize: 10,
    color: '#737686',
    fontWeight: '500',
  },
  feesContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  feeSection: {
    flex: 1,
  },
  feeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  feeLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  feeValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#121c28',
  },
  feeProgressBarBg: {
    height: 8,
    backgroundColor: '#f8f9ff',
    borderRadius: 4,
    overflow: 'hidden',
  },
  feeProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  bgGreen: {
    backgroundColor: '#006c4a',
  },
  bgRed: {
    backgroundColor: '#ba1a1a',
  },
  feeVerticalDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(195, 197, 215, 0.4)',
    marginHorizontal: 12,
  },
  announcementCenterCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.5)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  createNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#003fb1',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  btnIcon: {
    marginRight: 4,
  },
  createNewBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  announcementsList: {
    marginTop: 14,
  },
  announcementItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(195, 197, 215, 0.3)',
  },
  announcementBorder: {
    width: 4,
    borderRadius: 2,
    marginRight: 10,
  },
  borderBlue: {
    backgroundColor: '#003fb1',
  },
  borderGrey: {
    backgroundColor: '#737686',
  },
  borderGreen: {
    backgroundColor: '#006c4a',
  },
  announcementDetails: {
    flex: 1,
  },
  announcementHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#121c28',
  },
  announcementTime: {
    fontSize: 10,
    color: '#737686',
    marginTop: 2,
  },
  announcementTagsRow: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 6,
  },
  tagBadge: {
    backgroundColor: '#f8f9ff',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#c3c5d7',
  },
  tagBadgeText: {
    fontSize: 8,
    color: '#434654',
    fontWeight: '500',
  },
  emptyAnnouncements: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyAnnouncementsText: {
    fontSize: 12,
    color: '#737686',
  },
  quickActionsCard: {
    backgroundColor: '#003fb1',
    borderRadius: 16,
    padding: 16,
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 14,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  quickActionBtn: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionIcon: {
    marginBottom: 4,
  },
  quickActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    flexDirection: 'row',
  },
  drawerOverlayTouch: {
    flex: 1,
  },
  drawerContentContainer: {
    width: 280,
    height: '100%',
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderColor: '#c3c5d7',
    paddingBottom: 24,
  },
  drawerHeader: {
    padding: 24,
    backgroundColor: '#eef4ff',
    borderBottomWidth: 1,
    borderColor: '#c3c5d7',
  },
  drawerAvatarWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#003fb1',
    marginBottom: 12,
  },
  drawerAvatarImg: {
    width: '100%',
    height: '100%',
  },
  drawerAdminName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#121c28',
  },
  drawerAdminRole: {
    fontSize: 12,
    color: '#737686',
    marginTop: 2,
  },
  drawerAdminId: {
    fontSize: 11,
    fontWeight: '700',
    color: '#003fb1',
    marginTop: 4,
  },
  drawerNav: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 8,
  },
  drawerNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
    gap: 12,
  },
  drawerNavItemText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#434654',
  },
  drawerFooter: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: '#c3c5d7',
  },
  drawerLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 218, 214, 0.4)',
    borderRadius: 12,
    gap: 8,
  },
  drawerLogoutText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ba1a1a',
  },
});

export default AdminDashboard;
