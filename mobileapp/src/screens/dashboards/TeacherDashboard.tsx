import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Platform,
  Alert,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DashboardStackParamList } from '../../navigation/features/DashboardNavigator';
import { useAuth } from '../../contexts/AuthContext';
import communicationService from '../../services/communicationService';
import academicService from '../../services/academicService';
import dashboardService from '../../services/dashboardService';
import {
  MenuIcon,
  BellIcon,
  FactCheckIcon,
  AssignmentIcon,
  AnalyticsIcon,
  SendIcon,
  CalendarIcon,
  GradeIcon,
  SettingsIcon,
  LogoutIcon,
  MegaphoneIcon,
  ChevronRightIcon,
} from '../../assets/svgs';

type NavProp = StackNavigationProp<DashboardStackParamList, 'Overview'>;

interface ScheduleItem {
  id?: string;
  time?: string;
  ampm?: string;
  subject?: string;
  className?: string;
  room?: string;
  isLive?: boolean;
}

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  created_at?: string;
  date?: string;
}

const TeacherDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<NavProp>();
  const [showDrawer, setShowDrawer] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [scheduleList, setScheduleList] = useState<ScheduleItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [completionProgress, setCompletionProgress] = useState<number>(78);

  const teacherName = user?.name || 'Prof. Anderson';
  const teacherRole = user?.email || 'Teacher';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [annRes, schedRes] = await Promise.allSettled([
        communicationService.getAnnouncements(),
        user?.id ? academicService.getTeacherSchedule(user.id) : academicService.getClasses(),
      ]);

      if (annRes.status === 'fulfilled' && Array.isArray(annRes.value)) {
        setAnnouncements(annRes.value);
      } else {
        setAnnouncements([]);
      }

      if (schedRes.status === 'fulfilled' && Array.isArray(schedRes.value)) {
        const mappedSchedule = schedRes.value.map((item: any, idx: number) => ({
          id: item.id || `sched-${idx}`,
          time: item.start_time || item.time || `${9 + idx}:00`,
          ampm: item.ampm || (9 + idx < 12 ? 'AM' : 'PM'),
          subject: item.subject_name || item.name || item.subject || 'Class Lecture',
          className: item.class_name ? `Grade ${item.class_name}-${item.section || 'A'}` : 'Room 101',
          room: item.room || 'Room Main',
          isLive: idx === 0,
        }));
        setScheduleList(mappedSchedule);
      } else {
        setScheduleList([]);
      }
    } catch {
      // Silently catch network errors for offline fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleMarkAttendance = () => {
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('AttendanceTab' as never);
    } else {
      navigation.navigate('AttendanceTab' as never);
    }
  };

  const handleAssignHomework = () => {
    navigation.navigate('AssignHomework');
  };

  const handleUpdateResults = () => {
    navigation.navigate('GradingResults');
  };

  const handleSendMessages = () => {
    navigation.navigate('CreateAnnouncement');
  };

  const handleLogout = async () => {
    try {
      setShowDrawer(false);
      await signOut();
    } catch {
      Alert.alert('Error', 'Logout failed.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.avatarTouchBtn}
          activeOpacity={0.8}
          onPress={() => setShowDrawer(true)}
        >
          <View style={styles.avatarWrapper}>
            <Image
              style={styles.avatar}
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBB-Qz_VWidTvF94GrrGOrPhV2pGkXIF46b5DF5E8sEhtZeDLVZJXLpAkUyLJGnElGMJvlzyVXN-vjiT-w_N5n5KLq38eW83VWX9XciTmJbdLLw-1p95AiuPFUIgoEo8P4PF4W7qRkmTW6NxYvGe9z0HhZf2D_uOu5VwBPaYSPbvemEmCqnUrM1PLtgAab3rZiNXOCqkXsdZlDZjzT7NMU8Mq7tLGlmeztwzVTf80uW96EesABEW_xN',
              }}
            />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.notificationBtn}
          activeOpacity={0.6}
          onPress={() => Alert.alert('Notifications', 'No new notifications.')}
        >
          <BellIcon size={22} color="#003fb1" />
        </TouchableOpacity>
      </View>

      {/* Slide-out Navigation Drawer Overlay */}
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
                  <Text style={styles.drawerAdminName}>{teacherName}</Text>
                  <Text style={styles.drawerAdminRole}>{teacherRole}</Text>
                </View>
              </View>

              {/* Drawer Links */}
              <ScrollView style={styles.drawerNav}>
                <TouchableOpacity
                  style={styles.drawerNavItem}
                  activeOpacity={0.6}
                  onPress={() => {
                    setShowDrawer(false);
                    handleMarkAttendance();
                  }}
                >
                  <FactCheckIcon size={22} color="#434654" />
                  <Text style={styles.drawerNavItemText}>Attendance</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.drawerNavItem}
                  activeOpacity={0.6}
                  onPress={() => {
                    setShowDrawer(false);
                    handleAssignHomework();
                  }}
                >
                  <AssignmentIcon size={22} color="#434654" />
                  <Text style={styles.drawerNavItemText}>Assignments</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.drawerNavItem}
                  activeOpacity={0.6}
                  onPress={() => {
                    setShowDrawer(false);
                    handleUpdateResults();
                  }}
                >
                  <AnalyticsIcon size={22} color="#434654" />
                  <Text style={styles.drawerNavItemText}>Results</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.drawerNavItem}
                  activeOpacity={0.6}
                  onPress={() => {
                    setShowDrawer(false);
                    Alert.alert('Schedule', 'Opening schedule calendar.');
                  }}
                >
                  <CalendarIcon size={22} color="#434654" />
                  <Text style={styles.drawerNavItemText}>Schedule</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.drawerNavItem}
                  activeOpacity={0.6}
                  onPress={() => {
                    setShowDrawer(false);
                    Alert.alert('Grades', 'Opening grades configuration.');
                  }}
                >
                  <GradeIcon size={22} color="#434654" />
                  <Text style={styles.drawerNavItemText}>Grades</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.drawerNavItem}
                  activeOpacity={0.6}
                  onPress={() => {
                    setShowDrawer(false);
                    Alert.alert('Settings', 'Opening system settings.');
                  }}
                >
                  <SettingsIcon size={22} color="#434654" />
                  <Text style={styles.drawerNavItemText}>Settings</Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Drawer Footer: Logout */}
              <View style={styles.drawerFooter}>
                <TouchableOpacity
                  style={styles.drawerLogoutBtn}
                  activeOpacity={0.6}
                  onPress={handleLogout}
                >
                  <LogoutIcon size={22} color="#ba1a1a" />
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#003fb1']} />}
      >
        {/* Quick Actions Bento Grid */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.bentoGrid}>
            {/* Mark Attendance */}
            <TouchableOpacity
              style={[styles.bentoCard, styles.bentoCardPrimary]}
              onPress={handleMarkAttendance}
              activeOpacity={0.9}
            >
              <View style={styles.iconCircle}>
                <FactCheckIcon size={24} color="#ffffff" />
              </View>
              <Text style={styles.bentoCardText}>Mark Attendance</Text>
            </TouchableOpacity>

            {/* Assign Homework */}
            <TouchableOpacity
              style={[styles.bentoCard, styles.bentoCardSecondary]}
              onPress={handleAssignHomework}
              activeOpacity={0.9}
            >
              <View style={[styles.iconCircle, styles.iconCircleTranslucent]}>
                <AssignmentIcon size={24} color="#00714e" />
              </View>
              <Text style={[styles.bentoCardText, styles.bentoTextGreen]}>Assign Homework</Text>
            </TouchableOpacity>

            {/* Update Results */}
            <TouchableOpacity
              style={[styles.bentoCard, styles.bentoCardOrange]}
              onPress={handleUpdateResults}
              activeOpacity={0.9}
            >
              <View style={[styles.iconCircle, styles.iconCircleTranslucent]}>
                <AnalyticsIcon size={24} color="#723b00" />
              </View>
              <Text style={[styles.bentoCardText, styles.bentoTextOrange]}>Update Results</Text>
            </TouchableOpacity>

            {/* Send Messages */}
            <TouchableOpacity
              style={[styles.bentoCard, styles.bentoCardGrey]}
              onPress={handleSendMessages}
              activeOpacity={0.9}
            >
              <View style={[styles.iconCircle, styles.iconCircleGrey]}>
                <SendIcon size={24} color="#003fb1" />
              </View>
              <Text style={[styles.bentoCardText, styles.bentoTextGrey]}>Send Messages</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Schedule */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{"Today's Schedule"}</Text>
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => Alert.alert('Schedule', 'Opening schedule calendar.')}
            >
              <Text style={styles.headerLink}>View Calendar</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#003fb1" style={{ marginVertical: 12 }} />
          ) : scheduleList.length === 0 ? (
            <View style={styles.classCard}>
              <Text style={{ color: '#737686', fontSize: 13 }}>No classes scheduled for today.</Text>
            </View>
          ) : (
            scheduleList.map((item, idx) => (
              <View key={item.id || idx} style={styles.classCard}>
                <View style={[styles.timeBox, !item.isLive && styles.timeBoxInactive]}>
                  <Text style={[styles.timeText, !item.isLive && styles.timeTextInactive]}>
                    {item.time}
                  </Text>
                  <Text style={[styles.ampmText, !item.isLive && styles.ampmTextInactive]}>
                    {item.ampm || 'AM'}
                  </Text>
                </View>
                <View style={styles.classInfo}>
                  <View style={styles.classTitleRow}>
                    <Text style={styles.classTitle}>{item.subject}</Text>
                    {item.isLive && (
                      <View style={styles.liveBadge}>
                        <Text style={styles.liveText}>LIVE NOW</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.classMeta}>{`${item.className} • ${item.room}`}</Text>
                </View>
                <ChevronRightIcon size={20} color="#c3c5d7" />
              </View>
            ))
          )}
        </View>

        {/* Announcements & Stats */}
        <View style={styles.sectionContainer}>
          {/* Announcements Card */}
          <View style={styles.announcementsCard}>
            <View style={styles.announcementsTitleRow}>
              <MegaphoneIcon size={20} color="#003fb1" />
              <Text style={styles.announcementsTitle}>Announcements</Text>
            </View>

            {loading ? (
              <ActivityIndicator size="small" color="#003fb1" style={{ marginVertical: 12 }} />
            ) : announcements.length === 0 ? (
              <Text style={{ color: '#737686', fontSize: 13, marginBottom: 12 }}>
                No active announcements.
              </Text>
            ) : (
              announcements.slice(0, 3).map((item, idx) => (
                <View key={item.id || idx} style={styles.announcementItem}>
                  <View
                    style={[
                      styles.announcementBorder,
                      idx % 2 === 0 ? styles.borderBlue : styles.borderGreen,
                    ]}
                  />
                  <View style={styles.announcementContent}>
                    <Text
                      style={[
                        styles.announcementHeading,
                        idx % 2 === 0 ? styles.textBlue : styles.textGreen,
                      ]}
                    >
                      {item.title}
                    </Text>
                    <Text style={styles.announcementText} numberOfLines={2}>
                      {item.content}
                    </Text>
                    <Text style={styles.announcementTime}>
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString()
                        : 'Recent'}
                    </Text>
                  </View>
                </View>
              ))
            )}

            <TouchableOpacity
              style={styles.allAnnouncementsBtn}
              activeOpacity={0.6}
              onPress={() => navigation.navigate('Announcements' as never)}
            >
              <Text style={styles.allAnnouncementsText}>All Announcements</Text>
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
  header: {
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
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  notificationBtn: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 28, 40, 0.4)',
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
    paddingBottom: 20,
  },
  drawerHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderColor: '#eeeff8',
    backgroundColor: '#f8f9ff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  drawerAvatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#003fb1',
  },
  drawerAvatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  drawerAdminName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#121c28',
  },
  drawerAdminRole: {
    fontSize: 12,
    color: '#737686',
    marginTop: 2,
  },
  drawerNav: {
    flex: 1,
    padding: 16,
  },
  drawerNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  drawerNavItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#434654',
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderColor: '#eeeff8',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  drawerLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 12,
  },
  drawerLogoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ba1a1a',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#121c28',
    marginBottom: 12,
  },
  headerLink: {
    fontSize: 12,
    color: '#003fb1',
    fontWeight: '600',
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  bentoCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#121c28',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  bentoCardPrimary: {
    backgroundColor: '#1a56db',
  },
  bentoCardSecondary: {
    backgroundColor: '#82f5c1',
  },
  bentoCardOrange: {
    backgroundColor: '#ffdcc3',
  },
  bentoCardGrey: {
    backgroundColor: '#dfe9fa',
  },
  iconCircleTranslucent: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  iconCircleGrey: {
    backgroundColor: 'rgba(0,63,177,0.1)',
  },
  bentoTextGreen: {
    color: '#005137',
  },
  bentoTextOrange: {
    color: '#6e3900',
  },
  bentoTextGrey: {
    color: '#434654',
  },
  bentoCardText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  timeBox: {
    width: 56,
    height: 56,
    backgroundColor: '#e5eeff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,63,177,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeBoxInactive: {
    backgroundColor: '#f8f9ff',
    borderColor: '#c3c5d7',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#003fb1',
  },
  timeTextInactive: {
    color: '#737686',
  },
  ampmText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#003fb1',
  },
  ampmTextInactive: {
    color: '#737686',
  },
  classInfo: {
    flex: 1,
    marginLeft: 12,
  },
  classTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121c28',
  },
  liveBadge: {
    backgroundColor: '#82f5c1',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  liveText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#005137',
  },
  classMeta: {
    fontSize: 12,
    color: '#737686',
    marginTop: 2,
  },
  announcementsCard: {
    backgroundColor: '#eef4ff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c3c5d7',
    padding: 16,
    marginBottom: 16,
  },
  announcementsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  announcementsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121c28',
    marginLeft: 8,
  },
  announcementItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  announcementBorder: {
    width: 4,
    borderRadius: 2,
    marginRight: 10,
  },
  borderBlue: {
    backgroundColor: '#003fb1',
  },
  borderGreen: {
    backgroundColor: '#006c4a',
  },
  announcementContent: {
    flex: 1,
  },
  announcementHeading: {
    fontSize: 12,
    fontWeight: '700',
  },
  textBlue: {
    color: '#003fb1',
  },
  textGreen: {
    color: '#006c4a',
  },
  announcementText: {
    fontSize: 12,
    color: '#434654',
    lineHeight: 18,
    marginTop: 2,
  },
  announcementTime: {
    fontSize: 9,
    color: '#737686',
    marginTop: 4,
  },
  allAnnouncementsBtn: {
    borderWidth: 1,
    borderColor: '#003fb1',
    borderRadius: 8,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  allAnnouncementsText: {
    fontSize: 12,
    color: '#003fb1',
    fontWeight: '600',
  },
  progressCard: {
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  progressBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    resizeMode: 'cover',
  },
  progressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  progressCardContent: {
    padding: 16,
    zIndex: 10,
  },
  progressLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
    marginBottom: 8,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#82f5c1',
    borderRadius: 3,
  },
  progressBarFill78: {
    width: '78%',
  },
  progressStatusText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
});

export default TeacherDashboard;
