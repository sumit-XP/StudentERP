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
import { useRoute, RouteProp } from '@react-navigation/native';
import communicationService from '../../services/communicationService';
import { useAuth } from '../../contexts/AuthContext';
import { Message } from '../../types/communication';
import { CommunicationStackParamList } from '../../navigation/features/CommunicationNavigator';

type RoutePropType = RouteProp<CommunicationStackParamList, 'Chat'>;

const ChatScreen: React.FC = () => {
  const route = useRoute<RoutePropType>();
  const { recipientId } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    // Note: getMessages doesn't take params in the current service implementation, but we might want to update the service to pass it.
    // Assuming backend returns messages based on user/recipient logic, or we'll update the service in a real scenario
    communicationService
      .getMessages()
      .then((data) => {
        setMessages(Array.isArray(data) ? data : data ?? []);
      })
      .catch((e: Error) => Alert.alert('Error', e.message));
  }, [recipientId]);

  const send = async () => {
    if (!text.trim()) {
      return;
    }
    setSending(true);
    try {
      await communicationService.sendMessage(recipientId, text);
      const newMsg: Message = {
        id: String(Date.now()),
        senderId: user?.id ?? '',
        recipientId,
        content: text,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newMsg]);
      setText('');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to send');
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
        keyExtractor={(item) => item.id}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No messages yet. Say hello!</Text>}
        renderItem={({ item }) => {
          const isMine = item.senderId === user?.id;
          return (
            <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
              <Text
                style={[
                  styles.bubbleText,
                  isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs,
                ]}
              >
                {item.content}
              </Text>
            </View>
          );
        }}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  list: { padding: 12 },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 10,
    marginBottom: 8,
  },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: '#6a1b9a' },
  bubbleTheirs: { alignSelf: 'flex-start', backgroundColor: '#fff', elevation: 1 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMine: { color: '#fff' },
  bubbleTextTheirs: { color: '#1a1a1a' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
    backgroundColor: '#f9f9f9',
  },
  sendBtn: {
    backgroundColor: '#6a1b9a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginLeft: 8,
  },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
});

export default ChatScreen;
