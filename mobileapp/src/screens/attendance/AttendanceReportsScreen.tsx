import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import attendanceService from '../../services/attendanceService';

interface ReportRow {
  studentId: string;
  studentName: string;
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

const AttendanceReportsScreen: React.FC = () => {
  const [classId, setClassId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!classId || !startDate || !endDate) {
      Alert.alert('Error', 'Fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const data = await attendanceService.getAttendanceReport({ classId, startDate, endDate });
      setRows(Array.isArray(data) ? data : data ?? []);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance Reports</Text>
      <TextInput
        style={styles.input}
        placeholder="Class ID"
        value={classId}
        onChangeText={setClassId}
      />
      <TextInput
        style={styles.input}
        placeholder="Start Date (YYYY-MM-DD)"
        value={startDate}
        onChangeText={setStartDate}
      />
      <TextInput
        style={styles.input}
        placeholder="End Date (YYYY-MM-DD)"
        value={endDate}
        onChangeText={setEndDate}
      />
      <TouchableOpacity style={styles.btn} onPress={generate} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Generate Report</Text>
        )}
      </TouchableOpacity>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.studentId}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>No data. Generate a report.</Text> : null
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>{item.studentName}</Text>
            <Text style={styles.stats}>
              P: {item.present} A: {item.absent} L: {item.late} — {item.percentage}%
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16, color: '#1a1a1a' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 14,
  },
  btn: {
    backgroundColor: '#00796b',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  row: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
  },
  name: { fontSize: 14, fontWeight: '600', color: '#333' },
  stats: { fontSize: 12, color: '#555', marginTop: 4 },
  empty: { textAlign: 'center', color: '#999', marginTop: 32 },
});

export default AttendanceReportsScreen;
