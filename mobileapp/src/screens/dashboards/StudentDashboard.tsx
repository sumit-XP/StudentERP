import React, { useRef, useState } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DashboardStackParamList } from '../../navigation/features/DashboardNavigator';
import { useAuth } from '../../contexts/AuthContext';
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
      Alert.alert('Assignments', 'Navigating to Assignments Directory.');
    }
    closeDrawer();
  };

  const drawerItems: DrawerItem[] = [
    {
      icon: <DashboardIcon size={18} color="#ffffff" />,
      label: 'Dashboard',
      onPress: () => closeDrawer(),
    },
    {
      icon: <CalendarIcon size={18} color="#003fb1" />,
      label: 'Schedule',
      onPress: () => {
        closeDrawer();
        Alert.alert('Schedule', 'Opening schedule...');
      },
    },
    {
      icon: <SchoolIcon size={18} color="#003fb1" />,
      label: 'Grades',
      onPress: () => {
        closeDrawer();
        Alert.alert('Grades', 'Opening grades...');
      },
    },
    {
      icon: <AssignmentIcon size={18} color="#003fb1" />,
      label: 'Assignments',
      badge: '3',
      onPress: handleViewAssignments,
    },
    {
      icon: <FactCheckIcon size={18} color="#003fb1" />,
      label: 'Attendance',
      onPress: () => {
        closeDrawer();
        Alert.alert('Attendance', 'Opening attendance...');
      },
    },
    {
      icon: <ParentCircleIcon size={18} color="#003fb1" />,
      label: 'Parent - Pay Fees',
      badge: '!',
      onPress: handlePayNow,
    },
    {
      icon: <SendIcon size={18} color="#003fb1" />,
      label: 'Messages',
      onPress: () => {
        closeDrawer();
        Alert.alert('Messages', 'Opening messages...');
      },
    },
    {
      icon: <HelpCircleIcon size={18} color="#003fb1" />,
      label: 'Help & Support',
      onPress: () => {
        closeDrawer();
        Alert.alert('Help', 'Opening help center...');
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
        <View style={styles.headerProfile}>
          <TouchableOpacity style={styles.hamburgerBtn} onPress={openDrawer} activeOpacity={0.7}>
            <MenuIcon size={24} color="#003fb1" />
          </TouchableOpacity>
          <View style={styles.avatarWrapper}>
            <Image style={styles.avatarImg} source={{ uri: STUDENT_AVATAR }} />
          </View>
          <Text style={styles.headerText}>EduCore ERP</Text>
        </View>
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeGreeting}>Good morning 👋</Text>
          <Text style={styles.welcomeTitle}>Hello, {user?.name?.split(' ')[0] || 'Alex'}</Text>
          <Text style={styles.welcomeSubtitle}>Your academic journey is looking great today.</Text>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabelGreen}>Attendance</Text>
              <FactCheckIcon size={18} color="#006c4a" />
            </View>
            <Text style={styles.statVal}>94%</Text>
            <Text style={styles.statDesc}>Last 30 days</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabelBlue}>GPA</Text>
              <SchoolIcon size={18} color="#003fb1" />
            </View>
            <Text style={styles.statVal}>3.8</Text>
            <Text style={styles.statDesc}>Cumulative</Text>
          </View>
        </View>

        {/* Performance Card */}
        <View style={styles.performanceCard}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBarRow}>
              <Text style={styles.progressBarLabel}>Mathematics</Text>
              <Text style={styles.progressBarGrade}>A</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, styles.fillMath]} />
            </View>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBarRow}>
              <Text style={styles.progressBarLabel}>Physics</Text>
              <Text style={styles.progressBarGrade}>A-</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, styles.fillPhysics]} />
            </View>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBarRow}>
              <Text style={styles.progressBarLabel}>English Lit.</Text>
              <Text style={styles.progressBarGrade}>B+</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, styles.fillEnglish]} />
            </View>
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
            <View style={styles.homeworkRow}>
              <View style={styles.hwIconBox}>
                <CalculatorIcon size={20} color="#003fb1" />
              </View>
              <View style={styles.hwMeta}>
                <Text style={styles.hwTitle}>Trigonometry Quiz</Text>
                <Text style={styles.hwDue}>Due Tomorrow, 10:00 AM</Text>
              </View>
              <View style={styles.badgeRed}>
                <Text style={styles.badgeRedText}>High</Text>
              </View>
            </View>

            <View style={styles.homeworkRow}>
              <View style={styles.hwIconBox}>
                <FlaskIcon size={20} color="#003fb1" />
              </View>
              <View style={styles.hwMeta}>
                <Text style={styles.hwTitle}>Lab Report</Text>
                <Text style={styles.hwDue}>Due Friday, 3:00 PM</Text>
              </View>
              <View style={styles.badgeGrey}>
                <Text style={styles.badgeGreyText}>Normal</Text>
              </View>
            </View>

            <View style={styles.homeworkRow}>
              <View style={styles.hwIconBox}>
                <BookOpenPageIcon size={20} color="#003fb1" />
              </View>
              <View style={styles.hwMeta}>
                <Text style={styles.hwTitle}>Literature Essay</Text>
                <Text style={styles.hwDue}>Due Oct 15</Text>
              </View>
              <View style={styles.badgeGrey}>
                <Text style={styles.badgeGreyText}>Normal</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Latest Announcements */}
        <View style={styles.bentoSection}>
          <Text style={styles.sectionTitle}>Latest Announcements</Text>
          <View style={styles.announcementBannerCard}>
            <Image
              style={styles.announcementImg}
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvuJ2ZRA3OnR5lv4EF5L7o2tmc1OLaMDDOOhCEcmkq4llbP8GGzNQmzQr55BpWg4ALr-Kpg8Vf6OTq_sAV6WUv5mp7B33o9Q70iLngDBphkDsd-jrM9w_nyyRHXy8ma3OB3qALnndCxv7oSTqay188xqLhot0IsvSwgHTOlsUokwWm39IPO2yVuGOBvJgZDny6OhCndUPqx3fdtfzMzkWMZ9GOp3SSMPtbW4rYle3CbSTHQHfnlkbe',
              }}
            />
            <View style={styles.bannerOverlay} />
            <View style={styles.bannerContent}>
              <View style={styles.bannerBadge}>
                <Text style={styles.bannerBadgeText}>Campus Event</Text>
              </View>
              <Text style={styles.bannerTitle}>Annual Science Fair 2024</Text>
              <Text style={styles.bannerDesc} numberOfLines={2}>
                Registration is now open for all students interested in showcasing their STEM
                projects this year.
              </Text>
              <View style={styles.bannerTimeRow}>
                <ClockOutlineIcon size={12} color="rgba(255,255,255,0.7)" />
                <Text style={styles.bannerTimeText}>Posted 2 hours ago</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoAlertBox}>
            <InformationOutlineIcon size={18} color="#723b00" />
            <View style={styles.alertMeta}>
              <Text style={styles.alertTitle}>Delayed Start - Tuesday</Text>
              <Text style={styles.alertDesc}>
                Due to scheduled maintenance, classes will begin at 10:00 AM this Tuesday.
              </Text>
            </View>
          </View>
        </View>

        {/* Parent Portal Section */}
        <View style={styles.parentPortalContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.parentHeaderTitle}>
              <ParentCircleIcon size={22} color="#003fb1" />
              <Text style={styles.parentTitleText}>Parent Portal</Text>
            </View>
            <View style={styles.overdueBadge}>
              <AlertCircleIcon size={14} color="#ba1a1a" />
              <Text style={styles.overdueBadgeText}>Pending: $1,250.00</Text>
            </View>
          </View>
          <Text style={styles.parentSubtitleText}>
            Manage tuition fees and financial records securely.
          </Text>

          <View style={styles.feeDetailsCard}>
            <Text style={styles.feeCardSectionTitle}>Pending Fees</Text>
            <View style={styles.feeItemRow}>
              <View>
                <Text style={styles.feeItemTitle}>Tuition Fee - Quarter 3</Text>
                <Text style={styles.feeItemDue}>Due: Oct 15, 2024</Text>
              </View>
              <View style={styles.feeAmountBlock}>
                <Text style={styles.feeItemValRed}>$1,100.00</Text>
                <View style={styles.overdueBadgeMini}>
                  <Text style={styles.overdueBadgeMiniText}>Overdue</Text>
                </View>
              </View>
            </View>

            <View style={styles.feeItemRow}>
              <View>
                <Text style={styles.feeItemTitle}>Laboratory Charges</Text>
                <Text style={styles.feeItemDue}>Due: Nov 01, 2024</Text>
              </View>
              <Text style={styles.feeItemVal}>$150.00</Text>
            </View>

            <TouchableOpacity
              style={styles.portalPayBtn}
              onPress={handlePayNow}
              activeOpacity={0.8}
            >
              <CreditCardOutlineIcon size={18} color="#ffffff" />
              <Text style={styles.portalPayBtnText}>Pay Now</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.historyCard}>
            <Text style={styles.feeCardSectionTitle}>Payment History</Text>
            <View style={styles.historyItemRow}>
              <View>
                <Text style={styles.historyItemTitle}>#INV-2024-08</Text>
                <Text style={styles.historyItemDate}>Aug 12, 2024</Text>
              </View>
              <View style={styles.historyStatusBlock}>
                <Text style={styles.historyAmount}>$1,100.00</Text>
                <View style={styles.successBadge}>
                  <Text style={styles.successBadgeText}>Successful</Text>
                </View>
              </View>
            </View>

            <View style={styles.historyItemRow}>
              <View>
                <Text style={styles.historyItemTitle}>#INV-2024-05</Text>
                <Text style={styles.historyItemDate}>May 05, 2024</Text>
              </View>
              <View style={styles.historyStatusBlock}>
                <Text style={styles.historyAmount}>$1,100.00</Text>
                <View style={styles.successBadge}>
                  <Text style={styles.successBadgeText}>Successful</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Debit Card Graphic */}
          <View style={styles.debitCardGraphic}>
            <View style={styles.debitCardHeader}>
              <ContactlessPayIcon size={32} color="#ffffff" />
              <View style={styles.cardBrand}>
                <Text style={styles.brandTitle}>EduCore Pay</Text>
                <Text style={styles.brandSub}>Premium</Text>
              </View>
            </View>
            <View style={styles.debitCardFooter}>
              <Text style={styles.cardHolder}>{(user?.name || 'ALEX JOHNSON').toUpperCase()}</Text>
              <Text style={styles.cardNumber}>**** **** **** 4001</Text>
            </View>
          </View>
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
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#c3c5d7',
  },
  headerProfile: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hamburgerBtn: { padding: 4 },
  avatarWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#003fb1',
  },
  avatarImg: { width: '100%', height: '100%' },
  headerText: { fontSize: 16, fontWeight: '700', color: '#003fb1' },
  notifBtn: { padding: 8, borderRadius: 9999 },
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
