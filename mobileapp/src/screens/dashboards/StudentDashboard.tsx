import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  Animated,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DashboardStackParamList } from '../../navigation/features/DashboardNavigator';
import { useAuth } from '../../contexts/AuthContext';
import attendanceService from '../../services/attendanceService';
import assignmentService from '../../services/assignmentService';
import communicationService from '../../services/communicationService';
import {
  MenuIcon,
  BellIcon,
  CloseIcon,
  DashboardIcon,
  CalendarIcon,
  SchoolIcon,
  AssignmentIcon,
  FactCheckIcon,
  SendIcon,
  HelpCircleIcon,
  LogoutIcon,
  CalculatorIcon,
  FlaskIcon,
  BookOpenPageIcon,
  ClockOutlineIcon,
  InformationOutlineIcon,
  ParentCircleIcon,
  AlertCircleIcon,
  CreditCardOutlineIcon,
  ContactlessPayIcon,
  MegaphoneIcon,
} from '../../assets/svgs';

type NavProp = StackNavigationProp<DashboardStackParamList, 'Overview'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.78;

const STUDENT_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBZqQVc6a3-RURX_CrQXP1JUcfY0EEGvDvv0TbhvTYU_eV_2u0MES174mwf1t-KNoPVa9bp7XlY70ytNbKhxXGJE0yXSZpwS0_HzagjETCnfUM7zZXWkZY5VqwyWMb5AA4MvzbuJRTUlSFBCrd4MToBNT2oQ4XrLxsZTQJpPIKYftKKavyRnLFYYf1DsCaGmYHM4Kxjg2lq0ES9f9ANqHwCGj_Eyb3d36XQgnYQF7Cdkc0_oVg16r0G';

interface DrawerItem {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  onPress: () => void;
}

