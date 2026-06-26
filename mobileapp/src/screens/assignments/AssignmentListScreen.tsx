import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import apiClient from '../../api/client';
import { Assignment } from '../../types/assignments';
import { AssignmentsStackParamList } from '../../navigation/features/AssignmentsNavigator';

type NavProp = StackNavigationProp<AssignmentsStackParamList, 'AssignmentList'>;

const STATUS_COLORS: Record<string, string> = {
  submitted: '#1565c0',
  graded: '#2e7d32',
  late: '#c62828',
  pending: '#ef6c00',
};

const AssignmentListScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get('/assignments')
      .then((res) => {
        const data = res.data as { data?: Assignment[] } | Assignment[];
        setAssignments(Array.isArray(data) ? data : (data as { data?: Assignment[] }).data ?? []);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3949ab" />
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
      data={assignments}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={<Text style={styles.empty}>No assignments found.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('AssignmentDetail', { assignmentId: item.id })}
        >
          <View style={styles.cardTop}>
            <Text style={styles.title}>{item.title}</Text>
            {item.status && (
              <View
                style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] ?? '#999' }]}
              >
                <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
              </View>
            )}
          </View>
          <Text style={styles.subject}>{item.subject}</Text>
          <Text style={styles.due}>Due: {item.dueDate}</Text>
        </TouchableOpacity>
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
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', flex: 1 },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  badgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  subject: { fontSize: 13, color: '#555', marginBottom: 2 },
  due: { fontSize: 12, color: '#888' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  error: { color: 'red', fontSize: 14 },
});

export default AssignmentListScreen;
