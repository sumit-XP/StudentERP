import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import communicationService from '../../services/communicationService';
import { useAuth } from '../../contexts/AuthContext';
import { Message } from '../../types/communication';
import { CommunicationStackParamList } from '../../navigation/features/CommunicationNavigator';

type RoutePropType = RouteProp<CommunicationStackParamList, 'Chat'>;

const ChatScreen: React.FC = () => {
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation();
  const { recipientId, recipientName } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    navigation.setOptions({
      title: recipientName || 'Chat',
    });
  }, [navigation, recipientName]);

  const fetchMessages = () => {
    communicationService
      .getMessages(recipientId)
      .then((data) => {
        setMessages(Array.isArray(data) ? data : data ?? []);
      })
      .catch((e: Error) => Alert.alert('Error', e.message));
  };

  useEffect(() => {
    fetchMessages();
  }, [recipientId]);

  const send = async () => {
    if (!text.trim()) {
      return;
    }
    const messageToSend = text.trim();
    setSending(true);
    try {
      const res = await communicationService.sendMessage(recipientId, messageToSend);
      const newMsg: Message = {
        id: res?.id ? String(res.id) : String(Date.now()),
        senderId: user?.id ? String(user.id) : '',
        sender_id: user?.id ? String(user.id) : '',
        recipientId,
        receiver_id: recipientId,
        content: messageToSend,
        message_text: messageToSend,
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString(),
        is_mine: true,
      };
      setMessages((prev) => [...prev, newMsg]);
      setText('');
      // Sync messages with backend
      setTimeout(() => {
        communicationService
          .getMessages(recipientId)
          .then((data) => {
            if (Array.isArray(data)) {
              setMessages(data);
            }
          })
          .catch(() => {});
      }, 500);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item, index) => String(item.id || index)}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No messages yet. Say hello!</Text>}
        renderItem={({ item }) => {
          const isMine =
            item.is_mine !== undefined
              ? Boolean(item.is_mine)
              : String(item.senderId || item.sender_id) === String(user?.id);
          const messageContent = item.content || item.message_text || '';
          const rawTime = item.createdAt || item.created_at;
          const timeStr = rawTime
            ? new Date(rawTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';

          return (
            <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
              <Text
                style={[
                  styles.bubbleText,
                  isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs,
                ]}
              >
                {messageContent}
              </Text>
              {!!timeStr && (
                <Text
                  style={[
                    styles.timeText,
                    isMine ? styles.timeTextMine : styles.timeTextTheirs,
                  ]}
                >
                  {timeStr}
                </Text>
              )}
            </View>
          );
        }}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#888"
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={send} disabled={sending}>
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff' },
  list: { padding: 16 },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  bubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: '#6200ea',
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMine: { color: '#ffffff' },
  bubbleTextTheirs: { color: '#121c28' },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeTextMine: { color: 'rgba(255, 255, 255, 0.7)' },
  timeTextTheirs: { color: '#737686' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f0f2f8',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e2ec',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    backgroundColor: '#f8f9ff',
    color: '#121c28',
  },
  sendBtn: {
    backgroundColor: '#6200ea',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  empty: { textAlign: 'center', color: '#737686', marginTop: 40, fontSize: 13 },
});

export default ChatScreen;
