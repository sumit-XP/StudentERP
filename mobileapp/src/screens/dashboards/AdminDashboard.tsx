import React, { useState } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DashboardStackParamList } from '../../navigation/features/DashboardNavigator';
import { useAuth } from '../../contexts/AuthContext';
import {
  MenuIcon,
  BellIcon,
  ProfileIcon,
  AccountDetailsIcon,
  SettingsIcon,
  SecurityIcon,
  LogoutIcon,
  AddUserIcon,
  MegaphoneIcon,
  ReportIcon,
  ConfigIcon,
  PlusIcon,
} from '../../assets/svgs';

type NavProp = StackNavigationProp<DashboardStackParamList, 'Overview'>;

const AdminDashboard: React.FC = () => {
  const { signOut } = useAuth();
  const navigation = useNavigation<NavProp>();
  const [attendanceType, setAttendanceType] = useState<'students' | 'staff'>('students');
  const [showDrawer, setShowDrawer] = useState(false);

  // Chart heights corresponding to Monday - Friday
  const studentChartData = [85, 94, 78, 91, 88];
  const staffChartData = [92, 96, 88, 95, 90];
  const activeChartData = attendanceType === 'students' ? studentChartData : staffChartData;

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
            <TouchableOpacity
              style={styles.drawerOverlayTouch}
              activeOpacity={1}
              onPress={() => setShowDrawer(false)}
            />
            <View style={styles.drawerContentContainer}>
              {/* Drawer Header: User Profile */}
              <View style={styles.drawerHeader}>
                <View style={styles.drawerAvatarWrapper}>
                  <Image
                    style={styles.drawerAvatarImg}
                    source={{
                      uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuClJd5tPLs2KqiIBF5ifbAWZDAci21zuUCQfxzhjggb4MNK3xOp98L4zrA_zPa8WmkIxbHYa0eBlOFh3XIZjzq-syZANV-W2DT3GHnGb_D_6QP54ScuJAAy4-oOq5ibVf6CSSTyleQ151JQeqpWltLb7OivAM0zvXnH88vnWjcTnpcY0VzUbGO3UezIl_WdPsVI-n_cyjCl3fLXfpqayRnDg8i9JH0sQ_Ud2ai5R8kO6oI6n-q365xH',
                    }}
                  />
                </View>
                <View>
                  <Text style={styles.drawerAdminName}>Admin Name</Text>
                  <Text style={styles.drawerAdminRole}>Administrator</Text>
                  <Text style={styles.drawerAdminId}>ID: AD-1024</Text>
                </View>
              </View>

              {/* Drawer Links */}
              <ScrollView style={styles.drawerNav}>
                <TouchableOpacity style={styles.drawerNavItem} activeOpacity={0.6}>
                  <ProfileIcon size={22} color="#434654" />
                  <Text style={styles.drawerNavItemText}>My Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerNavItem} activeOpacity={0.6}>
                  <AccountDetailsIcon size={22} color="#434654" />
                  <Text style={styles.drawerNavItemText}>Account Details</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerNavItem} activeOpacity={0.6}>
                  <SettingsIcon size={22} color="#434654" />
                  <Text style={styles.drawerNavItemText}>Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerNavItem} activeOpacity={0.6}>
                  <SecurityIcon size={22} color="#434654" />
                  <Text style={styles.drawerNavItemText}>Security</Text>
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
          </View>
        </Modal>
      )}

      {/* Top Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerProfile}>
          <TouchableOpacity
            style={styles.menuBtn}
            activeOpacity={0.6}
            onPress={() => setShowDrawer(true)}
          >
            <MenuIcon size={24} color="#003fb1" />
          </TouchableOpacity>
          <Text style={styles.headerText}>EduCore ERP</Text>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          activeOpacity={0.6}
          onPress={() => Alert.alert('Notifications', 'No new alerts.')}
        >
          <BellIcon size={22} color="#003fb1" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Bento Grid Row 2: Attendance Overview Weekly Graph */}
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
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, idx) => {
              const barHeight = activeChartData[idx];
              return (
                <View key={day} style={styles.chartCol}>
                  <Text style={styles.colLabelTop}>{barHeight}%</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFillBlue, { height: `${barHeight}%` }]} />
                  </View>
                  <Text style={styles.colLabelBottom}>{day}</Text>
                </View>
              );
            })}
          </View>

          {/* Summary Ratios Footer */}
          <View style={styles.statsSummaryFooter}>
            <View style={styles.footerStatBox}>
              <Text style={styles.footerStatLabel}>Average</Text>
              <Text style={[styles.footerStatVal, styles.textBlue]}>91.4%</Text>
            </View>
            <View style={styles.footerDivider} />
            <View style={styles.footerStatBox}>
              <Text style={styles.footerStatLabel}>Present</Text>
              <Text style={styles.footerStatVal}>2,410</Text>
            </View>
            <View style={styles.footerDivider} />
            <View style={styles.footerStatBox}>
              <Text style={styles.footerStatLabel}>Absent</Text>
              <Text style={[styles.footerStatVal, styles.textRed]}>42</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Fees Overview Card */}
        <View style={styles.feesOverviewCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Fees Overview</Text>
            <Text style={styles.cardSubtitleRight}>This Month</Text>
          </View>
          <View style={styles.feesContentRow}>
            <View style={styles.feeSection}>
              <View style={styles.feeHeaderRow}>
                <Text style={[styles.feeLabel, styles.textGreen]}>Collected (75%)</Text>
                <Text style={styles.feeValue}>$45,200</Text>
              </View>
              <View style={styles.feeProgressBarBg}>
                <View style={[styles.feeProgressBarFill, styles.bgGreen, styles.w75]} />
              </View>
            </View>

            <View style={styles.feeVerticalDivider} />

            <View style={styles.feeSection}>
              <View style={styles.feeHeaderRow}>
                <Text style={[styles.feeLabel, styles.textRed]}>Pending (25%)</Text>
                <Text style={styles.feeValue}>$15,000</Text>
              </View>
              <View style={styles.feeProgressBarBg}>
                <View style={[styles.feeProgressBarFill, styles.bgRed, styles.w25]} />
              </View>
            </View>
          </View>
        </View>

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
            <View style={styles.announcementItem}>
              <View style={[styles.announcementBorder, styles.borderBlue]} />
              <View style={styles.announcementDetails}>
                <Text style={styles.announcementHeading}>Final Exam Schedule Published</Text>
                <Text style={styles.announcementTime}>
                  Sent to: All Students &amp; Faculty • 2h ago
                </Text>
                <View style={styles.announcementTagsRow}>
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagBadgeText}>Priority: High</Text>
                  </View>
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagBadgeText}>Status: Live</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.announcementItem}>
              <View style={[styles.announcementBorder, styles.borderGrey]} />
              <View style={styles.announcementDetails}>
                <Text style={styles.announcementHeading}>Annual Sports Day Postponed</Text>
                <Text style={styles.announcementTime}>Sent to: Parents • Yesterday</Text>
                <View style={styles.announcementTagsRow}>
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagBadgeText}>Priority: Medium</Text>
                  </View>
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagBadgeText}>Status: Live</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.announcementItem}>
              <View style={[styles.announcementBorder, styles.borderGreen]} />
              <View style={styles.announcementDetails}>
                <Text style={styles.announcementHeading}>New Cafeteria Menu - Summer</Text>
                <Text style={styles.announcementTime}>Sent to: Everyone • 3 days ago</Text>
                <View style={styles.announcementTagsRow}>
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagBadgeText}>Priority: Low</Text>
                  </View>
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagBadgeText}>Status: Live</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions Card */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={handleAddUser}
              activeOpacity={0.7}
            >
              <AddUserIcon size={24} color="#ffffff" style={styles.quickActionIcon} />
              <Text style={styles.quickActionBtnText}>Add User</Text>
            </TouchableOpacity>

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

            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={handleConfig}
              activeOpacity={0.7}
            >
              <ConfigIcon size={24} color="#ffffff" style={styles.quickActionIcon} />
              <Text style={styles.quickActionBtnText}>Config</Text>
            </TouchableOpacity>
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
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#c3c5d7',
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#003fb1',
  },
  notifBtn: {
    padding: 8,
    borderRadius: 9999,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
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
    fontSize: 9,
    fontWeight: '700',
    color: '#737686',
    marginTop: 6,
  },
  statsSummaryFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#c3c5d7',
    paddingTop: 12,
    marginTop: 16,
  },
  footerStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  footerStatLabel: {
    fontSize: 10,
    color: '#737686',
    fontWeight: '600',
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
  footerDivider: {
    width: 1,
    backgroundColor: '#c3c5d7',
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
    fontSize: 12,
    color: '#737686',
    fontWeight: '500',
  },
  feesContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
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
    fontSize: 12,
    fontWeight: '700',
  },
  feeValue: {
    fontSize: 12,
    color: '#434654',
    fontWeight: '500',
  },
  feeProgressBarBg: {
    height: 8,
    backgroundColor: '#dfe9fa',
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
  textGreen: {
    color: '#006c4a',
  },
  feeVerticalDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#c3c5d7',
    marginHorizontal: 12,
  },
  w75: {
    width: '75%',
  },
  w25: {
    width: '25%',
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
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  btnIcon: {
    marginRight: 4,
  },
  createNewBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  announcementsList: {
    marginTop: 16,
    gap: 14,
  },
  announcementItem: {
    flexDirection: 'row',
  },
  announcementBorder: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  borderBlue: {
    backgroundColor: '#003fb1',
  },
  borderGreen: {
    backgroundColor: '#006c4a',
  },
  borderGrey: {
    backgroundColor: '#c3c5d7',
  },
  announcementDetails: {
    flex: 1,
  },
  announcementHeading: {
    fontSize: 13,
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
    gap: 6,
    marginTop: 6,
  },
  tagBadge: {
    backgroundColor: '#e5eeff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#434654',
  },
  quickActionsCard: {
    backgroundColor: '#003fb1',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
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
