import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import assignmentService from '../../services/assignmentService';
import { useAuth } from '../../contexts/AuthContext';
import { Assignment } from '../../types/assignments';
import { AssignmentsStackParamList } from '../../navigation/features/AssignmentsNavigator';

type NavProp = StackNavigationProp<AssignmentsStackParamList, 'AssignmentList'>;

const STATUS_COLORS: Record<string, string> = {
  submitted: '#1565c0',
  graded: '#2e7d32',
  late: '#c62828',
  pending: '#ef6c00',
};

const AssignmentListScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  // State for assignments list
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for teacher view
  const [teacherTab, setTeacherTab] = useState<'active' | 'drafts' | 'past'>('active');

  const fetchAssignmentsList = () => {
    setLoading(true);
    assignmentService
      .getAssignments()
      .then((data) => {
        setAssignments(Array.isArray(data) ? data : []);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAssignmentsList();
  }, [isTeacher]);

  const handleCreateAssignment = () => {
    navigation.navigate('AssignHomework' as never);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3949ab" />
      </View>
    );
  }

  if (error && !isTeacher) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  // TEACHER / ADMIN MODE RENDER
  if (isTeacher) {
    return (
      <SafeAreaView style={styles.containerTeacher}>
        {/* Header from JSON */}
        <View style={styles.teacherHeader}>
          <View style={styles.headerProfileRow}>
            <View style={styles.teacherAvatarWrapper}>
              <Image
                style={styles.teacherAvatarImg}
                source={{
                  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBB-Qz_VWidTvF94GrrGOrPhV2pGkXIF46b5DF5E8sEhtZeDLVZJXLpAkUyLJGnElGMJvlzyVXN-vjiT-w_N5n5KLq38eW83VWX9XciTmJbdLLw-1p95AiuPFUIgoEo8P4PF4W7qRkmTW6NxYvGe9z0HhZf2D_uOu5VwBPaYSPbvemEmCqnUrM1PLtgAab3rZiNXOCqkXsdZlDZjzT7NMU8Mq7tLGlmeztwzVTf80uW96EesABEW_xN',
                }}
              />
            </View>
            <Text style={styles.teacherHeaderTitle}>{user?.name || 'Teacher Portal'}</Text>
          </View>
          <TouchableOpacity
            style={styles.teacherNotifBtn}
            activeOpacity={0.6}
            onPress={() => Alert.alert('Notifications', 'No new notifications.')}
          >
            <Icon name="bell-outline" size={22} color="#003fb1" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContentTeacher}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Greeting & Stats */}
          <View style={styles.headingBlock}>
            <Text style={styles.titleTeacher}>Assignments</Text>
            <Text style={styles.subTeacher}>
              Manage curriculum tasks and track student progress.
            </Text>
          </View>

          {/* Filters / Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.filterTab, teacherTab === 'active' && styles.filterTabActive]}
              onPress={() => setTeacherTab('active')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterTabText,
                  teacherTab === 'active' && styles.filterTabTextActive,
                ]}
              >
                Active
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterTab, teacherTab === 'drafts' && styles.filterTabActive]}
              onPress={() => setTeacherTab('drafts')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterTabText,
                  teacherTab === 'drafts' && styles.filterTabTextActive,
                ]}
              >
                Drafts
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterTab, teacherTab === 'past' && styles.filterTabActive]}
              onPress={() => setTeacherTab('past')}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.filterTabText, teacherTab === 'past' && styles.filterTabTextActive]}
              >
                Past Assignments
              </Text>
            </TouchableOpacity>
          </View>

          {/* Assignment items list based on selected tab */}
          {teacherTab === 'active' && (
            <View style={styles.cardsGrid}>
              {assignments.length === 0 ? (
                <TouchableOpacity
                  style={styles.emptyStateCard}
                  onPress={handleCreateAssignment}
                  activeOpacity={0.7}
                >
                  <Icon name="calendar-plus" size={32} color="#737686" style={styles.emptyCardIcon} />
                  <Text style={styles.emptyCardText}>No active assignments. Tap to create one.</Text>
                </TouchableOpacity>
              ) : (
                assignments.map((item: any) => {
                  const subjectName = item.subject_name || item.subject || 'General';
                  const className = item.class_name
                    ? `${item.class_name}${item.section ? `-${item.section}` : ''}`
                    : '';
                  const due = item.due_date || item.dueDate
                    ? new Date(item.due_date || item.dueDate).toLocaleDateString()
                    : 'No due date';
                  const subs = item.total_submissions ?? 0;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.teacherAssignmentCard}
                      activeOpacity={0.85}
                      onPress={() => navigation.navigate('AssignmentDetail', { assignmentId: item.id })}
                    >
                      <View style={styles.cardHeaderRow}>
                        <View style={styles.badgesCol}>
                          <View style={[styles.tagBadge, { backgroundColor: '#82f5c1' }]}>
                            <Text style={[styles.tagText, { color: '#005137' }]}>
                              {subjectName}
                            </Text>
                          </View>
                          {className ? (
                            <View style={[styles.tagBadge, { backgroundColor: '#dfe9fa', marginLeft: 6 }]}>
                              <Text style={[styles.tagText, { color: '#003fb1' }]}>{className}</Text>
                            </View>
                          ) : null}
                        </View>
                        <TouchableOpacity style={styles.moreBtn} activeOpacity={0.6}>
                          <Icon name="dots-vertical" size={18} color="#737686" />
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.cardTitleTeacher}>{item.title}</Text>

                      <View style={styles.dueDateRow}>
                        <Icon name="calendar-blank-outline" size={16} color="#737686" style={styles.dueIcon} />
                        <Text style={styles.dueDateText}>Due: {due}</Text>
                      </View>

                      <View style={styles.submissionsMeterSection}>
                        <View style={styles.meterTextRow}>
                          <Text style={styles.meterLabel}>Submissions</Text>
                          <Text style={styles.meterRatio}>{subs} Total</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}

          {teacherTab === 'drafts' && (
            <View style={styles.cardsGrid}>
              <View style={styles.emptyStateCard}>
                <Icon name="file-document-outline" size={32} color="#737686" style={styles.emptyCardIcon} />
                <Text style={styles.emptyCardText}>No saved drafts.</Text>
              </View>
            </View>
          )}

          {teacherTab === 'past' && (
            <View style={styles.cardsGrid}>
              <View style={styles.emptyStateCard}>
                <Icon name="history" size={32} color="#737686" style={styles.emptyCardIcon} />
                <Text style={styles.emptyCardText}>No past archived assignments.</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* FAB: Create New Assignment */}
        <TouchableOpacity
          style={styles.fabBtn}
          onPress={handleCreateAssignment}
          activeOpacity={0.85}
        >
          <Icon name="plus" size={28} color="#ffffff" />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // STUDENT MODE RENDER
  return (
    <FlatList
      contentContainerStyle={styles.containerStudent}
      data={assignments}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={<Text style={styles.empty}>No assignments found.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.cardStudent}
          onPress={() => navigation.navigate('AssignmentDetail', { assignmentId: item.id })}
        >
          <View style={styles.cardTop}>
            <Text style={styles.titleStudent}>{item.title}</Text>
            {item.status && (
              <View
                style={[
                  styles.badgeStudent,
                  { backgroundColor: STATUS_COLORS[item.status] ?? '#999' },
                ]}
              >
                <Text style={styles.badgeTextStudent}>{item.status.toUpperCase()}</Text>
              </View>
            )}
          </View>
          <Text style={styles.subjectStudent}>{item.subject}</Text>
          <Text style={styles.dueStudent}>Due: {item.dueDate}</Text>
        </TouchableOpacity>
      )}
    />
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: 'red', fontSize: 14 },

  // STUDENT STYLES
  containerStudent: { padding: 16, backgroundColor: '#f5f5f5' },
  cardStudent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleStudent: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', flex: 1 },
  badgeStudent: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  badgeTextStudent: { fontSize: 10, color: '#fff', fontWeight: '700' },
  subjectStudent: { fontSize: 13, color: '#555', marginBottom: 2 },
  dueStudent: { fontSize: 12, color: '#888' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },

  // TEACHER STYLES
  containerTeacher: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  teacherHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#c3c5d7',
  },
  headerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teacherAvatarWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#003fb1',
  },
  teacherAvatarImg: {
    width: '100%',
    height: '100%',
  },
  teacherHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#003fb1',
    marginLeft: 10,
  },
  teacherNotifBtn: {
    padding: 8,
    borderRadius: 9999,
  },
  scrollContentTeacher: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80,
  },
  headingBlock: {
    marginBottom: 20,
  },
  titleTeacher: {
    fontSize: 22,
    fontWeight: '700',
    color: '#121c28',
  },
  subTeacher: {
    fontSize: 14,
    color: '#434654',
    marginTop: 2,
    lineHeight: 20,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#e5eeff',
    borderRadius: 20,
    padding: 4,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  filterTabActive: {
    backgroundColor: '#003fb1',
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#434654',
  },
  filterTabTextActive: {
    color: '#ffffff',
  },
  cardsGrid: {
    gap: 12,
  },
  teacherAssignmentCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },
  teacherCardUrgent: {
    borderColor: '#ba1a1a',
    borderLeftWidth: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  badgesCol: {
    flexDirection: 'row',
    gap: 6,
  },
  tagBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  urgentBadge: {
    backgroundColor: '#ffdad6',
  },
  urgentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ba1a1a',
  },
  moreBtn: {
    padding: 4,
    marginTop: -4,
  },
  cardTitleTeacher: {
    fontSize: 15,
    fontWeight: '700',
    color: '#121c28',
    marginBottom: 10,
    lineHeight: 22,
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dueIcon: {
    marginRight: 6,
  },
  dueDateText: {
    fontSize: 12,
    color: '#737686',
    fontWeight: '500',
  },
  dueDateTextUrgent: {
    color: '#ba1a1a',
    fontWeight: '700',
  },
  submissionsMeterSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(195,197,215,0.3)',
    paddingTop: 12,
  },
  meterTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  meterLabel: {
    fontSize: 12,
    color: '#434654',
    fontWeight: '500',
  },
  meterRatio: {
    fontSize: 12,
    fontWeight: '700',
    color: '#003fb1',
  },
  meterProgressBg: {
    height: 8,
    backgroundColor: '#e5eeff',
    borderRadius: 4,
    overflow: 'hidden',
  },
  meterProgressFill: {
    height: '100%',
    backgroundColor: '#003fb1',
    borderRadius: 4,
  },
  emptyStateCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#c3c5d7',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    opacity: 0.7,
  },
  emptyCardIcon: {
    marginBottom: 8,
  },
  emptyCardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#434654',
    textAlign: 'center',
  },
  fabBtn: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#003fb1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#003fb1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  badgeOrange: {
    backgroundColor: '#ffdcc3',
  },
  textOrange: {
    color: '#6e3900',
  },
  badgeGrey: {
    backgroundColor: '#d9e3f4',
  },
  textGrey: {
    color: '#434654',
  },
});

export default AssignmentListScreen;
