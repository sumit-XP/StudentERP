import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Modal,
  ImageBackground,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { User } from '../../types/index';

const AccountIcon: React.FC<{ color?: string; size?: number; style?: object }> = ({
  color = '#737686',
  size = 20,
  style,
}) => (
  <View style={style}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx={12} cy={7} r={4} />
    </Svg>
  </View>
);

const LockIcon: React.FC<{ color?: string; size?: number; style?: object }> = ({
  color = '#737686',
  size = 20,
  style,
}) => (
  <View style={style}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Svg>
  </View>
);

const EyeIcon: React.FC<{ color?: string; size?: number }> = ({
  color = '#737686',
  size = 20,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <Circle cx={12} cy={12} r={3} />
  </Svg>
);

const EyeOffIcon: React.FC<{ color?: string; size?: number }> = ({
  color = '#737686',
  size = 20,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <Line x1={1} y1={1} x2={23} y2={23} />
  </Svg>
);

const LoginScreen: React.FC = () => {
  const { signIn } = useAuth();
  const navigation = useNavigation<never>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);

  // Forgot Password Modal State
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);


  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { token, user } = await authService.login(email.trim(), password);
      await signIn(token, user);
    } catch (e: unknown) {
      Alert.alert(
        'Authentication Failed',
        e instanceof Error ? e.message : 'An error occurred during auth',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForgotModal = () => {
    setResetEmail(email || '');
    setResetSuccess(false);
    setForgotModalVisible(true);
  };

  const handleSendResetLink = async () => {
    if (!resetEmail.trim()) {
      Alert.alert('Required', 'Please enter your registered username or email.');
      return;
    }
    setResetLoading(true);
    // Simulate network request for password recovery link
    setTimeout(() => {
      setResetLoading(false);
      setResetSuccess(true);
    }, 1200);
  };

  const togglePasswordVisibility = () => {
    setSecureText(!secureText);
  };

  return (
    <ImageBackground
      source={{
        uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbyz4r-GYmn0XYfIIX8NUgcYk4DmREAhA4zjY7lvKz4HBpUONLT7WYEMj7Z0Tu2T3e6_gxU_jUVIrHC4jq5ioXqs5LQQUG2Yaf0Q95HcwbUgMusVCYQ8zMAX_e0C9hHrtEWIQNjHAQnjY9j3Y6feTjqMN3nz-_iQCbePkaNX9wT6DPDOda1M7dRCRl0GlcYmGyXxjTYa4Hk-DP3GbEnzz0tZhbsWEPLBvJU4BTQ8L2mDTFC_MCF1fN',
      }}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>

        <KeyboardAvoidingView
          style={styles.flexContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Form Bento Card */}
            <View style={styles.authCard}>
              {/* Dynamic Welcome Heading */}
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Welcome back!</Text>
                <Text style={styles.cardSubtitle}>
                  Please enter your details to access your dashboard.
                </Text>
              </View>

              {/* Form Fields */}
              <View style={styles.formContainer}>
                {/* Username/Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Username or Email</Text>
                  <View style={styles.inputWrapper}>
                    <AccountIcon
                      color="#737686"
                      size={20}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. alex.j@university.edu"
                      placeholderTextColor="#737686"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                      editable={!loading}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <View style={styles.passwordHeader}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <TouchableOpacity onPress={handleOpenForgotModal} activeOpacity={0.6}>
                      <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inputWrapper}>
                    <LockIcon color="#737686" size={20} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.textInput, styles.passwordInput]}
                      placeholder="••••••••"
                      placeholderTextColor="#737686"
                      secureTextEntry={secureText}
                      value={password}
                      onChangeText={setPassword}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={togglePasswordVisibility}
                      activeOpacity={0.6}
                    >
                      {secureText ? (
                        <EyeOffIcon color="#737686" size={20} />
                      ) : (
                        <EyeIcon color="#737686" size={20} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Action Button */}
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleAuth}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Sign In</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Legal Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerCopyrightText}>
                  © All rights reserved to Sikhsha
                </Text>
                <Text style={styles.footerSecuredText}>
                  Licensed for Educational Institution Use
                </Text>
                <View style={styles.footerLinkRow}>
                  <TouchableOpacity
                    onPress={() => (navigation as any).navigate('PrivacyPolicy')}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.footerLink}>Privacy Policy</Text>
                  </TouchableOpacity>
                  <Text style={styles.footerBullet}> • </Text>
                  <TouchableOpacity
                    onPress={() => (navigation as any).navigate('TermsOfUse')}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.footerLink}>Terms of Use</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Forgot Password Modal */}
      <Modal
        visible={forgotModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setForgotModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.forgotCard}>
            <Text style={styles.forgotCardTitle}>Reset Password</Text>
            <Text style={styles.forgotCardSubtitle}>
              {resetSuccess
                ? 'Check your inbox! We sent password recovery instructions to your registered email.'
                : 'Enter your registered email address or username to receive a password reset link.'}
            </Text>

            {!resetSuccess ? (
              <>
                <View style={[styles.inputWrapper, { marginTop: 16 }]}>
                  <AccountIcon color="#737686" size={20} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter email or username"
                    placeholderTextColor="#737686"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={resetEmail}
                    onChangeText={setResetEmail}
                    editable={!resetLoading}
                  />
                </View>

                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    style={styles.cancelModalButton}
                    onPress={() => setForgotModalVisible(false)}
                    disabled={resetLoading}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelModalButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sendModalButton}
                    onPress={handleSendResetLink}
                    disabled={resetLoading}
                    activeOpacity={0.8}
                  >
                    {resetLoading ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.sendModalButtonText}>Send Link</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 20 }]}
                onPress={() => setForgotModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  flexContainer: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  authCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#121c28',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  cardHeader: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#121c28',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#434654',
    lineHeight: 20,
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#434654',
    letterSpacing: 0.6,
    marginBottom: 6,
    marginLeft: 4,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#003fb1',
    letterSpacing: 0.6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(195, 197, 215, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#121c28',
    paddingVertical: 0,
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#003fb1',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#003fb1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 28,
    alignItems: 'center',
  },
  footerCopyrightText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#121c28',
    textAlign: 'center',
    marginBottom: 2,
  },
  footerSecuredText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#737686',
    textAlign: 'center',
    lineHeight: 14,
    marginBottom: 6,
  },
  footerLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLink: {
    fontSize: 11,
    fontWeight: '600',
    color: '#003fb1',
  },
  footerBullet: {
    color: '#737686',
    fontSize: 11,
    marginHorizontal: 4,
  },
  forgotCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#121c28',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  forgotCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#121c28',
    marginBottom: 6,
  },
  forgotCardSubtitle: {
    fontSize: 13,
    color: '#434654',
    lineHeight: 18,
  },
  modalActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  cancelModalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
  },
  cancelModalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#737686',
  },
  sendModalButton: {
    backgroundColor: '#003fb1',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendModalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  testNavTrigger: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 999,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    shadowColor: '#121c28',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 28, 40, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#121c28',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9ff',
    paddingBottom: 12,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#003fb1',
  },
  modalScroll: {
    paddingBottom: 20,
  },
  menuSectionHeader: {
    fontSize: 9,
    fontWeight: '800',
    color: '#737686',
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9ff',
  },
  menuIcon: {
    marginRight: 10,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#121c28',
  },
});

export default LoginScreen;
