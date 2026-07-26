import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import communicationService from '../../services/communicationService';
import { Announcement } from '../../types/communication';

const AnnouncementsScreen: React.FC = () => {
  const [items, setItems] = useState<Announcement[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    communicationService
      .getAnnouncements()
      .then((data) => {
        setItems(Array.isArray(data) ? data : data ?? []);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6a1b9a" />
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
      data={items}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={<Text style={styles.empty}>No announcements.</Text>}
      renderItem={({ item }) => {
        const isExpanded = expanded.has(item.id);
        return (
          <TouchableOpacity style={styles.card} onPress={() => toggleExpand(item.id)}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View style={styles.audienceBadge}>
                <Text style={styles.audienceText}>{item.targetAudience}</Text>
              </View>
            </View>
            <Text style={styles.meta}>
              {item.createdByName ? `By ${item.createdByName} · ` : ''}
              {item.createdAt}
            </Text>
            <Text style={styles.preview} numberOfLines={isExpanded ? undefined : 2}>
              {item.content}
            </Text>
            <Text style={styles.toggle}>{isExpanded ? 'Show less ▲' : 'Read more ▼'}</Text>
          </TouchableOpacity>
        );
      }}
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', flex: 1, marginRight: 8 },
  audienceBadge: {
    backgroundColor: '#e1bee7',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  audienceText: { fontSize: 10, color: '#6a1b9a', fontWeight: '700' },
  meta: { fontSize: 11, color: '#999', marginBottom: 6 },
  preview: { fontSize: 14, color: '#333', lineHeight: 20 },
  toggle: { fontSize: 12, color: '#6a1b9a', marginTop: 8, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  error: { color: 'red', fontSize: 14 },
});

export default AnnouncementsScreen;
