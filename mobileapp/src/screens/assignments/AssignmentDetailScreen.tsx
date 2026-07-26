import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import assignmentService from '../../services/assignmentService';
import { useAuth } from '../../contexts/AuthContext';
import { Assignment } from '../../types/assignments';
import { AssignmentsStackParamList } from '../../navigation/features/AssignmentsNavigator';

type NavProp = StackNavigationProp<AssignmentsStackParamList, 'AssignmentDetail'>;
type RoutePropType = RouteProp<AssignmentsStackParamList, 'AssignmentDetail'>;

const AssignmentDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { assignmentId } = route.params;
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    assignmentService
      .getAssignmentDetails(assignmentId)
      .then((data) => {
        setAssignment(data);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3949ab" />
      </View>
    );
  }
  if (error || !assignment) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? 'Not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{assignment.title}</Text>
      <Text style={styles.meta}>Subject: {assignment.subject}</Text>
      <Text style={styles.meta}>Due: {assignment.dueDate}</Text>
      <Text style={styles.meta}>Max Marks: {assignment.maxMarks}</Text>
      {assignment.description && <Text style={styles.description}>{assignment.description}</Text>}
      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate('SubmitAssignment', { assignmentId: assignment.id })}
      >
        <Text style={styles.btnText}>Submit Assignment</Text>
      </TouchableOpacity>
      {(user?.role === 'teacher' || user?.role === 'admin') && (
        <TouchableOpacity
          style={[styles.btn, styles.gradeBtn]}
          onPress={() => navigation.navigate('GradeSubmission', { submissionId: assignment.id })}
        >
          <Text style={styles.btnText}>Grade Submissions</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 },
  meta: { fontSize: 14, color: '#555', marginBottom: 6 },
  description: { fontSize: 14, color: '#333', marginTop: 12, lineHeight: 22 },
  btn: {
    backgroundColor: '#3949ab',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  gradeBtn: { backgroundColor: '#00796b', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  error: { color: 'red', fontSize: 14 },
});

export default AssignmentDetailScreen;
