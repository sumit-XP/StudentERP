import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import apiClient from '../../api/client';
import { Guardian, StudentDocument } from '../../types/users';
import { UsersStackParamList } from '../../navigation/features/UsersNavigator';

type RoutePropType = RouteProp<UsersStackParamList, 'StudentProfile'>;

const StudentProfileScreen: React.FC = () => {
  const route = useRoute<RoutePropType>();
  const { studentId } = route.params;
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get(`/academic/students/${studentId}/guardians`),
      apiClient.get(`/academic/students/${studentId}/documents`),
    ])
      .then(([guardRes, docRes]) => {
        const gData = guardRes.data as { data?: Guardian[] } | Guardian[];
        setGuardians(Array.isArray(gData) ? gData : (gData as { data?: Guardian[] }).data ?? []);
        const dData = docRes.data as { data?: StudentDocument[] } | StudentDocument[];
        setDocuments(
          Array.isArray(dData) ? dData : (dData as { data?: StudentDocument[] }).data ?? [],
        );
      })
      .catch((e: Error) => Alert.alert('Error', e.message))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#01579b" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Guardians</Text>
      {guardians.length === 0 && <Text style={styles.empty}>No guardians on record.</Text>}
      {guardians.map((g) => (
        <View key={g.id} style={styles.card}>
          <Text style={styles.name}>{g.name}</Text>
          <Text style={styles.meta}>{g.relationship}</Text>
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${g.phone}`)}>
            <Text style={styles.phone}>{`\u{1F4DE} ${g.phone}`}</Text>
          </TouchableOpacity>
          {g.email ? <Text style={styles.meta}>{`\u2709\uFE0F ${g.email}`}</Text> : null}
        </View>
      ))}

      <Text style={styles.sectionTitle}>Documents</Text>
      {documents.length === 0 && <Text style={styles.empty}>No documents uploaded.</Text>}
      {documents.map((d) => (
        <View key={d.id} style={styles.docCard}>
          <Text style={styles.docType}>{d.documentType}</Text>
          <Text style={styles.meta}>Uploaded: {d.uploadedAt}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#01579b',
    marginBottom: 10,
    marginTop: 10,
  },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 10, elevation: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  meta: { fontSize: 13, color: '#666', marginTop: 4 },
  phone: { fontSize: 14, color: '#01579b', fontWeight: '600', marginTop: 6 },
  docCard: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8, elevation: 1 },
  docType: { fontSize: 14, fontWeight: '600', color: '#333' },
  empty: { color: '#999', fontSize: 13, marginBottom: 12 },
});

export default StudentProfileScreen;
