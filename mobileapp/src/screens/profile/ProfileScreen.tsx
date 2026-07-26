import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  SafeAreaView,
  Switch,
  Platform,
} from 'react-native';
import profileService from '../../services/profileService';
import { useAuth } from '../../contexts/AuthContext';
import {
  SearchIcon,
  CameraIcon,
  TuneIcon,
  LanguageIcon,
  DarkModeIcon,
  NotificationsActiveIcon,
  ChevronRightIcon,
  LockResetIcon,
  DevicesIcon,
  VerifiedUserIcon,
  DatabaseIcon,
  PaymentsIcon,
  AnalyticsIcon,
  HubIcon,
  LogoutIcon,
  AddUserIcon,
  ConfigIcon,
  BadgeIcon,
  MailIcon,
  CallIcon,
  LocationIcon,
  SchoolIcon,
  HistoryEduIcon,
  MenuBookIcon,
  SecurityIcon,
  PrivacyTipIcon,
  BellIcon,
  ProfileIcon,
} from '../../assets/svgs';

interface ProfileData {
  name: string;
  email: string;
  phone?: string;
  role: string;
}

const ProfileScreen: React.FC = () => {
  const { signOut, user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [language, setLanguage] = useState('English (US)');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    profileService
      .getProfile()
      .then((p) => {
        setProfile(p);
        setName(p.name ?? '');
        setPhone(p.phone ?? '');
      })
      .catch(() => {
        // Demo / offline mode: fall back to the user stored in AuthContext
        if (user) {
          const fallback: ProfileData = {
            id: user.id ?? 'demo-id',
            name: user.name ?? '',
            email: user.email ?? '',
            phone: user.phone ?? '',
            role: user.role ?? 'student',
          };
          setProfile(fallback);
          setName(fallback.name);
          setPhone(fallback.phone ?? '');
        }
      });
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await profileService.updateProfile({ name, phone });
      Alert.alert('Success', 'Profile updated');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Error', 'Fill in both password fields');
      return;
    }
    setChangingPw(true);
    try {
      await profileService.changePassword({ currentPassword, newPassword });
      Alert.alert('Success', 'Password changed');
      setCurrentPassword('');
      setNewPassword('');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    } finally {
      setChangingPw(false);
    }
  };

  const handleSelectLanguage = () => {
    Alert.alert('System Language', 'Select system language:', [
      { text: 'English (US)', onPress: () => setLanguage('English (US)') },
      { text: 'Spanish', onPress: () => setLanguage('Spanish') },
      { text: 'French', onPress: () => setLanguage('French') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  if (!profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#003fb1" />
      </View>
    );
  }

  const isTeacher = user?.role === 'teacher';
  const isMockDefault = profile.name === 'Mock User';
  const displayName = isMockDefault
    ? 'Teacher Anderson'
    : profile.name || user?.name || 'Teacher Anderson';
  const displayEmail = isMockDefault
    ? 'j.anderson@university.edu'
    : profile.email || user?.email || 'j.anderson@university.edu';
  const displayPhone = isMockDefault
    ? '+1 (555) 234-8821'
    : profile.phone || user?.phone || '+1 (555) 234-8821';

  if (isTeacher) {
    // TEACHER PROFILE VIEW
    return (
      <SafeAreaView style={styles.container}>
        {/* TopAppBar */}
        <View style={styles.headerBar}>
          <View style={styles.headerLeft}>
            <View style={styles.teacherHeaderAvatarWrapper}>
              <Image
                style={styles.teacherHeaderAvatarImg}
                source={{
                  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDHacA_W5gzoOnEMvtRTLVxbmoXO47JceV9w4SLb9fZmlLBtBB16k7_z9UEM8UBCUMtIpl2nw4aJLcViAd0xxbv-uWk1NlYWgMq84LWx7GzrYXUyV6OBi8YlXV5BXHr7luD4Tja4y2ItEE2op7jmGY0SdOGKcJT2uKGJ3-PzHRmQvONS1_XjkTyDMiAONRsk3R6cslo3_rWoEi7woyzFknHvSsdT7KA8J5S_eXUnTZX21ivVWrbJKbq',
                }}
              />
            </View>
            <Text style={styles.headerText}>Teacher Portal</Text>
          </View>
          <TouchableOpacity
            style={styles.searchBtn}
            activeOpacity={0.6}
            onPress={() => Alert.alert('Notifications', 'No new notifications.')}
          >
            <BellIcon size={22} color="#003fb1" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header Section */}
          <View style={styles.teacherHeroSection}>
            <View style={styles.absoluteCircleDecorator} />
            <View style={styles.teacherHeroLeft}>
              <View style={styles.teacherAvatarContainer}>
                <Image
                  style={styles.teacherAvatarImg}
                  source={{
                    uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgU5xKjGJXrQKFQpS1-d0z-X2aXINQADqRmMi24mOucg8BD6tboIOZhFkd0K16vZCp87etyRXpP3xKn_aiK6W6SvZBf7q-cazKM3xFbv_V_wAKVLQXhSlqzOuqAHm3TG5e-1kqo-OKQRRrPUe62eW7oJFGrlFwLMt6WOzAImbfZX-az7WE6UOsAw6INMSq0MoaM9runa8T5VEDVpHgTq4NQrw1yH_zQSzEdRhQDngFYS23p9JArr5l',
                  }}
                />
                <TouchableOpacity
                  style={styles.teacherCameraBtn}
                  activeOpacity={0.7}
                  onPress={() => Alert.alert('Camera', 'Upload new profile photo.')}
                >
                  <CameraIcon size={14} color="#ffffff" />
                </TouchableOpacity>
              </View>
              <View style={styles.teacherHeroMeta}>
                <Text style={styles.teacherHeroName}>{displayName}</Text>
                <Text style={styles.teacherHeroDept}>Department of Science</Text>
                <View style={styles.teacherBadgeRow}>
                  <BadgeIcon size={14} color="#005137" />
                  <Text style={styles.teacherBadgeText}>ID: T-8821</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.teacherStatusBtn}
              activeOpacity={0.7}
              onPress={() => Alert.alert('Status Update', 'Update teacher status.')}
            >
              <Text style={styles.teacherStatusBtnText}>Update Status</Text>
            </TouchableOpacity>
          </View>

          {/* Grid Layout Cards */}
          <View style={styles.teacherContentContainer}>
            {/* Personal Information */}
            <View style={styles.glassCard}>
              <View style={styles.teacherCardHeaderRow}>
                <View style={styles.teacherCardHeaderLeft}>
                  <ProfileIcon size={20} color="#003fb1" />
                  <Text style={styles.cardTitle}>Personal Information</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={() => Alert.alert('Edit Information', 'Edit personal contact details.')}
                >
                  <Text style={styles.teacherEditLinkText}>Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.teacherInfoList}>
                <View style={styles.teacherInfoItem}>
                  <View style={styles.teacherInfoIconContainer}>
                    <MailIcon size={18} color="#434654" />
                  </View>
                  <View>
                    <Text style={styles.teacherInfoLabel}>Email Address</Text>
                    <Text style={styles.teacherInfoValue}>{displayEmail}</Text>
                  </View>
                </View>

                <View style={styles.teacherInfoItem}>
                  <View style={styles.teacherInfoIconContainer}>
                    <CallIcon size={18} color="#434654" />
                  </View>
                  <View>
                    <Text style={styles.teacherInfoLabel}>Phone Number</Text>
                    <Text style={styles.teacherInfoValue}>{displayPhone}</Text>
                  </View>
                </View>

                <View style={styles.teacherInfoItem}>
                  <View style={styles.teacherInfoIconContainer}>
                    <LocationIcon size={18} color="#434654" />
                  </View>
                  <View style={styles.teacherInfoItemRight}>
                    <Text style={styles.teacherInfoLabel}>Office Address</Text>
                    <Text style={styles.teacherInfoValue} numberOfLines={2}>
                      Science Building A, Room 402, North Campus
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Quick Settings */}
            <View style={styles.glassCard}>
              <View style={styles.teacherCardHeaderRow}>
                <View style={styles.teacherCardHeaderLeft}>
                  <TuneIcon size={20} color="#003fb1" />
                  <Text style={styles.cardTitle}>Quick Settings</Text>
                </View>
              </View>

              <View style={styles.teacherSettingsList}>
                <TouchableOpacity
                  style={styles.teacherSettingRow}
                  activeOpacity={0.7}
                  onPress={() => Alert.alert('Settings', 'Configure notifications preferences.')}
                >
                  <View style={styles.teacherSettingLeft}>
                    <NotificationsActiveIcon size={18} color="#434654" />
                    <Text style={styles.teacherSettingText}>Notifications</Text>
                  </View>
                  <ChevronRightIcon size={18} color="#737686" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.teacherSettingRow}
                  activeOpacity={0.7}
                  onPress={() => Alert.alert('Settings', 'Configure security & credentials.')}
                >
                  <View style={styles.teacherSettingLeft}>
                    <SecurityIcon size={18} color="#434654" />
                    <Text style={styles.teacherSettingText}>Security</Text>
                  </View>
                  <ChevronRightIcon size={18} color="#737686" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.teacherSettingRow}
                  activeOpacity={0.7}
                  onPress={() => Alert.alert('Settings', 'Configure privacy parameters.')}
                >
                  <View style={styles.teacherSettingLeft}>
                    <PrivacyTipIcon size={18} color="#434654" />
                    <Text style={styles.teacherSettingText}>Privacy</Text>
                  </View>
                  <ChevronRightIcon size={18} color="#737686" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.teacherSettingRow, styles.noBorder]}
                  activeOpacity={0.7}
                  onPress={handleSelectLanguage}
                >
                  <View style={styles.teacherSettingLeft}>
                    <LanguageIcon size={18} color="#434654" />
                    <Text style={styles.teacherSettingText}>Language</Text>
                  </View>
                  <View style={styles.teacherLanguageRight}>
                    <Text style={styles.teacherLanguageText}>{language}</Text>
                    <ChevronRightIcon size={18} color="#737686" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Academic Qualifications */}
            <View style={styles.glassCard}>
              <View style={styles.teacherCardHeaderRow}>
                <View style={styles.teacherCardHeaderLeft}>
                  <SchoolIcon size={20} color="#003fb1" />
                  <Text style={styles.cardTitle}>Academic Qualifications</Text>
                </View>
              </View>

              <View style={styles.qualificationsList}>
                <View style={styles.qualificationCard}>
                  <View style={styles.qualificationIconContainer}>
                    <HistoryEduIcon size={22} color="#003fb1" />
                  </View>
                  <View>
                    <Text style={styles.qualificationTitle}>Ph.D. in Theoretical Physics</Text>
                    <Text style={styles.qualificationUni}>Oxford University</Text>
                    <Text style={styles.qualificationConferred}>Conferred 2012</Text>
                  </View>
                </View>

                <View style={styles.qualificationCard}>
                  <View style={styles.qualificationIconContainer}>
                    <MenuBookIcon size={22} color="#003fb1" />
                  </View>
                  <View>
                    <Text style={styles.qualificationTitle}>M.Sc. in Applied Sciences</Text>
                    <Text style={styles.qualificationUni}>Stanford University</Text>
                    <Text style={styles.qualificationConferred}>Conferred 2008</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Logout Action */}
            <View style={styles.teacherLogoutContainer}>
              <TouchableOpacity
                style={styles.teacherLogoutBtn}
                activeOpacity={0.7}
                onPress={() => signOut()}
              >
                <LogoutIcon size={18} color="#ba1a1a" />
                <Text style={styles.teacherLogoutBtnText}>Logout from Portal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Floating Action Button (Edit Profile - Photo) */}
        <TouchableOpacity
          style={styles.teacherFab}
          activeOpacity={0.8}
          onPress={() => Alert.alert('Add Photo', 'Access camera to add profile photo.')}
        >
          <CameraIcon size={22} color="#ffffff" />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // STUDENT PROFILE VIEW
  if (user?.role === 'student') {
    const studentName = isMockDefault
      ? 'Alex Johnson'
      : profile.name || user?.name || 'Alex Johnson';
    const studentEmail = isMockDefault
      ? 'alex.j@educore.edu'
      : profile.email || user?.email || 'alex.j@educore.edu';
    const studentPhone = isMockDefault
      ? '+1 (555) 012-3456'
      : profile.phone || user?.phone || '+1 (555) 012-3456';

    return (
      <SafeAreaView style={styles.container}>
        {/* Top Bar */}
        <View style={styles.headerBar}>
          <View style={styles.headerLeft}>
            <View style={styles.studentHeaderAvatar}>
              <Image
                style={styles.studentHeaderAvatarImg}
                source={{
                  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZqQVc6a3-RURX_CrQXP1JUcfY0EEGvDvv0TbhvTYU_eV_2u0MES174mwf1t-KNoPVa9bp7XlY70ytNbKhxXGJE0yXSZpwS0_HzagjETCnfUM7zZXWkZY5VqwyWMb5AA4MvzbuJRTUlSFBCrd4MToBNT2oQ4XrLxsZTQJpPIKYftKKavyRnLFYYf1DsCaGmYHM4Kxjg2lq0ES9f9ANqHwCGj_Eyb3d36XQgnYQF7Cdkc0_oVg16r0G',
                }}
              />
            </View>
            <Text style={styles.headerText}>EduCore ERP</Text>
          </View>
          <TouchableOpacity
            style={styles.searchBtn}
            activeOpacity={0.6}
            onPress={() => Alert.alert('Notifications', 'No new notifications.')}
          >
            <BellIcon size={22} color="#003fb1" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={styles.studentHeroSection}>
            <View style={styles.studentHeroBg} />
            <View style={styles.studentAvatarContainer}>
              <Image
                style={styles.studentAvatarImg}
                source={{
                  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZqQVc6a3-RURX_CrQXP1JUcfY0EEGvDvv0TbhvTYU_eV_2u0MES174mwf1t-KNoPVa9bp7XlY70ytNbKhxXGJE0yXSZpwS0_HzagjETCnfUM7zZXWkZY5VqwyWMb5AA4MvzbuJRTUlSFBCrd4MToBNT2oQ4XrLxsZTQJpPIKYftKKavyRnLFYYf1DsCaGmYHM4Kxjg2lq0ES9f9ANqHwCGj_Eyb3d36XQgnYQF7Cdkc0_oVg16r0G',
                }}
              />
              <TouchableOpacity
                style={styles.studentCameraBtn}
                activeOpacity={0.7}
                onPress={() => Alert.alert('Camera', 'Upload new profile photo.')}
              >
                <CameraIcon size={14} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.studentHeroName}>{studentName}</Text>
            <Text style={styles.studentHeroClass}>Grade 11 — Section A</Text>
            <View style={styles.studentBadgeRow}>
              <View style={styles.studentIdBadge}>
                <BadgeIcon size={12} color="#003fb1" />
                <Text style={styles.studentIdBadgeText}>ID: STU-4291</Text>
              </View>
              <View style={styles.studentActiveBadge}>
                <Text style={styles.studentActiveBadgeText}>Active</Text>
              </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.studentStatsRow}>
              <View style={styles.studentStat}>
                <Text style={styles.studentStatVal}>94%</Text>
                <Text style={styles.studentStatLabel}>Attendance</Text>
              </View>
              <View style={styles.studentStatDivider} />
              <View style={styles.studentStat}>
                <Text style={styles.studentStatVal}>3.8</Text>
                <Text style={styles.studentStatLabel}>GPA</Text>
              </View>
              <View style={styles.studentStatDivider} />
              <View style={styles.studentStat}>
                <Text style={styles.studentStatVal}>5</Text>
                <Text style={styles.studentStatLabel}>Subjects</Text>
              </View>
            </View>
          </View>

          <View style={styles.teacherContentContainer}>
            {/* Personal Information */}
            <View style={styles.glassCard}>
              <View style={styles.teacherCardHeaderRow}>
                <View style={styles.teacherCardHeaderLeft}>
                  <ProfileIcon size={20} color="#003fb1" />
                  <Text style={styles.cardTitle}>Personal Information</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={() => Alert.alert('Edit', 'Edit personal contact details.')}
                >
                  <Text style={styles.teacherEditLinkText}>Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.teacherInfoList}>
                <View style={styles.teacherInfoItem}>
                  <View style={styles.teacherInfoIconContainer}>
                    <MailIcon size={18} color="#434654" />
                  </View>
                  <View>
                    <Text style={styles.teacherInfoLabel}>Email Address</Text>
                    <Text style={styles.teacherInfoValue}>{studentEmail}</Text>
                  </View>
                </View>

                <View style={styles.teacherInfoItem}>
                  <View style={styles.teacherInfoIconContainer}>
                    <CallIcon size={18} color="#434654" />
                  </View>
                  <View>
                    <Text style={styles.teacherInfoLabel}>Phone Number</Text>
                    <Text style={styles.teacherInfoValue}>{studentPhone}</Text>
                  </View>
                </View>

                <View style={styles.teacherInfoItem}>
                  <View style={styles.teacherInfoIconContainer}>
                    <LocationIcon size={18} color="#434654" />
                  </View>
                  <View style={styles.teacherInfoItemRight}>
                    <Text style={styles.teacherInfoLabel}>Address</Text>
                    <Text style={styles.teacherInfoValue} numberOfLines={2}>
                      12 Maple Street, Springfield, IL 62701
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Academic Info */}
            <View style={styles.glassCard}>
              <View style={styles.teacherCardHeaderRow}>
                <View style={styles.teacherCardHeaderLeft}>
                  <SchoolIcon size={20} color="#003fb1" />
                  <Text style={styles.cardTitle}>Academic Information</Text>
                </View>
              </View>

              <View style={styles.studentAcademicGrid}>
                {[
                  { label: 'Class', value: 'Grade 11-A' },
                  { label: 'Roll No.', value: '#042' },
                  { label: 'Section', value: 'Science' },
                  { label: 'Year', value: '2024–25' },
                ].map((item, idx) => (
                  <View key={idx} style={styles.studentAcademicCell}>
                    <Text style={styles.studentAcademicLabel}>{item.label}</Text>
                    <Text style={styles.studentAcademicValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Quick Settings */}
            <View style={styles.glassCard}>
              <View style={styles.teacherCardHeaderRow}>
                <View style={styles.teacherCardHeaderLeft}>
                  <TuneIcon size={20} color="#003fb1" />
                  <Text style={styles.cardTitle}>Quick Settings</Text>
                </View>
              </View>

              <View style={styles.teacherSettingsList}>
                <TouchableOpacity
                  style={styles.teacherSettingRow}
                  activeOpacity={0.7}
                  onPress={() => Alert.alert('Settings', 'Configure notifications.')}
                >
                  <View style={styles.teacherSettingLeft}>
                    <NotificationsActiveIcon size={18} color="#434654" />
                    <Text style={styles.teacherSettingText}>Notifications</Text>
                  </View>
                  <ChevronRightIcon size={18} color="#737686" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.teacherSettingRow}
                  activeOpacity={0.7}
                  onPress={() => Alert.alert('Settings', 'Configure privacy.')}
                >
                  <View style={styles.teacherSettingLeft}>
                    <PrivacyTipIcon size={18} color="#434654" />
                    <Text style={styles.teacherSettingText}>Privacy</Text>
                  </View>
                  <ChevronRightIcon size={18} color="#737686" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.teacherSettingRow, styles.noBorder]}
                  activeOpacity={0.7}
                  onPress={handleSelectLanguage}
                >
                  <View style={styles.teacherSettingLeft}>
                    <LanguageIcon size={18} color="#434654" />
                    <Text style={styles.teacherSettingText}>Language</Text>
                  </View>
                  <View style={styles.teacherLanguageRight}>
                    <Text style={styles.teacherLanguageText}>{language}</Text>
                    <ChevronRightIcon size={18} color="#737686" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Logout */}
            <View style={styles.teacherLogoutContainer}>
              <TouchableOpacity
                style={styles.teacherLogoutBtn}
                activeOpacity={0.7}
                onPress={() => signOut()}
              >
                <LogoutIcon size={18} color="#ba1a1a" />
                <Text style={styles.teacherLogoutBtnText}>Sign Out of Portal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ADMIN PROFILE VIEW (Original implementation)
  return (
    <SafeAreaView style={styles.container}>
      {/* TopAppBar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <View style={styles.logoWrapper}>
            <Image
              style={styles.logoImg}
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxNB1RTtklyPHptE1430-nGvOalQQe_ajYZgHym6_0EuOh-f0IJSsCbwCFTOsZheYiLIFU44lsaYXcVWbt2rqV1t-YexPt162bXNISilhXu_DcLQG_a9wryZraQHIyRXvJI_AYEWrdZpyRu-iIXonrovfMHf-bs4WQoRfPKyF4l32DadHajJ2io5Vhh-XJ_5IaRHMrfUcApkUKhgUjWPCdxpf37nyusChDbh4sB87vvL15carcHiGC',
              }}
            />
          </View>
          <Text style={styles.headerText}>EduERP Admin</Text>
        </View>
        <TouchableOpacity
          style={styles.searchBtn}
          activeOpacity={0.6}
          onPress={() => Alert.alert('Search', 'System search triggered.')}
        >
          <SearchIcon size={22} color="#737686" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Profile Header */}
        <View style={styles.heroSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarImgContainer}>
              <Image
                style={styles.avatarImg}
                source={{
                  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLa61XAtdW_DslsZvSPbhfBM5C2WZDespwVUYHmfYcfoIHwop1QdwOShY9vPuAwZiZ-0yDo9OLVJTAIJ6OwL8Hoz-ciSgl8KKNbWdsYGi_p0ZeGXB59tNcR8BrooIgK9ONb9C1kmSW6uxFCK4Nq0SaaMjenZn9SmwwrRgD2FmCPSl94uTZAkHSvv-yOrTattwjaNT8-XuuMd8TLxoPcYp6LKJo1qbsjJ1uR1bp20sXDWcmf8bbghpV',
                }}
              />
            </View>
            <TouchableOpacity
              style={styles.cameraBtn}
              activeOpacity={0.7}
              onPress={() => Alert.alert('Camera', 'Upload new profile photo.')}
            >
              <CameraIcon size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{profile.name || 'Sarah Jenkins'}</Text>
          <Text style={styles.userRole}>
            {profile.role === 'admin'
              ? 'System Administrator'
              : profile.role
              ? profile.role.toUpperCase()
              : 'USER'}
          </Text>
          <View style={styles.badgesRow}>
            <Text style={styles.staffIdBadge}>Staff ID: #AD-001</Text>
            <Text style={styles.activeBadge}>Active Now</Text>
          </View>
        </View>

        {/* Content list */}
        <View style={styles.contentContainer}>
          {/* General Settings */}
          <View style={styles.glassCard}>
            <View style={styles.cardHeader}>
              <TuneIcon size={22} color="#003fb1" />
              <Text style={styles.cardTitle}>General Settings</Text>
            </View>

            <TouchableOpacity
              style={styles.rowItem}
              activeOpacity={0.7}
              onPress={handleSelectLanguage}
            >
              <View style={styles.rowLeft}>
                <LanguageIcon size={20} color="#737686" />
                <Text style={styles.rowText}>System Language</Text>
              </View>
              <Text style={styles.rowRightText}>{language}</Text>
            </TouchableOpacity>

            <View style={styles.rowItem}>
              <View style={styles.rowLeft}>
                <DarkModeIcon size={20} color="#737686" />
                <Text style={styles.rowText}>Interface Theme</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                trackColor={{ false: '#dfe9fa', true: '#bbe0ff' }}
                thumbColor={isDarkMode ? '#003fb1' : '#737686'}
              />
            </View>

            <TouchableOpacity
              style={[styles.rowItem, styles.noBorder]}
              activeOpacity={0.7}
              onPress={() => Alert.alert('Notifications', 'Access notifications system.')}
            >
              <View style={styles.rowLeft}>
                <NotificationsActiveIcon size={20} color="#737686" />
                <Text style={styles.rowText}>Notifications</Text>
              </View>
              <ChevronRightIcon size={20} color="#003fb1" />
            </TouchableOpacity>
          </View>

          {/* Edit Profile Info */}
          <View style={styles.glassCard}>
            <View style={styles.cardHeader}>
              <TuneIcon size={22} color="#003fb1" />
              <Text style={styles.cardTitle}>Edit Profile Information</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#737686"
            />
            <TextInput
              style={styles.input}
              placeholder="Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor="#737686"
            />
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={saveProfile}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Save Profile Changes</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Security Settings */}
          <View style={styles.glassCard}>
            <View style={styles.cardHeader}>
              <VerifiedUserIcon size={22} color="#003fb1" />
              <Text style={styles.cardTitle}>Security Settings</Text>
            </View>
            <Text style={styles.descriptionText}>
              Maintain your account security by regularly updating your password and monitoring
              active sessions.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              placeholderTextColor="#737686"
            />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholderTextColor="#737686"
            />

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={changePassword}
              disabled={changingPw}
              activeOpacity={0.8}
            >
              {changingPw ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <LockResetIcon size={18} color="#ffffff" />
                  <Text style={styles.primaryBtnText}>Update Password</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.outlineBtn}
              activeOpacity={0.7}
              onPress={() => Alert.alert('Active Sessions', 'Showing 2 active devices.')}
            >
              <DevicesIcon size={18} color="#737686" />
              <Text style={styles.outlineBtnText}>Active Sessions</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.logoutLink}
              activeOpacity={0.6}
              onPress={() => signOut()}
            >
              <LogoutIcon size={18} color="#ba1a1a" />
              <Text style={styles.logoutLinkText}>Sign Out All Devices</Text>
            </TouchableOpacity>
          </View>

          {/* System Permissions */}
          <View style={styles.glassCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.rowLeft}>
                <VerifiedUserIcon size={22} color="#003fb1" />
                <Text style={styles.cardTitle}>System Permissions</Text>
              </View>
              <View style={styles.accessBadge}>
                <View style={styles.accessIndicator} />
                <Text style={styles.accessText}>Full Access</Text>
              </View>
            </View>

            <View style={styles.gridContainer}>
              <View style={styles.gridRow}>
                <View style={styles.gridItem}>
                  <View style={styles.gridIconBg}>
                    <AddUserIcon size={20} color="#003fb1" />
                  </View>
                  <Text style={styles.gridItemTitle}>User Management</Text>
                  <Text style={styles.gridItemDesc}>Grant, revoke, and manage roles.</Text>
                </View>
                <View style={styles.gridItem}>
                  <View style={styles.gridIconBg}>
                    <DatabaseIcon size={20} color="#003fb1" />
                  </View>
                  <Text style={styles.gridItemTitle}>Database Control</Text>
                  <Text style={styles.gridItemDesc}>Access backups and exports.</Text>
                </View>
              </View>

              <View style={styles.gridRow}>
                <View style={styles.gridItem}>
                  <View style={styles.gridIconBg}>
                    <PaymentsIcon size={20} color="#003fb1" />
                  </View>
                  <Text style={styles.gridItemTitle}>Financial Oversight</Text>
                  <Text style={styles.gridItemDesc}>Authorize fee structures.</Text>
                </View>
                <View style={styles.gridItem}>
                  <View style={styles.gridIconBg}>
                    <ConfigIcon size={20} color="#003fb1" />
                  </View>
                  <Text style={styles.gridItemTitle}>Global Config</Text>
                  <Text style={styles.gridItemDesc}>Modify academic parameters.</Text>
                </View>
              </View>

              <View style={styles.gridRow}>
                <View style={styles.gridItem}>
                  <View style={styles.gridIconBg}>
                    <AnalyticsIcon size={20} color="#003fb1" />
                  </View>
                  <Text style={styles.gridItemTitle}>Audit Logs</Text>
                  <Text style={styles.gridItemDesc}>Review activity and security logs.</Text>
                </View>
                <View style={styles.gridItem}>
                  <View style={styles.gridIconBg}>
                    <HubIcon size={20} color="#003fb1" />
                  </View>
                  <Text style={styles.gridItemTitle}>API Integrations</Text>
                  <Text style={styles.gridItemDesc}>Manage external connections.</Text>
                </View>
              </View>
            </View>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#003fb1',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoImg: {
    width: 32,
    height: 32,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#003fb1',
  },
  searchBtn: {
    padding: 8,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    backgroundColor: '#eef4ff',
    paddingVertical: 32,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#dfe9fa',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImgContainer: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: '#ffffff',
    overflow: 'hidden',
    backgroundColor: '#bbe0ff',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#003fb1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#121c28',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#737686',
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  staffIdBadge: {
    backgroundColor: 'rgba(0, 63, 177, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 63, 177, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    fontSize: 11,
    fontWeight: '600',
    color: '#003fb1',
  },
  activeBadge: {
    backgroundColor: '#82f5c1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    fontSize: 11,
    fontWeight: '600',
    color: '#005137',
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.5)',
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#121c28',
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeff8',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowText: {
    fontSize: 14,
    color: '#121c28',
    fontWeight: '500',
  },
  rowRightText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#003fb1',
  },
  descriptionText: {
    fontSize: 13,
    color: '#737686',
    lineHeight: 18,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 13,
    color: '#121c28',
  },
  primaryBtn: {
    backgroundColor: '#003fb1',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: '#737686',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  outlineBtnText: {
    color: '#737686',
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#dfe9fa',
    marginVertical: 12,
  },
  logoutLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  logoutLinkText: {
    color: '#ba1a1a',
    fontSize: 13,
    fontWeight: '600',
  },
  accessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#82f5c1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
  },
  accessIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#006c4a',
  },
  accessText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#005137',
  },
  gridContainer: {
    marginTop: 8,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridItem: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 12,
    padding: 12,
  },
  gridIconBg: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 63, 177, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  gridItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#121c28',
    marginBottom: 4,
  },
  gridItemDesc: {
    fontSize: 10,
    color: '#737686',
    lineHeight: 14,
  },

  /* TEACHER PORTAL SPECIFIC STYLES */
  teacherHeaderAvatarWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 10,
    backgroundColor: '#dfe9fa',
  },
  teacherHeaderAvatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  teacherHeroSection: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.5)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    position: 'relative',
    overflow: 'hidden',
    gap: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  absoluteCircleDecorator: {
    position: 'absolute',
    top: -64,
    right: -64,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(0, 63, 177, 0.04)',
  },
  teacherHeroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  teacherAvatarContainer: {
    position: 'relative',
  },
  teacherAvatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  teacherCameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#003fb1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  teacherHeroMeta: {
    flex: 1,
  },
  teacherHeroName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#121c28',
  },
  teacherHeroDept: {
    fontSize: 14,
    color: '#737686',
    marginTop: 2,
  },
  teacherBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#82f5c1',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  teacherBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#005137',
  },
  teacherStatusBtn: {
    backgroundColor: '#003fb1',
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  teacherStatusBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  teacherContentContainer: {
    padding: 16,
    gap: 16,
  },
  teacherCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeff8',
    paddingBottom: 12,
    marginBottom: 14,
  },
  teacherCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teacherEditLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#003fb1',
  },
  teacherInfoList: {
    gap: 16,
  },
  teacherInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  teacherInfoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#eef4ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teacherInfoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#737686',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  teacherInfoValue: {
    fontSize: 13,
    color: '#121c28',
    marginTop: 2,
    fontWeight: '500',
  },
  teacherInfoItemRight: {
    flex: 1,
  },
  teacherSettingsList: {
    gap: 2,
  },
  teacherSettingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeff8',
  },
  teacherSettingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  teacherSettingText: {
    fontSize: 14,
    color: '#121c28',
    fontWeight: '500',
  },
  teacherLanguageRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  teacherLanguageText: {
    fontSize: 13,
    color: '#737686',
  },
  qualificationsList: {
    gap: 12,
  },
  qualificationCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(115, 118, 134, 0.15)',
    backgroundColor: '#f8f9ff',
    alignItems: 'center',
    gap: 12,
  },
  qualificationIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 63, 177, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qualificationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#003fb1',
  },
  qualificationUni: {
    fontSize: 12,
    color: '#121c28',
    marginTop: 2,
  },
  qualificationConferred: {
    fontSize: 11,
    color: '#737686',
    fontStyle: 'italic',
    marginTop: 1,
  },
  teacherLogoutContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  teacherLogoutBtn: {
    flexDirection: 'row',
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 8,
    backgroundColor: '#ffffff',
  },
  teacherLogoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ba1a1a',
  },
  teacherFab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#003fb1',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },

  // ===== STUDENT PROFILE STYLES =====
  studentHeaderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#003fb1',
  },
  studentHeaderAvatarImg: {
    width: '100%',
    height: '100%',
  },
  studentHeroSection: {
    backgroundColor: '#003fb1',
    borderRadius: 24,
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  studentHeroBg: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  studentAvatarContainer: {
    position: 'relative',
    width: 90,
    height: 90,
    marginBottom: 14,
  },
  studentAvatarImg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  studentCameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#006c4a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#003fb1',
  },
  studentHeroName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  studentHeroClass: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    textAlign: 'center',
  },
  studentBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  studentIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  studentIdBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  studentActiveBadge: {
    backgroundColor: '#82f5c1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  studentActiveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#005137',
  },
  studentStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    width: '100%',
  },
  studentStat: {
    flex: 1,
    alignItems: 'center',
  },
  studentStatVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  studentStatLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 3,
  },
  studentStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 4,
  },
  studentAcademicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  studentAcademicCell: {
    width: '47%',
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e5eeff',
  },
  studentAcademicLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#737686',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  studentAcademicValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#003fb1',
  },
});

export default ProfileScreen;
