import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import apiClient from '../../api/client';

export default function StudentAttendanceScreen() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await apiClient.get('/attendance/my-attendance');
        setAttendance(response.data);
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    };
    fetchAttendance();
  }, []);

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={attendance}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
            <Text style={[styles.status, { color: item.status === 'Present' ? 'green' : 'red' }]}>
              {item.status}
            </Text>
            {item.remarks && <Text>Remarks: {item.remarks}</Text>}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No attendance records found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  loader: { flex: 1, justifyContent: 'center' },
  card: { padding: 16, backgroundColor: 'white', marginBottom: 12, borderRadius: 8, elevation: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 16, fontWeight: 'bold' },
  status: { fontSize: 16, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 24, fontSize: 16, color: '#666' }
});
