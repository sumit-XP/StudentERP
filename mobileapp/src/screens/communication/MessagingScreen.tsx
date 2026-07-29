import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import communicationService from '../../services/communicationService';
import { useAuth } from '../../contexts/AuthContext';
import { SearchIcon, SendIcon, MessageIcon, PlusIcon, CloseIcon } from '../../assets/svgs';

export default function MessagingScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Conversation Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalRecipients, setModalRecipients] = useState<any[]>([]);
  const [modalSearch, setModalSearch] = useState('');
  const [roleTab, setRoleTab] = useState<'all' | 'teacher' | 'parent'>('all');
  const [loadingModal, setLoadingModal] = useState(false);

  const canStartNewChat = true; // Enabled for teachers, admins, parents, staff

  const loadData = async () => {
    try {
      const convs = await communicationService.getConversations();
      setConversations(Array.isArray(convs) ? convs : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (modalVisible) {
      fetchModalRecipients();
    }
  }, [modalVisible, modalSearch, roleTab]);

  const fetchModalRecipients = async () => {
    setLoadingModal(true);
    try {
      const users = await communicationService.getRecipients(
        modalSearch.trim(),
        roleTab === 'all' ? undefined : roleTab,
        100
      );
      setModalRecipients(Array.isArray(users) ? users : []);
    } catch (e) {
      console.error('Error fetching modal recipients:', e);
      setModalRecipients([]);
    } finally {
      setLoadingModal(false);
    }
  };

  const handleSearch = async (text: string) => {
    setSearch(text);
    if (!text.trim()) {
      setRecipients([]);
      return;
    }
    try {
      const users = await communicationService.getRecipients(text.trim());
      setRecipients(Array.isArray(users) ? users : []);
    } catch {
      setRecipients([]);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#6200ea" />
      </SafeAreaView>
    );
  }

  const isSearching = search.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages & Chat</Text>
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#737686" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search teachers, staff, or parents..."
            placeholderTextColor="#737686"
            value={search}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {isSearching ? (
        /* Search Recipients List */
        <FlatList
          data={recipients}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listPadding}
          ListHeaderComponent={
            <Text style={styles.sectionHeader}>SEARCH RESULTS</Text>
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No users matching "{search}"</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.conversationCard}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate('Chat', {
                  recipientId: String(item.id),
                  recipientName: item.name || item.email,
                })
              }
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(item.name || item.email || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.recipientName}>{item.name || item.email}</Text>
                <Text style={styles.roleTag}>{(item.role_name || item.role || 'USER').toUpperCase()}</Text>
              </View>
              <SendIcon size={18} color="#6200ea" />
            </TouchableOpacity>
          )}
        />
      ) : (
        /* Conversations List */
        <FlatList
          data={conversations}
          keyExtractor={(item, index) => String(item.other_user_id || index)}
          contentContainerStyle={styles.listPadding}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MessageIcon size={44} color="#c3c5d7" />
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptyText}>
                Use the '+' button below or the search bar above to start a new conversation.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.conversationCard}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate('Chat', {
                  recipientId: String(item.other_user_id),
                  recipientName: item.other_user_name,
                })
              }
            >
              <View style={[styles.avatar, item.is_group && styles.groupAvatar]}>
                <Text style={[styles.avatarText, item.is_group && styles.groupAvatarText]}>
                  {(item.other_user_name || 'C').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.recipientName} numberOfLines={1}>
                    {item.other_user_name}
                  </Text>
                  {item.last_message_time ? (
                    <Text style={styles.timeText}>
                      {new Date(item.last_message_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.lastMsgText} numberOfLines={1}>
                  {item.last_message || 'Tap to chat'}
                </Text>
              </View>
              {item.unread_count > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.unread_count}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}

      {/* Floating Action Button (FAB) */}
      {canStartNewChat && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => {
            setModalSearch('');
            setRoleTab('all');
            setModalVisible(true);
          }}
        >
          <PlusIcon size={26} color="#ffffff" />
        </TouchableOpacity>
      )}

      {/* New Conversation Picker Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Conversation</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <CloseIcon size={22} color="#121c28" />
              </TouchableOpacity>
            </View>

            {/* Role Filter Tabs */}
            <View style={styles.roleTabsContainer}>
              {(['all', 'teacher', 'parent'] as const).map((tab) => {
                const isActive = roleTab === tab;
                const label = tab === 'all' ? 'All Users' : tab === 'teacher' ? 'Teachers' : 'Parents';
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.roleTab, isActive && styles.roleTabActive]}
                    onPress={() => setRoleTab(tab)}
                  >
                    <Text style={[styles.roleTabText, isActive && styles.roleTabTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Modal Search Bar */}
            <View style={styles.modalSearchWrapper}>
              <View style={styles.searchBar}>
                <SearchIcon size={18} color="#737686" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name or email..."
                  placeholderTextColor="#737686"
                  value={modalSearch}
                  onChangeText={setModalSearch}
                />
              </View>
            </View>

            {/* Modal Recipients List */}
            {loadingModal ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#6200ea" />
              </View>
            ) : (
              <FlatList
                data={modalRecipients}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.listPadding}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    No recipients found {modalSearch ? `matching "${modalSearch}"` : ''}
                  </Text>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.conversationCard}
                    activeOpacity={0.7}
                    onPress={() => {
                      setModalVisible(false);
                      navigation.navigate('Chat', {
                        recipientId: String(item.id),
                        recipientName: item.name || item.email,
                      });
                    }}
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {(item.name || item.email || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.recipientName}>{item.name || item.email}</Text>
                      <Text style={styles.roleTag}>
                        {(item.role_name || item.role || 'USER').toUpperCase()}
                      </Text>
                    </View>
                    <SendIcon size={18} color="#6200ea" />
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f8',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#121c28', marginBottom: 10 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13, color: '#121c28' },
  listPadding: { padding: 16 },
  sectionHeader: { fontSize: 11, fontWeight: '800', color: '#737686', marginBottom: 10 },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ede7f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#6200ea' },
  groupAvatar: { backgroundColor: '#e3f2fd' },
  groupAvatarText: { color: '#1565c0' },
  cardContent: { flex: 1, marginRight: 8 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recipientName: { fontSize: 14, fontWeight: '700', color: '#121c28', flex: 1, marginRight: 8 },
  timeText: { fontSize: 10, color: '#737686' },
  lastMsgText: { fontSize: 12, color: '#737686', marginTop: 3 },
  roleTag: { fontSize: 10, fontWeight: '800', color: '#6200ea', marginTop: 2 },
  badge: {
    backgroundColor: '#6200ea',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#121c28', marginTop: 12 },
  emptyText: { fontSize: 12, color: '#737686', textAlign: 'center', marginTop: 4, paddingHorizontal: 20 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#6200ea',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#6200ea',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 28, 40, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#f8f9ff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    flex: 1,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f8',
    backgroundColor: '#f8f9ff',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#121c28',
  },
  modalCloseBtn: {
    padding: 6,
  },
  roleTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f8',
  },
  roleTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#f0f2f8',
    marginRight: 8,
  },
  roleTabActive: {
    backgroundColor: '#6200ea',
  },
  roleTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#737686',
  },
  roleTabTextActive: {
    color: '#ffffff',
  },
  modalSearchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  modalLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
});
