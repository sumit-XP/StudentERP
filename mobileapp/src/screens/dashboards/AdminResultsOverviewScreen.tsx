import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import academicService from '../../services/academicService';

const AdminResultsOverviewScreen: React.FC = () => {
  const navigation = useNavigation();
  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      academicService.getClasses(),
      academicService.getExams()
    ]).then(([clsRes, examRes]) => {
      if (clsRes.status === 'fulfilled' && Array.isArray(clsRes.value)) {
        setClasses(clsRes.value);
      }
      if (examRes.status === 'fulfilled' && Array.isArray(examRes.value)) {
        setExams(examRes.value);
      }
      setInitialLoad(false);
    });
  }, []);

  useEffect(() => {
    if (selectedClassId && selectedExamId) {
      setLoading(true);
      academicService.getExamResults(selectedClassId, selectedExamId)
        .then(data => {
          // The matrix endpoint returns an object like { subjects: [], summary: {} }
          if (data && data.subjects) {
            setResults(data.subjects);
          } else if (Array.isArray(data)) {
            setResults(data);
          } else {
            setResults([]);
          }
        })
        .catch(err => {
          Alert.alert('Error', 'Failed to fetch results.');
          setResults([]);
        })
        .finally(() => setLoading(false));
    } else {
      setResults([]);
    }
  }, [selectedClassId, selectedExamId]);

  const allMarksEntered = React.useMemo(() => {
    if (results.length === 0) return false;
    return results.every((sub: any) => sub.submission_status === 'submitted');
  }, [results]);

  const handlePublish = async () => {
    if (!allMarksEntered) return;
    try {
      setPublishing(true);
      await academicService.publishExamResults(selectedClassId, selectedExamId);
      Alert.alert('Success', 'Results published successfully! Parents can now view them on their portal.');
    } catch (err) {
      Alert.alert('Error', 'Failed to publish results. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Exam Reports</Text>
        <Text style={styles.headerSubtitle}>Select class and exam to view results</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {initialLoad ? (
          <ActivityIndicator size="large" color="#003fb1" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Filter Section */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Select Class</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
                {classes.length === 0 ? (
                  <Text style={styles.emptyText}>No classes found</Text>
                ) : (
                  classes.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.chip, selectedClassId === c.id && styles.chipActive]}
                      onPress={() => setSelectedClassId(c.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, selectedClassId === c.id && styles.chipTextActive]}>
                        {c.name || c.class_name}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>

              <Text style={[styles.filterLabel, { marginTop: 16 }]}>Select Exam</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
                {exams.length === 0 ? (
                  <Text style={styles.emptyText}>No exams found</Text>
                ) : (
                  exams.map((e) => (
                    <TouchableOpacity
                      key={e.id}
                      style={[styles.chip, selectedExamId === e.id && styles.chipActive]}
                      onPress={() => setSelectedExamId(e.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, selectedExamId === e.id && styles.chipTextActive]}>
                        {e.title || e.name || e.exam_name || 'Unnamed Exam'}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>

            {/* Results Section */}
            {selectedClassId && selectedExamId ? (
              <View style={styles.listContainer}>
                {loading ? (
                  <ActivityIndicator size="small" color="#003fb1" style={{ marginVertical: 20 }} />
                ) : results.length === 0 ? (
                  <Text style={styles.emptyText}>No subjects found for this class.</Text>
                ) : (
                  <View>
                    <Text style={styles.listHeaderTitle}>Subject Marking Status</Text>
                    {results.map((sub: any) => (
                      <View key={sub.subject_id || sub.id || Math.random()} style={styles.studentCard}>
                        <View style={styles.subjectRow}>
                          <View>
                            <Text style={styles.subjectName}>{sub.subject_name || sub.name || 'Unknown Subject'}</Text>
                            <Text style={styles.teacherName}>Teacher: {sub.teacher_name || 'Unassigned'}</Text>
                          </View>
                          {sub.submission_status === 'submitted' ? (
                            <View style={[styles.unmarkedBadge, { backgroundColor: '#82f5c1' }]}>
                              <Text style={[styles.unmarkedText, { color: '#005137' }]}>Submitted</Text>
                            </View>
                          ) : (
                            <View style={styles.unmarkedBadge}>
                              <Text style={styles.unmarkedText}>Pending</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>Please select both a class and an exam to view the result sheet.</Text>
              </View>
            )}

          </>
        )}
      </ScrollView>

      {/* Publish Footer */}
      {selectedClassId && selectedExamId && !loading && results.length > 0 && (
        <View style={styles.footer}>
          {!allMarksEntered && (
            <Text style={styles.footerWarning}>
              Publishing is disabled. Some subjects are still unmarked by teachers.
            </Text>
          )}
          <TouchableOpacity
            style={[styles.publishBtn, !allMarksEntered && styles.publishBtnDisabled]}
            disabled={!allMarksEntered || publishing}
            onPress={handlePublish}
            activeOpacity={0.8}
          >
            {publishing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.publishBtnText}>Publish Results to Parents</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#eef0f6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#121c28',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#737686',
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  filterSection: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#121c28',
    marginBottom: 8,
  },
  chipsContainer: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#dfe9fa',
  },
  chipActive: {
    backgroundColor: '#003fb1',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#434654',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  placeholderText: {
    fontSize: 13,
    color: '#737686',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#737686',
    fontStyle: 'italic',
  },
  listContainer: {
    marginBottom: 20,
  },
  listHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#121c28',
    marginBottom: 16,
  },
  studentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eef0f6',
    padding: 16,
    marginBottom: 12,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f8',
    paddingBottom: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eef0f6',
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121c28',
    marginLeft: 10,
  },
  subjectsContainer: {
    gap: 8,
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#121c28',
    marginBottom: 4,
  },
  teacherName: {
    fontSize: 12,
    color: '#737686',
  },
  markedText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#005137',
  },
  unmarkedBadge: {
    backgroundColor: '#ffdad6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  unmarkedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ba1a1a',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#eef0f6',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24, // extra padding for iOS home indicator
  },
  footerWarning: {
    fontSize: 11,
    color: '#ba1a1a',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  publishBtn: {
    backgroundColor: '#003fb1',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishBtnDisabled: {
    backgroundColor: '#c3c5d7',
  },
  publishBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default AdminResultsOverviewScreen;
