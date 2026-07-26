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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { User } from '../../types/index';

const LoginScreen: React.FC = () => {
  const { signIn } = useAuth();
  const navigation = useNavigation<never>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);


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

  const handleForgotLink = () => {
    Alert.alert(
      'Reset Password',
      'If this email is registered in our system, a recovery link will be sent shortly.',
      [{ text: 'OK' }],
    );
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
                    <Icon
                      name="account-outline"
                      size={20}
                      color="#737686"
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
                    <TouchableOpacity onPress={handleForgotLink} activeOpacity={0.6}>
                      <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inputWrapper}>
                    <Icon name="lock-outline" size={20} color="#737686" style={styles.inputIcon} />
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
                      <Icon
                        name={secureText ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color="#737686"
                      />
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
                <Text style={styles.footerSecuredText}>
                  Protected by institution-grade security.
                </Text>
                <View style={styles.footerLinkRow}>
                  <TouchableOpacity activeOpacity={0.6}>
                    <Text style={styles.footerLink}>Privacy Policy</Text>
                  </TouchableOpacity>
                  <Text style={styles.footerBullet}> • </Text>
                  <TouchableOpacity activeOpacity={0.6}>
                    <Text style={styles.footerLink}>Terms of Use</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
    marginTop: 32,
    alignItems: 'center',
  },
  footerSecuredText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#737686',
    textAlign: 'center',
    lineHeight: 14,
    marginBottom: 4,
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
