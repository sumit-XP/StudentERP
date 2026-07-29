import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  RefreshControl,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import communicationService from '../../services/communicationService';
import { useAuth } from '../../contexts/AuthContext';
import {
  MegaphoneIcon,
  BellIcon,
  ChevronRightIcon,
  SendIcon,
} from '../../assets/svgs';

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  category?: string;
  target_audience?: string;
  targetAudience?: string;
  priority?: 'high' | 'normal' | 'low';
  is_high_priority?: boolean;
  created_at?: string;
  createdAt?: string;
  created_by_name?: string;
  createdByName?: string;
}

const CATEGORIES = ['All', 'Academic', 'Events', 'General', 'Urgent'];

const AnnouncementsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';

  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<AnnouncementItem[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchAnnouncements = useCallback(async () => {
    try {
      setError(null);
      const data = await communicationService.getAnnouncements();
      const list = Array.isArray(data) ? data : [];
      setItems(list);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch announcements.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnnouncements();
  };

  // Filter items by search query and selected category
  useEffect(() => {
    let result = items;

    if (selectedCategory !== 'All') {
      if (selectedCategory === 'Urgent') {
        result = result.filter(
          (item) => item.priority === 'high' || item.is_high_priority || item.category?.toLowerCase() === 'urgent',
        );
      } else {
        result = result.filter(
          (item) => item.category?.toLowerCase() === selectedCategory.toLowerCase(),
        );
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) => item.title?.toLowerCase().includes(q) || item.content?.toLowerCase().includes(q),
      );
    }

    setFilteredItems(result);
  }, [items, searchQuery, selectedCategory]);

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

  const handleCreateNew = () => {
    navigation.navigate('CreateAnnouncement' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerTitleRow}>
          <MegaphoneIcon size={24} color="#003fb1" />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.headerTitle}>Announcements</Text>
            <Text style={styles.headerSubtitle}>
              {isTeacherOrAdmin ? 'Manage & Broadcast Notices' : 'School Bulletins & Updates'}
            </Text>
          </View>
        </View>

        {isTeacherOrAdmin && (
          <TouchableOpacity style={styles.createBtnHeader} activeOpacity={0.8} onPress={handleCreateNew}>
            <Text style={styles.createBtnHeaderText}>+ Post</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search announcements..."
          placeholderTextColor="#737686"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Pills Row */}
      <View style={styles.categoryRow}>
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, isActive && styles.categoryChipActive]}
              activeOpacity={0.7}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main List Area */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#003fb1" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchAnnouncements}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={filteredItems}
          keyExtractor={(item, index) => item.id || `ann-${index}`}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#003fb1']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <BellIcon size={36} color="#c3c5d7" />
              <Text style={styles.emptyTitle}>No Announcements Found</Text>
              <Text style={styles.emptyDesc}>
                {searchQuery
                  ? 'No announcements match your search term.'
                  : 'Check back later for school updates and broadcast notices.'}
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const isExpanded = expanded.has(item.id);
            const isHighPriority = item.priority === 'high' || item.is_high_priority;
            const categoryName = item.category || (isHighPriority ? 'Urgent' : 'Notice');
            const target = item.target_audience || item.targetAudience || 'All School';
            const author = item.created_by_name || item.createdByName || 'School Admin';
            const dateStr = item.created_at || item.createdAt
              ? new Date(item.created_at || item.createdAt || '').toLocaleDateString()
              : 'Recently';

            return (
              <TouchableOpacity
                style={[styles.card, isHighPriority && styles.cardUrgent]}
                activeOpacity={0.9}
                onPress={() => toggleExpand(item.id)}
              >
                <View style={styles.cardTopRow}>
                  <View
                    style={[
                      styles.categoryBadge,
                      isHighPriority
                        ? styles.badgeRed
                        : index % 2 === 0
                        ? styles.badgeBlue
                        : styles.badgeGreen,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryBadgeText,
                        isHighPriority
                          ? styles.textRed
                          : index % 2 === 0
                          ? styles.textBlue
                          : styles.textGreen,
                      ]}
                    >
                      {categoryName.toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.targetBadge}>
                    <Text style={styles.targetText}>{target}</Text>
                  </View>
                </View>

                <Text style={styles.cardTitle}>{item.title}</Text>

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>By {author}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.metaText}>{dateStr}</Text>
                </View>

                <Text style={styles.contentPreview} numberOfLines={isExpanded ? undefined : 3}>
                  {item.content}
                </Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.toggleText}>
                    {isExpanded ? 'Show Less ▲' : 'Read Full Announcement ▼'}
                  </Text>
                  <ChevronRightIcon size={16} color="#003fb1" />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Floating Action Button for Teachers / Admins */}
      {isTeacherOrAdmin && (
        <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={handleCreateNew}>
          <SendIcon size={20} color="#ffffff" />
          <Text style={styles.fabText}>New Notice</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  headerBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#c3c5d7',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#121c28',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#737686',
    marginTop: 2,
  },
  createBtnHeader: {
    backgroundColor: '#003fb1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createBtnHeaderText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInput: {
    height: 42,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c3c5d7',
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#121c28',
  },
  categoryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#eef4ff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
  },
  categoryChipActive: {
    backgroundColor: '#003fb1',
    borderColor: '#003fb1',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#434654',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#ba1a1a',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: '#003fb1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#121c28',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#737686',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#c3c5d7',
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#121c28',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardUrgent: {
    borderColor: '#ffdad6',
    borderLeftWidth: 4,
    borderLeftColor: '#ba1a1a',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeBlue: {
    backgroundColor: '#dfe9fa',
  },
  badgeGreen: {
    backgroundColor: '#82f5c1',
  },
  badgeRed: {
    backgroundColor: '#ffdad6',
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  textBlue: {
    color: '#003fb1',
  },
  textGreen: {
    color: '#005137',
  },
  textRed: {
    color: '#ba1a1a',
  },
  targetBadge: {
    backgroundColor: '#f8f9ff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#c3c5d7',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  targetText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#434654',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#121c28',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 11,
    color: '#737686',
  },
  metaDot: {
    fontSize: 11,
    color: '#737686',
    marginHorizontal: 6,
  },
  contentPreview: {
    fontSize: 13,
    color: '#434654',
    lineHeight: 19,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#f0f2f8',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#003fb1',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: '#003fb1',
    borderRadius: 30,
    height: 48,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default AnnouncementsScreen;
