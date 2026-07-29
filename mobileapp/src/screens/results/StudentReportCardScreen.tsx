import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import apiClient from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentReportCardScreen() {
  const { user } = useAuth();
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const response = await apiClient.get(`/academic/students/${user?.id}/grades`);
        setGrades(response.data);
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    };
    if (user?.id) {
      fetchGrades();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={grades}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.subject}>{item.subjectName || item.subject}</Text>
            <View style={styles.gradeRow}>
              <Text>Grade: <Text style={styles.bold}>{item.grade}</Text></Text>
              <Text>Score: <Text style={styles.bold}>{item.score}</Text></Text>
            </View>
            {item.remarks && <Text style={styles.remarks}>Remarks: {item.remarks}</Text>}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No grades available.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  loader: { flex: 1, justifyContent: 'center' },
  card: { padding: 16, backgroundColor: 'white', marginBottom: 12, borderRadius: 8, elevation: 2 },
  subject: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  gradeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  bold: { fontWeight: 'bold' },
  remarks: { fontStyle: 'italic', color: '#555', marginTop: 4 },
  emptyText: { textAlign: 'center', marginTop: 24, fontSize: 16, color: '#666' }
});
