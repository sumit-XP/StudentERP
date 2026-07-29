import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';

const BackArrowIcon: React.FC<{ color?: string; size?: number }> = ({
  color = '#1E293B',
  size = 24,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);

const FileTextIcon: React.FC<{ color?: string; size?: number }> = ({
  color = '#2563EB',
  size = 28,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <Path d="M14 2v6h6" />
    <Path d="M16 13H8" />
    <Path d="M16 17H8" />
    <Path d="M10 9H8" />
  </Svg>
);

const TermsOfUseScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <BackArrowIcon color="#0F172A" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Use</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.bannerCard}>
          <FileTextIcon color="#2563EB" size={32} />
          <View style={styles.bannerTextWrapper}>
            <Text style={styles.bannerTitle}>Sikhsha Software Agreement</Text>
            <Text style={styles.bannerSubtitle}>
              Institutional License & End User Terms of Service
            </Text>
          </View>
        </View>

        <Text style={styles.lastUpdated}>Effective Date: July 2026</Text>

        {/* Section 1 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>1. License Grant & Authorization</Text>
          <Text style={styles.paragraph}>
            This application is licensed by <Text style={styles.boldText}>Sikhsha</Text> to partner educational institutions under a commercial software agreement.
          </Text>
          <Text style={styles.paragraph}>
            Authorized users (administrators, faculty members, enrolled students, and registered parents/guardians) are granted a non-exclusive, non-transferable right to access and use the Sikhsha ERP application solely for educational and administrative purposes.
          </Text>
        </View>

        {/* Section 2 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>2. Account Security & Responsibilities</Text>
          <Text style={styles.paragraph}>
            Users are responsible for maintaining the confidentiality of their account credentials (username and password). Any activity performed through your account is your sole responsibility.
          </Text>
          <Text style={styles.bulletItem}>• Notify school administration immediately upon discovering unauthorized account access.</Text>
          <Text style={styles.bulletItem}>• Do not share passwords or access tokens with unauthorized third parties.</Text>
        </View>

        {/* Section 3 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>3. Acceptable Code of Conduct</Text>
          <Text style={styles.paragraph}>
            When utilizing Sikhsha communication modules, messaging, and document uploads:
          </Text>
          <Text style={styles.bulletItem}>• Users must not upload malicious files, offensive content, or unauthorized materials.</Text>
          <Text style={styles.bulletItem}>• Attempting to reverse engineer, decompile, or breach the API security of the Sikhsha platform is strictly prohibited.</Text>
        </View>

        {/* Section 4 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>4. Intellectual Property Rights</Text>
          <Text style={styles.paragraph}>
            All rights, title, and interest in and to the Sikhsha platform, including software source code, graphics, branding, trademarks, and user interfaces, are owned exclusively by <Text style={styles.boldText}>Sikhsha</Text>.
          </Text>
        </View>

        {/* Section 5 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>5. Termination & Modifications</Text>
          <Text style={styles.paragraph}>
            Sikhsha reserves the right to update or modify these Terms of Use to reflect evolving legal, security, or feature requirements. License termination by the subscribing institution will suspend user access in accordance with the master service agreement.
          </Text>
        </View>

        {/* Footer Rights */}
        <View style={styles.footerNote}>
          <Text style={styles.footerCopyright}>© All rights reserved to Sikhsha</Text>
          <Text style={styles.footerLicense}>Licensed for Educational Institution Use</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 18,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  bannerTextWrapper: {
    marginLeft: 12,
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#1D4ED8',
    lineHeight: 16,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 8,
  },
  boldText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  bulletItem: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 6,
    paddingLeft: 4,
  },
  footerNote: {
    marginTop: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  footerCopyright: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  footerLicense: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});

export default TermsOfUseScreen;
