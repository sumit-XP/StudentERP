import React, { useState } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { UsersStackParamList } from '../../navigation/features/UsersNavigator';

type NavProp = StackNavigationProp<UsersStackParamList, 'UserList'>;

interface UserDirectoryItem {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'Student' | 'Teacher' | 'Staff';
  status: 'Active' | 'On Leave' | 'Suspended';
  lastLogin: string;
}

const INITIAL_DIRECTORY: UserDirectoryItem[] = [
  {
    id: '1',
    name: 'Alex Rivera',
    email: 'alex.rivera@edu.org',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBHNQnXBZokhepAnwoW8uhCkr4eNEyFySOS2yaWZrgNBiid5VvOj7EkHJV6ujJTOt4I1HJE8k3xjPMyMBl8OO5Aj7XYkTPDXkJJfTNKJ356m3EKKBe6b1wnM4FXrZBE2Y_b_63zx8q58uoDKkJTNonXOPjRbMRFwJZEiLCLp5REMHmv8ohWeU9Jld_y3nwrNoZxkrjPNQ-F_fjkovnizTAaC8x0skfKVXvEsy63w73fAkGU8sHUlAHl',
    role: 'Student',
    status: 'Active',
    lastLogin: '2 hours ago',
  },
  {
    id: '2',
    name: 'Dr. Sarah Jenkins',
    email: 's.jenkins@edu.org',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC1sR-2NYx8TaKdbhsp7XR1X2LdIEjBO3XboKebnufHhqMkWKifyWvHSvu0ufL4Bcv5NBEDjeK18L2uj8QpKDHcu8jJS7VZNoZA2zdNZKiPgheRdMiS-Tecl954gqFMbzsBJTo0cyvXYEqoh5-ouBfzZ6mjmFKg3AosVc7SD8w8XemR0xgGqD3GWYzUpLPN00oNkHtx9OehgrgHmoTI9-tIzRx2U6ZdcdHaxmP0L-NhAhz9eDdTjiUX',
    role: 'Teacher',
    status: 'Active',
    lastLogin: 'Today, 09:45 AM',
  },
  {
    id: '3',
    name: 'Marcus Thorne',
    email: 'm.thorne@edu.org',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCq9wJY7B-K0Ihxiip8VMrikSOrHNoy5eFssAh2XF217PZHiLfG07ko4gc1cP5Fhlvdpu6CbC76K4zrD7k8ORQphKTcmkE_Vzb16BV3AK-oI9_HovLLZs6XYD3_iRpA_tUnpcR3Uv557n0VTrtV6uG3uQyH3IPsABlwhmMuoVZZCoF-XsyzSUoIpBjdWmXJcRK6AF-uBqBBKvzqf-oWQCBy-wFZOptOfYrAxfhywXZtqzY-ZmNfKYeN',
    role: 'Staff',
    status: 'On Leave',
    lastLogin: '3 days ago',
  },
  {
    id: '4',
    name: 'Linh Nguyen',
    email: 'linh.n@edu.org',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAzWypNf-6tAHJ5nXLngWKe6x1JCnJMcKZhr-H_HgSJQKSPQdFHrLmKTv_6OEGHWeBTRi504sFoNfgOF8R4rUwYEc9OiPRFqP95EQuis9_77FAQOIu9NbPNqFTbr8RToo_ysYCBA-7FheYzmFgg8L02TwKsBfHWLSlyHtI-T_pYq6D3zSXPk-sjEykqjsh-uk4Q7UmOTN2c4Z7LOwn8JOgZkoqb28jxkhENTwPhC0AfHwtW54pyAIcV',
    role: 'Student',
    status: 'Suspended',
    lastLogin: 'Oct 12, 2023',
  },
];

const UserListScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [directory] = useState<UserDirectoryItem[]>(INITIAL_DIRECTORY);
  const [query, setQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'All' | 'Student' | 'Teacher' | 'Staff'>('All');
  const [currentPage, setCurrentPage] = useState(1);

  const handleAddUser = () => {
    Alert.alert('Add User', 'Add User: New user account generator initialized.');
  };

  const filteredDirectory = directory.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase());
    const matchesRole = filterRole === 'All' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Search and Filters Bento Container */}
      <View style={styles.headerFiltersBlock}>
        <View style={styles.searchBar}>
          <Icon name="magnify" size={20} color="#737686" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or ID..."
            placeholderTextColor="#737686"
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {(['All', 'Student', 'Teacher', 'Staff'] as const).map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.chip, filterRole === role && styles.chipActive]}
              onPress={() => setFilterRole(role)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, filterRole === role && styles.chipTextActive]}>
                {role === 'All' ? 'All Users' : `${role}s`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Directory list */}
      <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
        <View style={styles.listCard}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Directory Users</Text>
            <TouchableOpacity
              style={styles.addNewInlineBtn}
              onPress={handleAddUser}
              activeOpacity={0.7}
            >
              <Icon name="plus" size={14} color="#003fb1" />
              <Text style={styles.addNewInlineText}>Add New</Text>
            </TouchableOpacity>
          </View>

          {filteredDirectory.length === 0 ? (
            <Text style={styles.emptyText}>No users match your criteria.</Text>
          ) : (
            filteredDirectory.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={styles.userItemRow}
                onPress={() => {
                  if (user.role === 'Student') {
                    navigation.navigate('StudentProfile', { studentId: user.id });
                  } else {
                    Alert.alert(
                      'User Details',
                      `${user.name} (${user.role}) - Status: ${user.status}`,
                    );
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.userInfoCol}>
                  <View style={styles.avatarWrapper}>
                    <Image style={styles.avatar} source={{ uri: user.avatar }} />
                  </View>
                  <View style={styles.nameBlock}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
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

                    <View style={styles.statusDotRow}>
                      <View
                        style={[
                          styles.statusDot,
                          user.status === 'Active' && styles.dotGreen,
                          user.status === 'On Leave' && styles.dotGrey,
                          user.status === 'Suspended' && styles.dotRed,
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          user.status === 'Active' && styles.textGreen,
                          user.status === 'On Leave' && styles.textGrey,
                          user.status === 'Suspended' && styles.textRed,
                        ]}
                      >
                        {user.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.lastLoginText}>Login: {user.lastLogin}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Pagination Card */}
        <View style={styles.paginationCard}>
          <Text style={styles.paginationProgressText}>
            Showing {filteredDirectory.length} of 1,240 users
          </Text>
          <View style={styles.paginationControls}>
            <TouchableOpacity
              style={[styles.pageNavBtn, currentPage === 1 && styles.pageNavBtnDisabled]}
              onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <Icon name="chevron-left" size={16} color="#737686" />
            </TouchableOpacity>

            {[1, 2, 3].map((page) => (
              <TouchableOpacity
                key={page}
                style={[styles.pageBtn, currentPage === page && styles.pageBtnActive]}
                onPress={() => setCurrentPage(page)}
              >
                <Text
                  style={[styles.pageBtnText, currentPage === page && styles.pageBtnTextActive]}
                >
                  {page}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.pageNavBtn}
              onPress={() => setCurrentPage(currentPage + 1)}
            >
              <Icon name="chevron-right" size={16} color="#737686" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity style={styles.fabBtn} onPress={handleAddUser} activeOpacity={0.85}>
        <Icon name="account-plus" size={24} color="#ffffff" />
      </TouchableOpacity>
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
  emptyText: {
    textAlign: 'center',
    color: '#737686',
    marginVertical: 20,
    fontSize: 12,
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
    flex: 1.1,
  },
  avatarWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#c3c5d7',
  },
  avatar: {
    width: '100%',
    height: '100%',
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
  roleStatusCol: {
    flex: 0.9,
    alignItems: 'flex-end',
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
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
    fontSize: 8,
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
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotGreen: {
    backgroundColor: '#006c4a',
  },
  dotGrey: {
    backgroundColor: '#737686',
  },
  dotRed: {
    backgroundColor: '#ba1a1a',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '600',
  },
  textGreen: {
    color: '#006c4a',
  },
  textGrey: {
    color: '#737686',
  },
  textRed: {
    color: '#ba1a1a',
  },
  lastLoginText: {
    fontSize: 9,
    color: '#737686',
  },
  paginationCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paginationProgressText: {
    fontSize: 11,
    color: '#737686',
    fontWeight: '600',
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pageNavBtn: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  pageNavBtnDisabled: {
    opacity: 0.4,
  },
  pageBtn: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  pageBtnActive: {
    backgroundColor: '#003fb1',
    borderColor: '#003fb1',
  },
  pageBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#434654',
  },
  pageBtnTextActive: {
    color: '#ffffff',
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
