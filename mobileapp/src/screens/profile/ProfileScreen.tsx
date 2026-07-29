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
  SafeAreaView,
  Switch,
  Platform,
  RefreshControl,
} from 'react-native';
import profileService from '../../services/profileService';
import { useAuth } from '../../contexts/AuthContext';
import {
  MailIcon,
  CallIcon,
  BadgeIcon,
  TuneIcon,
  LanguageIcon,
  DarkModeIcon,
  LockResetIcon,
  LogoutIcon,
  ProfileIcon,
  CheckCircleIcon,
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
  const [refreshing, setRefreshing] = useState(false);
  const [language, setLanguage] = useState('English (US)');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const fetchProfileData = async () => {
    try {
      const p = await profileService.getProfile();
      if (p) {
        setProfile({
          name: p.name || user?.name || '',
          email: p.email || user?.email || '',
          phone: p.phone || user?.phone || '',
          role: p.role || user?.role || 'user',
        });
        setName(p.name || user?.name || '');
        setPhone(p.phone || user?.phone || '');
      }
    } catch {
      // Fallback to AuthContext user
      if (user) {
        setProfile({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          role: user.role || 'user',
        });
        setName(user.name || '');
        setPhone(user.phone || '');
      }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileData();
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter your name.');
      return;
    }
    setSaving(true);
    try {
      await profileService.updateProfile({ name, phone });
      setProfile((prev) => (prev ? { ...prev, name, phone } : null));
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Validation Error', 'Please enter both current and new passwords.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Validation Error', 'New password must be at least 6 characters long.');
      return;
    }
    setChangingPw(true);
    try {
      await profileService.changePassword({ currentPassword, newPassword });
      Alert.alert('Success', 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to change password.');
    } finally {
      setChangingPw(false);
    }
  };

  const handleSelectLanguage = () => {
    Alert.alert('System Language', 'Select preferred language:', [
      { text: 'English (US)', onPress: () => setLanguage('English (US)') },
      { text: 'Spanish', onPress: () => setLanguage('Spanish') },
      { text: 'French', onPress: () => setLanguage('French') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const getInitials = (fullName?: string) => {
    if (!fullName) return 'U';
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const roleLabel = (profile?.role || user?.role || 'User').toUpperCase();

  if (!profile && !user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1565c0" />
      </View>
    );
  }

  const activeName = profile?.name || user?.name || 'User';
  const activeEmail = profile?.email || user?.email || 'N/A';
  const activePhone = profile?.phone || user?.phone || 'Not provided';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Account & Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1565c0']} />
        }
      >
        {/* Profile Card Header */}
        <View style={styles.heroSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{getInitials(activeName)}</Text>
          </View>
          <Text style={styles.userName}>{activeName}</Text>
          <Text style={styles.userEmail}>{activeEmail}</Text>

          <View style={styles.roleBadgeContainer}>
            <BadgeIcon size={14} color="#1565c0" />
            <Text style={styles.roleBadgeText}>{roleLabel}</Text>
          </View>
        </View>

        {/* Section 1: Account Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <ProfileIcon size={20} color="#1565c0" />
            <Text style={styles.cardTitle}>Account Details</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrapper}>
              <MailIcon size={18} color="#737686" />
            </View>
            <View style={styles.infoBody}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{activeEmail}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrapper}>
              <CallIcon size={18} color="#737686" />
            </View>
            <View style={styles.infoBody}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{activePhone}</Text>
            </View>
          </View>
        </View>

        {/* Section 2: Edit Profile */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <TuneIcon size={20} color="#1565c0" />
            <Text style={styles.cardTitle}>Edit Profile Information</Text>
          </View>

          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor="#9ea3b4"
          />

          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            placeholderTextColor="#9ea3b4"
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSaveProfile}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <CheckCircleIcon size={16} color="#ffffff" />
                <Text style={styles.primaryButtonText}>Save Profile Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Section 3: Change Password */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <LockResetIcon size={20} color="#1565c0" />
            <Text style={styles.cardTitle}>Security & Password</Text>
          </View>

          <Text style={styles.inputLabel}>Current Password</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            secureTextEntry
            placeholderTextColor="#9ea3b4"
          />

          <Text style={styles.inputLabel}>New Password</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            secureTextEntry
            placeholderTextColor="#9ea3b4"
          />

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleChangePassword}
            disabled={changingPw}
            activeOpacity={0.8}
          >
            {changingPw ? (
              <ActivityIndicator color="#1565c0" size="small" />
            ) : (
              <Text style={styles.secondaryButtonText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Section 4: Preferences */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <TuneIcon size={20} color="#1565c0" />
            <Text style={styles.cardTitle}>App Preferences</Text>
          </View>

          <TouchableOpacity style={styles.settingRow} onPress={handleSelectLanguage} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <LanguageIcon size={18} color="#737686" />
              <Text style={styles.settingText}>Language</Text>
            </View>
            <Text style={styles.settingValue}>{language}</Text>
          </TouchableOpacity>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingLeft}>
              <DarkModeIcon size={18} color="#737686" />
              <Text style={styles.settingText}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              trackColor={{ false: '#dfe9fa', true: '#90caf9' }}
              thumbColor={isDarkMode ? '#1565c0' : '#737686'}
            />
          </View>
        </View>

        {/* Section 5: Sign Out */}
        <TouchableOpacity style={styles.logoutButton} onPress={() => signOut()} activeOpacity={0.8}>
          <LogoutIcon size={18} color="#d32f2f" />
          <Text style={styles.logoutButtonText}>Sign Out from Account</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#eef0f6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#121c28',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
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
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#1565c0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#121c28',
  },
  userEmail: {
    fontSize: 12,
    color: '#737686',
    marginTop: 2,
  },
  roleBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1565c0',
    marginLeft: 6,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderColor: '#f0f2f8',
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#121c28',
    marginLeft: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f0f4fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoBody: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#737686',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#121c28',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#434654',
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#f8f9ff',
    borderWidth: 1,
    borderColor: '#dcdfe8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#121c28',
    marginBottom: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1565c0',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 8,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 6,
  },
  secondaryButtonText: {
    color: '#1565c0',
    fontWeight: '700',
    fontSize: 13,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#f0f2f8',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#121c28',
    marginLeft: 10,
  },
  settingValue: {
    fontSize: 12,
    color: '#1565c0',
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ffcdd2',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
});

export default ProfileScreen;
