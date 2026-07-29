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

const ShieldCheckIcon: React.FC<{ color?: string; size?: number }> = ({
  color = '#059669',
  size = 28,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <Path d="M9 12l2 2 4-4" />
  </Svg>
);

const PrivacyPolicyScreen: React.FC = () => {
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.bannerCard}>
          <ShieldCheckIcon color="#059669" size={32} />
          <View style={styles.bannerTextWrapper}>
            <Text style={styles.bannerTitle}>Sikhsha Data Protection</Text>
            <Text style={styles.bannerSubtitle}>
              Institutional Grade Privacy & Security Policy for Partner Schools
            </Text>
          </View>
        </View>

        <Text style={styles.lastUpdated}>Effective Date: July 2026</Text>

        {/* Section 1 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>1. Introduction & Ownership</Text>
          <Text style={styles.paragraph}>
            This application is owned and operated by <Text style={styles.boldText}>Sikhsha</Text>. Sikhsha provides licensed School Enterprise Resource Planning (ERP) software solutions to affiliated educational institutions.
          </Text>
          <Text style={styles.paragraph}>
            We are committed to safeguarding the privacy and confidential data of all students, parents, teachers, and school administrators using our platform.
          </Text>
        </View>

        {/* Section 2 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>2. Information We Collect</Text>
          <Text style={styles.paragraph}>
            To operate institutional ERP services, the Sikhsha platform processes the following data provided by your educational institution:
          </Text>
          <Text style={styles.bulletItem}>• <Text style={styles.boldText}>Student Profiles:</Text> Full name, enrollment number, class grade, attendance records, academic results, and assignment submissions.</Text>
          <Text style={styles.bulletItem}>• <Text style={styles.boldText}>Parent/Guardian Details:</Text> Contact number, email address, relationship, and fee payment transaction references.</Text>
          <Text style={styles.bulletItem}>• <Text style={styles.boldText}>Staff & Teacher Information:</Text> Professional credentials, subject allocations, and communication records.</Text>
        </View>

        {/* Section 3 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>3. Institutional Licensing & Data Use</Text>
          <Text style={styles.paragraph}>
            Sikhsha acts as a data processor on behalf of the licensee school. All personal records collected remain the property of the respective educational institution.
          </Text>
          <Text style={styles.paragraph}>
            Data is strictly used to deliver core educational workflows including attendance tracking, gradebook reporting, fee processing notifications, and school announcements.
          </Text>
        </View>

        {/* Section 4 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>4. Data Security & Storage</Text>
          <Text style={styles.paragraph}>
            Sikhsha employs bank-grade AES-256 encryption for data at rest and TLS 1.3 encryption for data in transit. Access is strictly controlled using role-based access mechanisms (Admin, Teacher, Parent, Student).
          </Text>
        </View>

        {/* Section 5 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>5. Contact & Support</Text>
          <Text style={styles.paragraph}>
            If you have questions regarding this Privacy Policy or wish to exercise data subject rights, please contact Sikhsha Support at <Text style={styles.linkText}>support@sikhsha.edu</Text> or reach out to your school administration.
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
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
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
    color: '#065F46',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#047857',
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
  linkText: {
    color: '#2563EB',
    fontWeight: '600',
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

export default PrivacyPolicyScreen;
