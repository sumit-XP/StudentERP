import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import apiClient from '../../api/client';

interface AttendanceRecord {
  id: string;
  date: string;
  subject?: string;
  status: 'present' | 'absent' | 'late';
}

const STATUS_COLORS = {
  present: '#2e7d32',
  absent: '#c62828',
  late: '#ef6c00',
};

const AttendanceHistoryScreen: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get('/attendance/my-attendance')
      .then((res) => {
        const data = res.data as { data?: AttendanceRecord[] } | AttendanceRecord[];
        setRecords(Array.isArray(data) ? data : (data as { data?: AttendanceRecord[] }).data ?? []);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1565c0" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={records}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={<Text style={styles.empty}>No attendance records found.</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardLeft}>
            <Text style={styles.date}>{item.date}</Text>
            {item.subject && <Text style={styles.subject}>{item.subject}</Text>}
          </View>
          <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] ?? '#999' }]}>
            <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  cardLeft: { flex: 1 },
  date: { fontSize: 14, fontWeight: '600', color: '#333' },
  subject: { fontSize: 12, color: '#666', marginTop: 2 },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  error: { color: 'red', fontSize: 14 },
});

export default AttendanceHistoryScreen;
