import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import assignmentService from '../../services/assignmentService';
import { AssignmentsStackParamList } from '../../navigation/features/AssignmentsNavigator';

type RoutePropType = RouteProp<AssignmentsStackParamList, 'GradeSubmission'>;

const GradeSubmissionScreen: React.FC = () => {
  const route = useRoute<RoutePropType>();
  const { submissionId } = route.params;
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const marksNum = parseFloat(marks);
    if (isNaN(marksNum)) {
      Alert.alert('Error', 'Enter a valid numeric mark');
      return;
    }
    setSaving(true);
    try {
      await assignmentService.gradeSubmission(submissionId, marksNum.toString(), feedback);
      Alert.alert('Success', 'Grade saved!');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save grade');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Grade Submission</Text>
      <Text style={styles.label}>Marks</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter marks"
        value={marks}
        onChangeText={setMarks}
        keyboardType="numeric"
      />
      <Text style={styles.label}>Feedback</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Provide feedback to the student..."
        value={feedback}
        onChangeText={setFeedback}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />
      <TouchableOpacity style={styles.btn} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Save Grade</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 14,
    marginBottom: 16,
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 14,
    minHeight: 100,
    marginBottom: 20,
  },
  btn: { backgroundColor: '#00796b', borderRadius: 8, padding: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default GradeSubmissionScreen;
