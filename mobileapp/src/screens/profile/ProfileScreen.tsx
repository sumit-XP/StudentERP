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
} from 'react-native';
import apiClient from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileData {
  name: string;
  email: string;
  phone?: string;
  role: string;
}

const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    apiClient
      .get('/auth/profile')
      .then((res) => {
        const data = res.data as { data?: ProfileData } | ProfileData;
        const p = (data as { data?: ProfileData }).data ?? (data as ProfileData);
        setProfile(p);
        setName(p.name ?? '');
        setPhone(p.phone ?? '');
      })
      .catch((e: Error) => Alert.alert('Error', e.message));
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await apiClient.put('/auth/profile', { name, phone });
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
      await apiClient.put('/auth/change-password', { currentPassword, newPassword });
      Alert.alert('Success', 'Password changed');
      setCurrentPassword('');
      setNewPassword('');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    } finally {
      setChangingPw(false);
    }
  };

  if (!profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#37474f" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name ?? 'U').charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.role}>{profile.role.toUpperCase()}</Text>
        <Text style={styles.email}>{profile.email}</Text>
      </View>

      <Text style={styles.sectionTitle}>Edit Profile</Text>
      <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
      <TextInput
        style={styles.input}
        placeholder="Phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TouchableOpacity style={styles.btn} onPress={saveProfile} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Save Changes</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Change Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Current Password"
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      <TouchableOpacity
        style={[styles.btn, styles.pwBtn]}
        onPress={changePassword}
        disabled={changingPw}
      >
        {changingPw ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Change Password</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => signOut()}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#37474f',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: { fontSize: 30, color: '#fff', fontWeight: '700' },
  role: { fontSize: 12, color: '#888', letterSpacing: 1.5, marginBottom: 4 },
  email: { fontSize: 14, color: '#555' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#37474f',
    marginBottom: 12,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 14,
  },
  btn: {
    backgroundColor: '#37474f',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  pwBtn: { backgroundColor: '#455a64' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  logoutBtn: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#c62828',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  logoutText: { color: '#c62828', fontWeight: '700', fontSize: 15 },
});

export default ProfileScreen;
