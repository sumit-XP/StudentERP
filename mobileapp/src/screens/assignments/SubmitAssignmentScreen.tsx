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

type RoutePropType = RouteProp<AssignmentsStackParamList, 'SubmitAssignment'>;

const SubmitAssignmentScreen: React.FC = () => {
  const route = useRoute<RoutePropType>();
  const { assignmentId } = route.params;
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await assignmentService.submitAssignment(assignmentId, notes);
      Alert.alert('Success', 'Assignment submitted successfully!');
      setNotes('');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Submit Assignment</Text>
      <Text style={styles.label}>Notes / Comments</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Add any notes for your teacher..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
      />
      <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Submit</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 14,
    minHeight: 120,
    marginBottom: 20,
  },
  btn: { backgroundColor: '#3949ab', borderRadius: 8, padding: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default SubmitAssignmentScreen;
