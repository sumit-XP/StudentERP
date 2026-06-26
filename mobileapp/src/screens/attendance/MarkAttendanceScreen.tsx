import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import apiClient from '../../api/client';

type AttendanceStatus = 'present' | 'absent' | 'late';

interface StudentRecord {
  studentId: string;
  name: string;
  status: AttendanceStatus;
}

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: '#2e7d32',
  absent: '#c62828',
  late: '#ef6c00',
};

const MarkAttendanceScreen: React.FC = () => {
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleStatus = (id: string, status: AttendanceStatus) => {
    setRecords((prev) => prev.map((r) => (r.studentId === id ? { ...r, status } : r)));
  };

  const addDemoStudent = () => {
    const id = String(Date.now());
    setRecords((prev) => [
      ...prev,
      { studentId: id, name: `Student ${prev.length + 1}`, status: 'present' },
    ]);
  };

  const submit = async () => {
    if (!classId) {
      Alert.alert('Error', 'Enter a class ID');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/attendance/mark', { classId, date, records });
      Alert.alert('Success', 'Attendance marked');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Mark Attendance</Text>
      <TextInput
        style={styles.input}
        placeholder="Class ID"
        value={classId}
        onChangeText={setClassId}
      />
      <TextInput
        style={styles.input}
        placeholder="Date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
      />
      <TouchableOpacity style={styles.addBtn} onPress={addDemoStudent}>
        <Text style={styles.addBtnText}>+ Add Student Row</Text>
      </TouchableOpacity>
      {records.map((r) => (
        <View key={r.studentId} style={styles.row}>
          <Text style={styles.studentName}>{r.name}</Text>
          {(['present', 'absent', 'late'] as AttendanceStatus[]).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.statusBtn, r.status === s && { backgroundColor: STATUS_COLORS[s] }]}
              onPress={() => toggleStatus(r.studentId, s)}
            >
              <Text style={[styles.statusBtnText, r.status === s && styles.statusBtnTextActive]}>
                {s[0].toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
      <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Submit</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f5f5f5' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16, color: '#1a1a1a' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 14,
  },
  addBtn: {
    backgroundColor: '#e8eaf6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  addBtnText: { color: '#3949ab', fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
  },
  studentName: { flex: 1, fontSize: 14, color: '#333' },
  statusBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  statusBtnText: { fontSize: 12, fontWeight: '700', color: '#666' },
  statusBtnTextActive: { color: '#fff' },
  submitBtn: {
    backgroundColor: '#3949ab',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default MarkAttendanceScreen;
