import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import apiClient from '../../api/client';
import { PTMMeeting } from '../../types/communication';

const PTMScreen: React.FC = () => {
  const [meetings, setMeetings] = useState<PTMMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMeetings = () => {
    setLoading(true);
    apiClient
      .get('/parent-teacher/ptm/upcoming')
      .then((res) => {
        const data = res.data as { data?: PTMMeeting[] } | PTMMeeting[];
        setMeetings(Array.isArray(data) ? data : (data as { data?: PTMMeeting[] }).data ?? []);
      })
      .catch((e: Error) => Alert.alert('Error', e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const schedule = async () => {
    if (!teacherId || !scheduledAt || !purpose) {
      Alert.alert('Error', 'Fill in all fields');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/parent-teacher/ptm/schedule', { teacherId, scheduledAt, purpose });
      Alert.alert('Success', 'Meeting scheduled!');
      setTeacherId('');
      setScheduledAt('');
      setPurpose('');
      fetchMeetings();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Schedule a Meeting</Text>
      <TextInput
        style={styles.input}
        placeholder="Teacher ID"
        value={teacherId}
        onChangeText={setTeacherId}
      />
      <TextInput
        style={styles.input}
        placeholder="Date & Time (e.g. 2026-07-01T10:00)"
        value={scheduledAt}
        onChangeText={setScheduledAt}
      />
      <TextInput
        style={styles.input}
        placeholder="Purpose"
        value={purpose}
        onChangeText={setPurpose}
      />
      <TouchableOpacity style={styles.btn} onPress={schedule} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Schedule Meeting</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Upcoming Meetings</Text>
      {loading ? (
        <ActivityIndicator color="#6a1b9a" style={styles.loader} />
      ) : (
        <FlatList
          data={meetings}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ListEmptyComponent={<Text style={styles.empty}>No upcoming meetings.</Text>}
          renderItem={({ item }) => (
            <View style={styles.meetingCard}>
              <Text style={styles.meetingTitle}>
                {item.teacherName ?? `Teacher ${item.teacherId}`}
              </Text>
              <Text style={styles.meetingMeta}>{`\u{1F550} ${item.scheduledAt}`}</Text>
              <Text style={styles.meetingMeta}>{`\u{1F4CB} ${item.purpose}`}</Text>
              <Text style={styles.meetingStatus}>Status: {item.status}</Text>
            </View>
          )}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f5f5f5' },
  heading: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 16 },
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
    backgroundColor: '#6a1b9a',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 },
  loader: { marginTop: 20 },
  meetingCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  meetingTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 6 },
  meetingMeta: { fontSize: 13, color: '#555', marginBottom: 3 },
  meetingStatus: { fontSize: 12, color: '#888', marginTop: 4 },
  empty: { textAlign: 'center', color: '#999', marginTop: 20 },
});

export default PTMScreen;
