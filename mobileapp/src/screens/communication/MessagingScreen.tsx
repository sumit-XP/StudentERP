import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import apiClient from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

export default function MessagingScreen({ route }: any) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');

  // Default receiver for demo if none passed in route params
  const receiverId = route?.params?.otherUserId || 'demo-receiver-uuid';

  const fetchMessages = async () => {
    try {
      const response = await apiClient.get(`/api/communication/messages?otherUserId=${receiverId}`);
      setMessages(response.data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
  }, [receiverId]);

  const handleSend = async () => {
    if (!messageText.trim()) return;
    try {
      await apiClient.post('/api/communication/messages', { receiverId, messageText });
      setMessageText('');
      fetchMessages();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id || Math.random().toString()}
        renderItem={({ item }) => {
          const isMe = item.senderId === user?.id;
          return (
            <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
              <Text style={isMe ? styles.myMessageText : styles.theirMessageText}>{item.messageText}</Text>
            </View>
          );
        }}
        inverted={false}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={messageText}
          onChangeText={setMessageText}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loader: { flex: 1, justifyContent: 'center' },
  messageBubble: { padding: 12, marginVertical: 4, marginHorizontal: 16, borderRadius: 16, maxWidth: '80%' },
  myMessage: { backgroundColor: '#6200ea', alignSelf: 'flex-end' },
  theirMessage: { backgroundColor: '#e0e0e0', alignSelf: 'flex-start' },
  myMessageText: { color: 'white' },
  theirMessageText: { color: 'black' },
  inputContainer: { flexDirection: 'row', padding: 16, backgroundColor: 'white', borderTopWidth: 1, borderColor: '#ddd' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8 },
  sendButton: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#6200ea', borderRadius: 20, paddingHorizontal: 16 },
  sendButtonText: { color: 'white', fontWeight: 'bold' }
});
