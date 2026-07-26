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
import communicationService from '../../services/communicationService';
import { Conversation } from '../../types/communication';
import { CommunicationStackParamList } from '../../navigation/features/CommunicationNavigator';

type NavProp = StackNavigationProp<CommunicationStackParamList, 'MessagesList'>;

const MessagesListScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    communicationService
      .getConversations()
      .then((data) => {
        setConversations(Array.isArray(data) ? data : data ?? []);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

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
      data={conversations}
      keyExtractor={(item) => item.recipientId}
      ListEmptyComponent={<Text style={styles.empty}>No conversations yet.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.row}
          onPress={() =>
            navigation.navigate('Chat', {
              recipientId: item.recipientId,
              recipientName: item.recipientName,
            })
          }
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.recipientName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.rowContent}>
            <View style={styles.rowTop}>
              <Text style={styles.recipientName}>{item.recipientName}</Text>
              <Text style={styles.time}>{item.lastMessageAt}</Text>
            </View>
            <Text style={styles.lastMsg} numberOfLines={1}>
              {item.lastMessage}
            </Text>
          </View>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e1bee7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#6a1b9a' },
  rowContent: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  recipientName: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  time: { fontSize: 11, color: '#999' },
  lastMsg: { fontSize: 13, color: '#666' },
  unreadBadge: {
    backgroundColor: '#6a1b9a',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  error: { color: 'red', fontSize: 14 },
});

export default MessagesListScreen;