const StudentDashboard: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { signOut, user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // Backend state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [attendanceVal, setAttendanceVal] = useState('94%');
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [announcementList, setAnnouncementList] = useState<any[]>([]);

  const fetchStudentData = useCallback(async () => {
    try {
      const [attData, assignData, commData] = await Promise.allSettled([
        attendanceService.getMyAttendance(),
        assignmentService.getAssignments(),
        communicationService.getAnnouncements(),
      ]);

      if (attData.status === 'fulfilled' && attData.value) {
        const val = attData.value;
        if (typeof val.percentage === 'number') {
          setAttendanceVal(`${val.percentage}%`);
        } else if (Array.isArray(val) && val.length > 0) {
          const present = val.filter((a: any) => a.status === 'present').length;
          setAttendanceVal(`${Math.round((present / val.length) * 100)}%`);
        }
      }

      if (assignData.status === 'fulfilled' && Array.isArray(assignData.value)) {
        setHomeworkList(assignData.value);
      }

      if (commData.status === 'fulfilled' && Array.isArray(commData.value)) {
        setAnnouncementList(commData.value);
      }
    } catch {
      // Fallback handled smoothly
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStudentData();
  };

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.timing(drawerAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(drawerAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start(() => setDrawerOpen(false));
  };

  const handlePayNow = () => {
    navigation.navigate('StudentPayments');
    closeDrawer();
  };

  const handleViewAssignments = () => {
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('AssignmentsTab');
    } else {
      navigation.navigate('Assignments' as never);
    }
    closeDrawer();
  };

  const drawerItems: DrawerItem[] = [
    {
      icon: <DashboardIcon size={18} color="#ffffff" />,
      label: 'Dashboard Overview',
      onPress: () => closeDrawer(),
    },
    {
      icon: <CalendarIcon size={18} color="#003fb1" />,
      label: 'Class Schedule',
      onPress: () => {
        closeDrawer();
        navigation.navigate('StudentSchedule');
      },
    },
    {
      icon: <SchoolIcon size={18} color="#003fb1" />,
      label: 'Report Card & Grades',
      onPress: () => {
        closeDrawer();
        navigation.navigate('StudentReportCard');
      },
    },
    {
      icon: <AssignmentIcon size={18} color="#003fb1" />,
      label: 'Assignments & Homework',
      badge: homeworkList.length ? `${homeworkList.length}` : undefined,
      onPress: handleViewAssignments,
    },
    {
      icon: <FactCheckIcon size={18} color="#003fb1" />,
      label: 'My Attendance',
      onPress: () => {
        closeDrawer();
        navigation.navigate('StudentAttendance');
      },
    },
    {
      icon: <MegaphoneIcon size={18} color="#003fb1" />,
      label: 'School Announcements',
      onPress: () => {
        closeDrawer();
        navigation.navigate('Announcements');
      },
    },
    {
      icon: <SendIcon size={18} color="#003fb1" />,
      label: 'Messages & Chat',
      onPress: () => {
        closeDrawer();
        navigation.navigate('Messaging');
      },
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* ===== DRAWER OVERLAY ===== */}
      {drawerOpen && (
        <Modal visible={drawerOpen} transparent animationType="none" onRequestClose={closeDrawer}>
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <Animated.View style={[styles.drawerOverlay, { opacity: overlayAnim }]} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerAnim }] }]}>
          {/* Drawer Header */}
          <View style={styles.drawerHeader}>
            <TouchableOpacity
              style={styles.drawerCloseBtn}
              onPress={closeDrawer}
              activeOpacity={0.7}
            >
              <CloseIcon size={20} color="#ffffff" />
            </TouchableOpacity>

            <View style={styles.drawerAvatarContainer}>
              <Image style={styles.drawerAvatar} source={{ uri: STUDENT_AVATAR }} />
              <View style={styles.drawerAvatarOnline} />
            </View>
            <Text style={styles.drawerStudentName}>{user?.name || 'Alex Johnson'}</Text>
            <Text style={styles.drawerStudentEmail}>{user?.email || 'alex.j@educore.edu'}</Text>

            {/* Quick Stats Row */}
            <View style={styles.drawerStatsRow}>
              <View style={styles.drawerStat}>
                <Text style={styles.drawerStatVal}>94%</Text>
                <Text style={styles.drawerStatLabel}>Attendance</Text>
              </View>
              <View style={styles.drawerStatDivider} />
              <View style={styles.drawerStat}>
                <Text style={styles.drawerStatVal}>3.8</Text>
                <Text style={styles.drawerStatLabel}>GPA</Text>
              </View>
              <View style={styles.drawerStatDivider} />
              <View style={styles.drawerStat}>
                <Text style={styles.drawerStatVal}>Grade 11</Text>
                <Text style={styles.drawerStatLabel}>Class</Text>
              </View>
            </View>
          </View>

          {/* Nav Items */}
          <ScrollView style={styles.drawerScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.drawerSectionLabel}>NAVIGATION</Text>
            {drawerItems.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.drawerNavItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.drawerNavLeft}>
                  <View style={[styles.drawerNavIconBg, idx === 0 && styles.drawerNavIconBgActive]}>
                    {item.icon}
                  </View>
                  <Text style={[styles.drawerNavLabel, idx === 0 && styles.drawerNavLabelActive]}>
                    {item.label}
                  </Text>
                </View>
                {item.badge && (
                  <View style={[styles.drawerBadge, item.badge === '!' && styles.drawerBadgeAlert]}>
                    <Text style={styles.drawerBadgeText}>{item.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            <View style={styles.drawerDivider} />
            <Text style={styles.drawerSectionLabel}>ACCOUNT</Text>

            <TouchableOpacity
              style={styles.drawerLogoutBtn}
              onPress={() => {
                closeDrawer();
                setTimeout(() => signOut(), 300);
              }}
              activeOpacity={0.7}
            >
              <LogoutIcon size={18} color="#ba1a1a" />
              <Text style={styles.drawerLogoutText}>Sign Out</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.drawerFooter}>
            <Text style={styles.drawerFooterText}>EduCore ERP v2.4.1</Text>
          </View>
        </Animated.View>
      </Modal>
      )}

      {/* ===== TOP BAR ===== */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={openDrawer} activeOpacity={0.8} style={styles.avatarTouchBtn}>
          <View style={styles.avatarWrapper}>
            <Image style={styles.avatarImg} source={{ uri: STUDENT_AVATAR }} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.notifBtn}
          activeOpacity={0.6}
          onPress={() => Alert.alert('Notifications', 'No new alerts.')}
        >
          <View style={styles.notifBadgeWrapper}>
            <BellIcon size={22} color="#003fb1" />
            <View style={styles.notifDot} />
          </View>
        </TouchableOpacity>
      </View>

      {/* ===== MAIN CONTENT ===== */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#003fb1']} />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeGreeting}>Good morning 👋</Text>
          <Text style={styles.welcomeTitle}>Hello, {user?.name?.split(' ')[0] || 'Student'}</Text>
          <Text style={styles.welcomeSubtitle}>Your academic journey is looking great today.</Text>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabelGreen}>Attendance</Text>
              <FactCheckIcon size={18} color="#006c4a" />
            </View>
            <Text style={styles.statVal}>{attendanceVal}</Text>
            <Text style={styles.statDesc}>Overall Tracked</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabelBlue}>Homework</Text>
              <AssignmentIcon size={18} color="#003fb1" />
            </View>
            <Text style={styles.statVal}>{homeworkList.length}</Text>
            <Text style={styles.statDesc}>Active Tasks</Text>
          </View>
        </View>

        {/* My Homework */}
        <View style={styles.bentoSection}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>My Homework</Text>
            <TouchableOpacity onPress={handleViewAssignments} activeOpacity={0.6}>
              <Text style={styles.headerLink}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.homeworkList}>
            {loading ? (
              <ActivityIndicator color="#003fb1" style={{ marginVertical: 16 }} />
            ) : homeworkList.length === 0 ? (
              <Text style={{ color: '#737686', fontSize: 13, paddingVertical: 8 }}>
                No active homework assignments right now.
              </Text>
            ) : (
              homeworkList.slice(0, 3).map((item: any, idx: number) => {
                const title = item.title || 'Assignment';
                const due = item.due_date || item.dueDate
                  ? new Date(item.due_date || item.dueDate).toLocaleDateString()
                  : 'No due date';
                const isHigh = item.priority === 'high' || item.is_urgent;

                return (
                  <TouchableOpacity
                    key={item.id || idx}
                    style={styles.homeworkRow}
                    activeOpacity={0.7}
                    onPress={handleViewAssignments}
                  >
                    <View style={styles.hwIconBox}>
                      <AssignmentIcon size={20} color="#003fb1" />
                    </View>
                    <View style={styles.hwMeta}>
                      <Text style={styles.hwTitle} numberOfLines={1}>{title}</Text>
                      <Text style={styles.hwDue}>Due {due}</Text>
                    </View>
                    <View style={isHigh ? styles.badgeRed : styles.badgeGrey}>
                      <Text style={isHigh ? styles.badgeRedText : styles.badgeGreyText}>
                        {item.subject_name || item.subject || (isHigh ? 'High' : 'Active')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>

        {/* Latest Announcements */}
        <View style={styles.bentoSection}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>Latest Announcements</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Announcements' as never)} activeOpacity={0.6}>
              <Text style={styles.headerLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color="#003fb1" style={{ marginVertical: 16 }} />
          ) : announcementList.length === 0 ? (
            <View style={styles.infoAlertBox}>
              <InformationOutlineIcon size={18} color="#723b00" />
              <View style={styles.alertMeta}>
                <Text style={styles.alertTitle}>School Bulletins</Text>
                <Text style={styles.alertDesc}>No new announcements posted today.</Text>
              </View>
            </View>
          ) : (
            announcementList.slice(0, 2).map((ann: any, idx: number) => (
              <View key={ann.id || idx} style={styles.infoAlertBox}>
                <InformationOutlineIcon size={18} color="#003fb1" />
                <View style={styles.alertMeta}>
                  <Text style={styles.alertTitle}>{ann.title}</Text>
                  <Text style={styles.alertDesc} numberOfLines={2}>{ann.content}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff' },

  // ===== DRAWER =====
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  drawerHeader: {
    backgroundColor: '#003fb1',
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  drawerCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerAvatarContainer: {
    position: 'relative',
    width: 68,
    height: 68,
    marginBottom: 12,
  },
  drawerAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  drawerAvatarOnline: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#82f5c1',
    borderWidth: 2,
    borderColor: '#003fb1',
  },
  drawerStudentName: { fontSize: 17, fontWeight: '700', color: '#ffffff' },
  drawerStudentEmail: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    marginBottom: 16,
  },
  drawerStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  drawerStat: { flex: 1, alignItems: 'center' },
  drawerStatVal: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  drawerStatLabel: { fontSize: 9, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  drawerStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 2 },
  drawerScroll: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  drawerSectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#737686',
    letterSpacing: 1.5,
    marginTop: 8,
    marginBottom: 8,
    marginLeft: 4,
  },
  drawerNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
    marginBottom: 2,
  },
  drawerNavLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  drawerNavIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e5eeff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerNavIconBgActive: { backgroundColor: '#003fb1' },
  drawerNavLabel: { fontSize: 14, fontWeight: '600', color: '#121c28' },
  drawerNavLabelActive: { color: '#003fb1' },
  drawerBadge: {
    backgroundColor: '#003fb1',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  drawerBadgeAlert: { backgroundColor: '#ba1a1a' },
  drawerBadgeText: { fontSize: 9, fontWeight: '800', color: '#ffffff' },
  drawerDivider: { height: 1, backgroundColor: '#e5eeff', marginVertical: 12 },
  drawerLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffdad6',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  drawerLogoutText: { fontSize: 14, fontWeight: '700', color: '#ba1a1a' },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e5eeff',
    padding: 14,
    alignItems: 'center',
  },
  drawerFooterText: { fontSize: 10, color: '#c3c5d7', fontWeight: '600' },

  // ===== HEADER =====
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
  notifBadgeWrapper: { position: 'relative' },
  notifDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ba1a1a',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },

  // ===== CONTENT =====
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  welcomeSection: { marginBottom: 20 },
  welcomeGreeting: { fontSize: 12, fontWeight: '600', color: '#737686', marginBottom: 2 },
  welcomeTitle: { fontSize: 22, fontWeight: '700', color: '#003fb1' },
  welcomeSubtitle: { fontSize: 13, color: '#737686', marginTop: 2 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 16,
    padding: 14,
  },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabelGreen: { fontSize: 10, fontWeight: '800', color: '#006c4a', textTransform: 'uppercase' },
  statLabelBlue: { fontSize: 10, fontWeight: '800', color: '#003fb1', textTransform: 'uppercase' },
  statVal: { fontSize: 24, fontWeight: '800', color: '#121c28', marginTop: 10 },
  statDesc: { fontSize: 10, color: '#737686', marginTop: 4 },
  performanceCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#121c28', marginBottom: 14 },
  progressContainer: { marginBottom: 12 },
  progressBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressBarLabel: { fontSize: 12, color: '#737686', fontWeight: '600' },
  progressBarGrade: { fontSize: 12, fontWeight: '700', color: '#003fb1' },
  progressBarBg: { height: 6, backgroundColor: '#e5eeff', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#003fb1', borderRadius: 3 },
  fillMath: { width: '88%' },
  fillPhysics: { width: '82%' },
  fillEnglish: { width: '76%' },
  bentoSection: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLink: { fontSize: 12, fontWeight: '700', color: '#003fb1' },
  homeworkList: { gap: 12 },
  homeworkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9ff',
  },
  hwIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ffdcc3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hwMeta: { flex: 1, marginLeft: 12 },
  hwTitle: { fontSize: 13, fontWeight: '700', color: '#121c28' },
  hwDue: { fontSize: 10, color: '#737686', marginTop: 2 },
  badgeRed: {
    backgroundColor: '#ffdad6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeRedText: { fontSize: 9, fontWeight: '800', color: '#ba1a1a' },
  badgeGrey: {
    backgroundColor: '#e5eeff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeGreyText: { fontSize: 9, fontWeight: '800', color: '#434654' },
  announcementBannerCard: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  announcementImg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  bannerContent: { padding: 14, zIndex: 10 },
  bannerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#003fb1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  bannerBadgeText: { fontSize: 8, fontWeight: '800', color: '#ffffff', textTransform: 'uppercase' },
  bannerTitle: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  bannerDesc: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  bannerTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  bannerTimeText: { fontSize: 9, color: 'rgba(255,255,255,0.7)' },
  infoAlertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffdcc3',
    padding: 12,
    borderRadius: 12,
  },
  alertMeta: { marginLeft: 10, flex: 1 },
  alertTitle: { fontSize: 13, fontWeight: '700', color: '#723b00' },
  alertDesc: { fontSize: 11, color: '#723b00', marginTop: 2, lineHeight: 16 },
  parentPortalContainer: {
    backgroundColor: '#e5eeff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 20,
    padding: 16,
  },
  parentHeaderTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  parentTitleText: { fontSize: 15, fontWeight: '700', color: '#003fb1' },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffdad6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  overdueBadgeText: { fontSize: 10, fontWeight: '700', color: '#ba1a1a' },
  parentSubtitleText: { fontSize: 11, color: '#737686', marginTop: 2, marginBottom: 16 },
  feeDetailsCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  feeCardSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#737686',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  feeItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9ff',
    paddingVertical: 10,
  },
  feeItemTitle: { fontSize: 13, fontWeight: '700', color: '#121c28' },
  feeItemDue: { fontSize: 10, color: '#737686', marginTop: 2 },
  feeAmountBlock: { alignItems: 'flex-end', gap: 4 },
  feeItemValRed: { fontSize: 14, fontWeight: '800', color: '#ba1a1a' },
  overdueBadgeMini: {
    backgroundColor: '#ba1a1a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  overdueBadgeMiniText: { fontSize: 8, fontWeight: '800', color: '#ffffff' },
  feeItemVal: { fontSize: 14, fontWeight: '800', color: '#121c28' },
  portalPayBtn: {
    backgroundColor: '#003fb1',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
    borderRadius: 10,
    marginTop: 14,
    gap: 8,
  },
  portalPayBtnText: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  historyCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  historyItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9ff',
  },
  historyItemTitle: { fontSize: 12, fontWeight: '700', color: '#121c28' },
  historyItemDate: { fontSize: 10, color: '#737686', marginTop: 2 },
  historyStatusBlock: { alignItems: 'flex-end', gap: 4 },
  historyAmount: { fontSize: 12, fontWeight: '700', color: '#121c28' },
  successBadge: {
    backgroundColor: 'rgba(0, 108, 74, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  successBadgeText: { fontSize: 8, fontWeight: '800', color: '#006c4a' },
  debitCardGraphic: {
    height: 140,
    backgroundColor: '#003fb1',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
  },
  debitCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardBrand: { alignItems: 'flex-end' },
  brandTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  brandSub: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  debitCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardHolder: { fontSize: 11, fontWeight: '700', color: '#ffffff' },
  cardNumber: { fontSize: 12, fontWeight: '700', color: '#ffffff', letterSpacing: 0.5 },
});

export default StudentDashboard;
