import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import apiClient from '../../api/client';
import { Student } from '../../types/users';
import { UsersStackParamList } from '../../navigation/features/UsersNavigator';

type NavProp = StackNavigationProp<UsersStackParamList, 'UserList'>;

const UserListScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [students, setStudents] = useState<Student[]>([]);
  const [filtered, setFiltered] = useState<Student[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get('/academic/students')
      .then((res) => {
        const data = res.data as { data?: Student[] } | Student[];
        const list = Array.isArray(data) ? data : (data as { data?: Student[] }).data ?? [];
        setStudents(list);
        setFiltered(list);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const search = (q: string) => {
    setQuery(q);
    const lower = q.toLowerCase();
    setFiltered(
      students.filter(
        (s) => s.name.toLowerCase().includes(lower) || s.rollNumber.toLowerCase().includes(lower),
      ),
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#01579b" />
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
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by name or roll number..."
        value={query}
        onChangeText={search}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No students found.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('StudentProfile', { studentId: item.id })}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>Roll: {item.rollNumber}</Text>
            </View>
            <Text style={styles.classInfo}>
              {item.className ?? ''}
              {item.section ? ` - ${item.section}` : ''}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchInput: {
    margin: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  cardLeft: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  meta: { fontSize: 12, color: '#888', marginTop: 2 },
  classInfo: { fontSize: 13, color: '#01579b', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  error: { color: 'red', fontSize: 14 },
});

export default UserListScreen;
