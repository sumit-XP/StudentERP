import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import apiClient from '../../api/client';

export default function StudentScheduleScreen() {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        // Hardcoded class ID as per instructions
        const response = await apiClient.get(`/academic/classes/class-123`);
        // Assuming response.data.schedule or response.data contains the schedule array
        setSchedule(response.data.schedule || []);
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    };
    fetchSchedule();
  }, []);

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={schedule}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.subject}</Text>
            <Text>Time: {item.startTime} - {item.endTime}</Text>
            <Text>Teacher: {item.teacherName}</Text>
            <Text>Room: {item.room}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No schedule found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  loader: { flex: 1, justifyContent: 'center' },
  card: { padding: 16, backgroundColor: 'white', marginBottom: 12, borderRadius: 8, elevation: 2 },
  title: { fontSize: 18, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 24, fontSize: 16, color: '#666' }
});
