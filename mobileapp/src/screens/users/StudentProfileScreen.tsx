import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Linking,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import academicService from '../../services/academicService';
import { Guardian, StudentDocument } from '../../types/users';
import { UsersStackParamList } from '../../navigation/features/UsersNavigator';

type RoutePropType = RouteProp<UsersStackParamList, 'StudentProfile'>;

const StudentProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RoutePropType>();
  const { studentId, userDetail } = route.params;

  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      academicService.getStudentGuardians(studentId),
      academicService.getStudentDocuments(studentId),
    ])
      .then(([gRes, dRes]) => {
        if (!isMounted) return;

        if (gRes.status === 'fulfilled') {
          const gVal = gRes.value;
          const gArray = Array.isArray(gVal) ? gVal : gVal?.guardians || gVal?.data || [];
          setGuardians(Array.isArray(gArray) ? gArray : []);
        } else {
          setGuardians([]);
        }

        if (dRes.status === 'fulfilled') {
          const dVal = dRes.value;
          const dArray = Array.isArray(dVal) ? dVal : dVal?.documents || dVal?.data || [];
          setDocuments(Array.isArray(dArray) ? dArray : []);
        } else {
          setDocuments([]);
        }
      })
      .catch((e: Error) => {
        console.error('Error loading student profile data:', e);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [studentId]);

  const userName = userDetail?.name || 'User Profile';
  const userRole = userDetail?.role || 'Student';
  const userEmail = userDetail?.email || 'N/A';
  const userPhone = userDetail?.phone || 'N/A';
  const userClass = userDetail?.className || userDetail?.class_name ? `${userDetail.class_name || userDetail.className} ${userDetail.section ? `(${userDetail.section})` : ''}` : null;
  const userRoll = userDetail?.rollNumber || userDetail?.roll_number || userDetail?.student_id || studentId;
  const userStatus = userDetail?.status || 'Active';

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Top Header Navigation */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backTouchBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color="#003fb1" />
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>User Overview</Text>
        <View style={styles.placeholderBox} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card Overview */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.userNameText}>{userName}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.roleBadge, userRole === 'Student' ? styles.badgeStudent : styles.badgeTeacher]}>
              <Text style={styles.roleBadgeText}>{userRole}</Text>
            </View>
            <View style={styles.statusDotRow}>
              <View style={[styles.statusDot, userStatus === 'Active' ? styles.dotGreen : styles.dotGrey]} />
              <Text style={styles.statusText}>{userStatus}</Text>
            </View>
          </View>

          {/* Details Table */}
          <View style={styles.detailsGrid}>
            {userClass ? (
              <View style={styles.gridRow}>
                <Text style={styles.gridLabel}>Class / Section:</Text>
                <Text style={styles.gridVal}>{userClass}</Text>
              </View>
            ) : null}
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>ID / Roll Number:</Text>
              <Text style={styles.gridVal}>{userRoll}</Text>
            </View>
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>Email:</Text>
              <Text style={styles.gridVal}>{userEmail}</Text>
            </View>
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>Contact Phone:</Text>
              <Text style={styles.gridVal}>{userPhone}</Text>
            </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#003fb1" />
            <Text style={styles.loadingText}>Fetching Records...</Text>
          </View>
        ) : (
          <>
            {/* Guardians Section */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Guardians Information</Text>
              {guardians.length === 0 ? (
                <Text style={styles.emptyText}>No guardian details on record.</Text>
              ) : (
                guardians.map((g, idx) => (
                  <View key={g.id || idx} style={styles.guardianRow}>
                    <View style={styles.guardianInfo}>
                      <Text style={styles.guardianName}>{g.name}</Text>
                      <Text style={styles.guardianRelation}>{g.relationship || 'Guardian'}</Text>
                    </View>
                    {g.phone ? (
                      <TouchableOpacity
                        style={styles.actionCallBtn}
                        onPress={() => Linking.openURL(`tel:${g.phone}`)}
                      >
                        <Icon name="phone" size={16} color="#003fb1" />
                        <Text style={styles.actionCallText}>{g.phone}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ))
              )}
            </View>

            {/* Documents Section */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Uploaded Documents</Text>
              {documents.length === 0 ? (
                <Text style={styles.emptyText}>No student documents uploaded.</Text>
              ) : (
                documents.map((doc, idx) => (
                  <View key={doc.id || idx} style={styles.docRow}>
                    <Icon name="file-document-outline" size={20} color="#003fb1" style={styles.docIcon} />
                    <View style={styles.docInfo}>
                      <Text style={styles.docType}>{doc.documentType || 'Official Document'}</Text>
                      <Text style={styles.docDate}>Uploaded: {doc.uploadedAt || 'Recently'}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#c3c5d7',
  },
  backTouchBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#121c28',
  },
  placeholderBox: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  profileHeaderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c3c5d7',
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eef4ff',
    borderWidth: 2,
    borderColor: '#003fb1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: '800',
    color: '#003fb1',
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#121c28',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 16,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeStudent: {
    backgroundColor: '#82f5c1',
  },
  badgeTeacher: {
    backgroundColor: '#ffdcc3',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#005137',
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotGreen: {
    backgroundColor: '#006c4a',
  },
  dotGrey: {
    backgroundColor: '#737686',
  },
  statusText: {
    fontSize: 11,
    color: '#434654',
    fontWeight: '600',
  },
  detailsGrid: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#f8f9ff',
    paddingTop: 12,
    gap: 8,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridLabel: {
    fontSize: 12,
    color: '#737686',
    fontWeight: '600',
  },
  gridVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#121c28',
  },
  loadingBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#003fb1',
    marginTop: 6,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c3c5d7',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121c28',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 12,
    color: '#737686',
    fontStyle: 'italic',
  },
  guardianRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9ff',
  },
  guardianInfo: {
    flex: 1,
  },
  guardianName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#121c28',
  },
  guardianRelation: {
    fontSize: 11,
    color: '#737686',
    marginTop: 2,
  },
  actionCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#c3c5d7',
    gap: 4,
  },
  actionCallText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#003fb1',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9ff',
  },
  docIcon: {
    marginRight: 10,
  },
  docInfo: {
    flex: 1,
  },
  docType: {
    fontSize: 13,
    fontWeight: '700',
    color: '#121c28',
  },
  docDate: {
    fontSize: 11,
    color: '#737686',
    marginTop: 2,
  },
});

export default StudentProfileScreen;
