import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { UsersStackParamList } from '../../navigation/features/UsersNavigator';
import { academicService } from '../../services/academicService';
import { userService } from '../../services/userService';

type NavProp = StackNavigationProp<UsersStackParamList, 'UserList'>;

interface UserDirectoryItem {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'Student' | 'Teacher' | 'Staff';
  status: 'Active' | 'On Leave' | 'Suspended';
  lastLogin: string;
  className?: string;
  section?: string;
  rollNumber?: string;
  phone?: string;
}

interface ClassItem {
  id: string;
  name: string;
  section?: string;
}

const UserListScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();

  // State management
  const [query, setQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'All' | 'Student' | 'Teacher' | 'Staff'>('Student');
  const [selectedClassId, setSelectedClassId] = useState<string>('All');
  const [classList, setClassList] = useState<ClassItem[]>([]);
  const [directory, setDirectory] = useState<UserDirectoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch classes on mount for Student class filter
  useEffect(() => {
    academicService
      .getClasses()
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          const mapped: ClassItem[] = res.map((c: any, idx: number) => ({
            id: c.id ? String(c.id) : String(idx + 1),
            name: c.name || `Class ${idx + 1}`,
            section: c.section,
          }));
          setClassList(mapped);
        }
      })
      .catch(() => setClassList([]));
  }, []);

  // Targeted on-demand API search to minimize API calling
  const executeSearch = useCallback(async (role: string, classId: string, searchStr: string) => {
    setLoading(true);
    try {
      let results: any[] = [];

      if (role === 'Student') {
        const params: any = {};
        if (classId !== 'All') params.classId = classId;
        if (searchStr.trim()) params.search = searchStr.trim();
        results = await academicService.getStudents(params).catch(() => []);
      } else if (role === 'Teacher') {
        const params: any = {};
        if (searchStr.trim()) params.search = searchStr.trim();
        results = await academicService.getTeachers(params).catch(() => []);
      } else if (role === 'Staff') {
        results = await userService.getUsers().catch(() => []);
        results = results.filter((u: any) => u.role === 'Staff');
      } else {
        // All roles search
        results = await userService.getUsers().catch(() => []);
      }

      if (Array.isArray(results) && results.length > 0) {
        const mapped: UserDirectoryItem[] = results.map((u: any, idx: number) => {
          const roleRaw = (u.role || u.designation || role).toLowerCase();
          const userRole: 'Student' | 'Teacher' | 'Staff' = roleRaw.includes('student')
            ? 'Student'
            : roleRaw.includes('teacher')
            ? 'Teacher'
            : 'Staff';

          return {
            id: u.id ? String(u.id) : String(idx + 1),
            name: u.name || u.first_name ? `${u.first_name || u.name} ${u.last_name || ''}`.trim() : 'User',
            email: u.email || `${u.student_id || 'user'}@sikhsha.edu`,
            avatar:
              u.avatar_url ||
              'https://lh3.googleusercontent.com/aida-public/AB6AXuBB-Qz_VWidTvF94GrrGOrPhV2pGkXIF46b5DF5E8sEhtZeDLVZJXLpAkUyLJGnElGMJvlzyVXN-vjiT-w_N5n5KLq38eW83VWX9XciTmJbdLLw-1p95AiuPFUIgoEo8P4PF4W7qRkmTW6NxYvGe9z0HhZf2D_uOu5VwBPaYSPbvemEmCqnUrM1PLtgAab3rZiNXOCqkXsdZlDZjzT7NMU8Mq7tLGlmeztwzVTf80uW96EesABEW_xN',
            role: userRole,
            status: u.is_active === false ? 'Suspended' : 'Active',
            lastLogin: u.updated_at ? new Date(u.updated_at).toLocaleDateString() : 'Recently',
            className: u.class_name || u.className,
            section: u.section,
            rollNumber: u.roll_number || u.student_id,
            phone: u.phone,
          };
        });

        // Store and deduplicate searched users
        setDirectory((prev) => {
          const map = new Map<string, UserDirectoryItem>();
          prev.forEach((item) => map.set(item.id, item));
          mapped.forEach((item) => map.set(item.id, item));
          return Array.from(map.values());
        });
      }
    } catch (e) {
      console.error('Error executing targeted user search:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Execute search when filters change or search is submitted
  useEffect(() => {
    executeSearch(filterRole, selectedClassId, query);
  }, [filterRole, selectedClassId, executeSearch]);

  // Filter local directory based on active filters
  const filteredDirectory = directory.filter((user) => {
    const matchesSearch =
      query.trim() === '' ||
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase());
    const matchesRole = filterRole === 'All' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar & Role/Class Filter Container */}
      <View style={styles.headerFiltersBlock}>
        {/* On-Demand Search Bar */}
        <View style={styles.searchBar}>
          <Icon name="magnify" size={20} color="#737686" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or student ID..."
            placeholderTextColor="#737686"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => executeSearch(filterRole, selectedClassId, query)}
            returnKeyType="search"
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Icon name="close-circle" size={16} color="#737686" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Role Selector Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {(['All', 'Student', 'Teacher', 'Staff'] as const).map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.chip, filterRole === role && styles.chipActive]}
              onPress={() => {
                setFilterRole(role);
                setSelectedClassId('All');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, filterRole === role && styles.chipTextActive]}>
                {role === 'All' ? 'All Roles' : `${role}s`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Conditional Student Class Filter */}
        {filterRole === 'Student' && classList.length > 0 ? (
          <View style={styles.classFilterSection}>
            <Text style={styles.filterSubTitle}>Filter by Class:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.classChipsRow}
            >
              <TouchableOpacity
                style={[
                  styles.classChip,
                  selectedClassId === 'All' && styles.classChipActive,
                ]}
                onPress={() => setSelectedClassId('All')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.classChipText,
                    selectedClassId === 'All' && styles.classChipTextActive,
                  ]}
                >
                  All Classes
                </Text>
              </TouchableOpacity>

              {classList.map((c) => {
                const label = `${c.name} ${c.section ? `(${c.section})` : ''}`.trim();
                const isSelected = selectedClassId === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.classChip, isSelected && styles.classChipActive]}
                    onPress={() => setSelectedClassId(c.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.classChipText, isSelected && styles.classChipTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </View>

      {/* Directory List */}
      <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#003fb1" />
            <Text style={styles.loadingText}>Searching Database...</Text>
          </View>
        ) : null}

        <View style={styles.listCard}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
              Directory Users ({filteredDirectory.length})
            </Text>
          </View>

          {filteredDirectory.length === 0 ? (
            <View style={styles.emptyBox}>
              <Icon name="account-search-outline" size={32} color="#737686" />
              <Text style={styles.emptyText}>
                {loading ? 'Searching...' : 'No users found. Use the search bar or filters above to query.'}
              </Text>
            </View>
          ) : (
            filteredDirectory.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={styles.userItemRow}
                onPress={() => {
                  navigation.navigate('StudentProfile', {
                    studentId: user.id,
                    userDetail: user,
                  });
                }}
                activeOpacity={0.7}
              >
                <View style={styles.userInfoCol}>
                  <View style={styles.avatarWrapper}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarInitialText}>
                        {(user.name || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.nameBlock}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    {user.className ? (
                      <Text style={styles.classSubText}>
                        Class: {user.className} {user.section ? `(${user.section})` : ''}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.roleStatusCol}>
                  <View style={styles.badgeRow}>
                    <View
                      style={[
                        styles.roleBadge,
                        user.role === 'Student' && styles.roleBadgeStudent,
                        user.role === 'Teacher' && styles.roleBadgeTeacher,
                        user.role === 'Staff' && styles.roleBadgeStaff,
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleBadgeText,
                          user.role === 'Student' && styles.roleTextStudent,
                          user.role === 'Teacher' && styles.roleTextTeacher,
                          user.role === 'Staff' && styles.roleTextStaff,
                        ]}
                      >
                        {user.role}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.viewDetailsText}>Tap for Details ›</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  headerFiltersBlock: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#c3c5d7',
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 63, 177, 0.05)',
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#003fb1',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#121c28',
    padding: 0,
  },
  chipsRow: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#dfe9fa',
  },
  chipActive: {
    backgroundColor: '#003fb1',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#434654',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  classFilterSection: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f8f9ff',
  },
  filterSubTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#737686',
    marginBottom: 6,
  },
  classChipsRow: {
    gap: 6,
  },
  classChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f8f9ff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
  },
  classChipActive: {
    backgroundColor: '#006c4a',
    borderColor: '#006c4a',
  },
  classChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#434654',
  },
  classChipTextActive: {
    color: '#ffffff',
  },
  scrollList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 88,
  },
  listCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 16,
    padding: 16,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121c28',
  },
  addNewInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  addNewInlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#003fb1',
  },
  emptyBox: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#737686',
    fontSize: 12,
    paddingHorizontal: 16,
  },
  userItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9ff',
    paddingVertical: 12,
  },
  userInfoCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.2,
  },
  avatarWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  avatarCircle: {
    width: '100%',
    height: '100%',
    backgroundColor: '#eef4ff',
    borderWidth: 1,
    borderColor: '#003fb1',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#003fb1',
  },
  nameBlock: {
    marginLeft: 10,
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#121c28',
  },
  userEmail: {
    fontSize: 10,
    color: '#737686',
    marginTop: 2,
  },
  classSubText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#003fb1',
    marginTop: 2,
  },
  roleStatusCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roleBadgeStudent: {
    backgroundColor: '#82f5c1',
  },
  roleBadgeTeacher: {
    backgroundColor: '#ffdcc3',
  },
  roleBadgeStaff: {
    backgroundColor: '#dfe9fa',
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  roleTextStudent: {
    color: '#005137',
  },
  roleTextTeacher: {
    color: '#6e3900',
  },
  roleTextStaff: {
    color: '#434654',
  },
  viewDetailsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#003fb1',
    marginTop: 2,
  },
  fabBtn: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#003fb1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#003fb1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
});

export default UserListScreen;
