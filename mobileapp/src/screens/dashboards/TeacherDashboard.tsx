import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import apiClient from '../../api/client';

interface DashboardMetric {
  label: string;
  value: string | number;
}

const TeacherDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get('/analytics/dashboard')
      .then((res) => {
        const data = res.data as Record<string, unknown>;
        const mapped: DashboardMetric[] = Object.entries(data).map(([k, v]) => ({
          label: k,
          value: typeof v === 'object' ? JSON.stringify(v) : String(v),
        }));
        setMetrics(mapped);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00796b" />
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Teacher Dashboard</Text>
      {metrics.map((m, i) => (
        <View key={i} style={styles.card}>
          <Text style={styles.cardLabel}>{m.label}</Text>
          <Text style={styles.cardValue}>{m.value}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16, color: '#1a1a1a' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardLabel: { fontSize: 13, color: '#666', textTransform: 'capitalize' },
  cardValue: { fontSize: 20, fontWeight: '600', color: '#00796b', marginTop: 4 },
  error: { color: 'red', fontSize: 14 },
});

export default TeacherDashboard;
