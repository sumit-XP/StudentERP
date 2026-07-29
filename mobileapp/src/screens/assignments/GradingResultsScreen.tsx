import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  SafeAreaView,
  Modal,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import academicService from '../../services/academicService';
import {
  MenuIcon,
  BellIcon,
  ChevronRightIcon,
  SaveIcon,
  SearchIcon,
  FilterListIcon,
  SortIcon,
  EditNoteIcon,
  LogoutIcon,
  FactCheckIcon,
  AssignmentIcon,
  SettingsIcon,
  ProfileIcon,
} from '../../assets/svgs';

interface StudentMarksItem {
  id: string;
  name: string;
  initials: string;
  score: string;
  status: 'In Progress' | 'Missing' | 'Drafted';
  bgClass: string;
}

const INITIAL_STUDENTS: StudentMarksItem[] = [
  {
    id: '102938',
    name: 'Alex Lindbergh',
    initials: 'AL',
    score: '85',
    status: 'In Progress',
    bgClass: '#82f5c1',
  },
  {
    id: '102941',
    name: 'Beth Jameson',
    initials: 'BJ',
    score: '',
    status: 'Missing',
    bgClass: '#ffdad6',
  },
  {
    id: '102945',
    name: 'Cody Miller',
    initials: 'CM',
    score: '92',
    status: 'Drafted',
    bgClass: '#dfe9fa',
  },
  {
    id: '102952',
    name: 'Diana Rose',
    initials: 'DR',
    score: '76',
    status: 'In Progress',
    bgClass: '#82f5c1',
  },
  {
    id: '102960',
    name: 'Ethan Knight',
    initials: 'EK',
    score: '88',
    status: 'In Progress',
    bgClass: '#82f5c1',
  },
];

const GradingResultsScreen: React.FC = () => {
  const { signOut } = useAuth();
  const navigation = useNavigation();
  const [students, setStudents] = useState<StudentMarksItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [filterMissingOnly, setFilterMissingOnly] = useState(false);
  const [sortByRank, setSortByRank] = useState(false);

  useEffect(() => {
    academicService
      .getStudents()
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: StudentMarksItem[] = data.map((stu: any, idx: number) => {
            const nameParts = (stu.user_name || stu.name || `Student ${idx + 1}`).split(' ');
            const initials = nameParts.length >= 2
              ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
              : `${nameParts[0][0] || 'S'}`.toUpperCase();
            return {
              id: stu.id,
              name: stu.user_name || stu.name || `Student ${idx + 1}`,
              initials,
              score: '',
              status: 'Missing',
              bgClass: '#ffdad6',
            };
          });
          setStudents(mapped);
        } else {
          setStudents(INITIAL_STUDENTS);
        }
      })
      .catch(() => {
        setStudents(INITIAL_STUDENTS);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleScoreChange = (id: string, text: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const score = text.trim();
          let status: 'In Progress' | 'Missing' | 'Drafted' = s.status;
          let bgClass = s.bgClass;
          if (score === '') {
            status = 'Missing';
            bgClass = '#ffdad6';
          } else {
            status = 'In Progress';
            bgClass = '#82f5c1';
          }
          return { ...s, score, status, bgClass };
        }
        return s;
      }),
    );
  };

  const handleLogout = async () => {
    try {
      setShowDrawer(false);
      await signOut();
    } catch {
      Alert.alert('Error', 'Logout failed.');
    }
  };

  const handleSave = () => {
    Alert.alert('Grades Saved', 'Your assessment drafts have been successfully saved.');
  };

  const handleSubmit = () => {
    Alert.alert(
      'Submit Assessment',
      'Are you sure you want to finalize and submit all grades to the portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit All',
          onPress: () => Alert.alert('Submitted', 'Grades submitted successfully.'),
        },
      ],
    );
  };

  // Filter and sort students
  const filteredStudents = students
    .filter((s) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = s.name.toLowerCase().includes(query) || s.id.includes(query);
      const matchesFilter = filterMissingOnly ? s.status === 'Missing' || s.score === '' : true;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortByRank) {
        const scoreA = parseFloat(a.score) || 0;
        const scoreB = parseFloat(b.score) || 0;
        return scoreB - scoreA;
      }
      return 0; // retain default order
    });

  // Calculate statistics
  const gradedCount = students.filter((s) => s.score !== '').length;
  const totalCount = students.length;
  const scores = students.map((s) => parseFloat(s.score)).filter((num) => !isNaN(num));
  const classAvg = scores.length
    ? (scores.reduce((sum, val) => sum + val, 0) / scores.length).toFixed(1)
    : '0.0';

  return (
    <SafeAreaView style={styles.container}>
      {/* TopAppBar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.6}
            onPress={() => setShowDrawer(true)}
          >
            <MenuIcon size={24} color="#003fb1" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Teacher Portal</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.6}
            onPress={() => Alert.alert('Notifications', 'No new notifications.')}
          >
            <BellIcon size={22} color="#003fb1" />
          </TouchableOpacity>
          <View style={styles.avatarWrapper}>
            <Image
              style={styles.avatarImg}
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAl6-Jy2sQpN0-1pgR7Shb7alGOQ25UGxYSlYKXVfUnWNo4H-rSSfBoxBIJHq2ZqHICTUZv29e9B3qvJretHly-CiqcZl_79Dd-RX1gYD5lfuGR1D_haE9BibpN1kbCeGbAKmpI96qMeRkntVHgNg-55w3LdE57xwDwFvktG8nF7W4eeX9dT-Z3s8Gd068w1ihU9eYX39Ambn0A3JPSPMftaBwboFi7SO2dL6iiCPzwPcSUSCoNc7mL',
              }}
            />
          </View>
        </View>
      </View>

      {/* Navigation Drawer Overlay */}
      {showDrawer && (
        <Modal transparent visible={showDrawer} animationType="none">
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.drawerOverlayTouch}
              activeOpacity={1}
              onPress={() => setShowDrawer(false)}
            />
            <View style={styles.drawerContentContainer}>
              {/* Drawer Header */}
              <View style={styles.drawerHeader}>
                <View style={styles.drawerAvatarWrapper}>
                  <Image
                    style={styles.drawerAvatarImg}
                    source={{
                      uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxJTBRP7f4Dg_FC2bG5XOS0g4I8G65Lz-asF8VCkoGglXuG239vL0l5L7KJBM3Kfc9Lc2B9cEqLT7V0FkzwpRFE0zYAtvrTX8iPrakznk-KQ6ClX-rHzRATfSbw2Wvrx9-pxvtZ3YjkzcZDuTo3Ka2ac_uzZkYCMs8VugEQDApWkEKaSZsPyrX28Qorwr7FgRreGHjaYeBr3I1Ax0U8x-XkZWjYqp3urRGqdUIdz8kwVIW0H_e9CEc',
                    }}
                  />
                </View>
                <View>
                  <Text style={styles.drawerTeacherName}>Prof. Anderson</Text>
                  <Text style={styles.drawerTeacherRole}>Dept. of Science | ID: T-8821</Text>
                </View>
              </View>

              {/* Drawer Links */}
              <ScrollView style={styles.drawerNav}>
                <TouchableOpacity
                  style={styles.drawerNavItem}
                  activeOpacity={0.6}
                  onPress={() => {
                    setShowDrawer(false);
                    const parent = navigation.getParent();
                    if (parent) {
                      parent.navigate('AttendanceTab');
                    }
                  }}
                >
                  <FactCheckIcon size={22} color="#434654" />
                  <Text style={styles.drawerNavItemText}>Attendance</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.drawerNavItem}
                  activeOpacity={0.6}
                  onPress={() => {
                    setShowDrawer(false);
                    const parent = navigation.getParent();
                    if (parent) {
                      parent.navigate('AssignmentsTab');
                    }
                  }}
                >
                  <AssignmentIcon size={22} color="#434654" />
                  <Text style={styles.drawerNavItemText}>Assignments</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.drawerNavItem}
                  activeOpacity={0.6}
                  onPress={() => {
                    setShowDrawer(false);
                    Alert.alert('Messages', 'Opening communication portal.');
                  }}
                >
                  <ProfileIcon size={22} color="#434654" />
                  <Text style={styles.drawerNavItemText}>Messages</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.drawerNavItem}
                  activeOpacity={0.6}
                  onPress={() => {
                    setShowDrawer(false);
                    Alert.alert('Settings', 'Opening system settings.');
                  }}
                >
                  <SettingsIcon size={22} color="#434654" />
                  <Text style={styles.drawerNavItemText}>Settings</Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Drawer Footer */}
              <View style={styles.drawerFooter}>
                <TouchableOpacity
                  style={styles.drawerLogoutBtn}
                  activeOpacity={0.6}
                  onPress={handleLogout}
                >
                  <LogoutIcon size={22} color="#ba1a1a" />
                  <Text style={styles.drawerLogoutText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Breadcrumb & Title */}
        <View style={styles.breadcrumbContainer}>
          <Text style={styles.breadcrumbText}>Dashboard</Text>
          <ChevronRightIcon size={12} color="#737686" style={styles.breadcrumbDivider} />
          <Text style={styles.breadcrumbActive}>Mark Update</Text>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.headlineTitle}>Mark Entry: Final Assessment</Text>
          <Text style={styles.headlineSubtitle}>Grade 10-B • Science (SCI-202)</Text>

          <View style={styles.titleButtonsRow}>
            <TouchableOpacity style={styles.draftBtn} activeOpacity={0.7} onPress={handleSave}>
              <Text style={styles.draftBtnText}>Drafts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} activeOpacity={0.8} onPress={handleSubmit}>
              <SaveIcon size={18} color="#ffffff" />
              <Text style={styles.submitBtnText}>Submit All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Class Stats Bento Row */}
        <View style={styles.statsRow}>
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Status</Text>
            <View style={styles.statusInnerRow}>
              <View style={styles.orangeDot} />
              <Text style={styles.statsValue}>{`${gradedCount} / ${totalCount} Graded`}</Text>
            </View>
          </View>

          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Class Average</Text>
            <Text style={[styles.statsValue, styles.greenText]}>{`${classAvg}%`}</Text>
          </View>

          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Due Date</Text>
            <Text style={styles.statsValue}>Oct 24, 2023</Text>
          </View>
        </View>

        {/* Filter & Search Bar */}
        <View style={styles.filterBar}>
          <View style={styles.searchContainer}>
            <SearchIcon size={20} color="#737686" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search student by name or ID..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#737686"
            />
          </View>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterBtn, filterMissingOnly && styles.filterBtnActive]}
              activeOpacity={0.7}
              onPress={() => setFilterMissingOnly(!filterMissingOnly)}
            >
              <FilterListIcon size={18} color={filterMissingOnly ? '#ffffff' : '#737686'} />
              <Text style={[styles.filterBtnText, filterMissingOnly && styles.filterBtnTextActive]}>
                Missing Only
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterBtn, sortByRank && styles.filterBtnActive]}
              activeOpacity={0.7}
              onPress={() => setSortByRank(!sortByRank)}
            >
              <SortIcon size={18} color={sortByRank ? '#ffffff' : '#737686'} />
              <Text style={[styles.filterBtnText, sortByRank && styles.filterBtnTextActive]}>
                Rank
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Student Roster List */}
        <View style={styles.rosterContainer}>
          {filteredStudents.length === 0 ? (
            <View style={styles.emptyList}>
              <Text style={styles.emptyText}>No students found</Text>
            </View>
          ) : (
            filteredStudents.map((item) => (
              <View key={item.id} style={styles.studentRow}>
                <View style={styles.studentLeft}>
                  <View
                    style={[
                      styles.initialsCircle,
                      { backgroundColor: item.bgClass === '#ffdad6' ? '#ba1a1a' : '#003fb1' },
                    ]}
                  >
                    <Text style={styles.initialsText}>{item.initials}</Text>
                  </View>
                  <View>
                    <Text style={styles.studentName}>{item.name}</Text>
                    <Text style={styles.studentId}>{`ID: ${item.id}`}</Text>
                  </View>
                </View>

                <View style={styles.studentRight}>
                  <View style={styles.hideOnMobile}>
                    <View
                      style={[
                        styles.statusChip,
                        {
                          backgroundColor:
                            item.status === 'Missing'
                              ? '#ffdad6'
                              : item.status === 'Drafted'
                              ? '#dfe9fa'
                              : '#82f5c1',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusChipText,
                          {
                            color:
                              item.status === 'Missing'
                                ? '#ba1a1a'
                                : item.status === 'Drafted'
                                ? '#003fb1'
                                : '#005137',
                          },
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.scoreInput}
                      keyboardType="numeric"
                      placeholder={item.status === 'Missing' ? '--' : '0'}
                      value={item.score}
                      onChangeText={(text) => handleScoreChange(item.id, text)}
                      placeholderTextColor="#737686"
                    />
                    <Text style={styles.maxScore}>/ 100</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.editBtn}
                    activeOpacity={0.6}
                    onPress={() =>
                      Alert.alert('Edit Notes', `Add custom feedback for ${item.name}`)
                    }
                  >
                    <EditNoteIcon size={22} color="#737686" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Footer Action */}
        <View style={styles.footerContainer}>
          <TouchableOpacity style={styles.saveContinueBtn} activeOpacity={0.8} onPress={handleSave}>
            <Text style={styles.saveContinueText}>Save & Continue Later</Text>
          </TouchableOpacity>
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
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#c3c5d7',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#003fb1',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 8,
  },
  avatarWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#c3c5d7',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 28, 40, 0.4)',
    flexDirection: 'row',
  },
  drawerOverlayTouch: {
    flex: 1,
  },
  drawerContentContainer: {
    width: 280,
    height: '100%',
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderColor: '#c3c5d7',
    paddingBottom: 20,
  },
  drawerHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderColor: '#eeeff8',
    backgroundColor: '#f8f9ff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  drawerAvatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#003fb1',
  },
  drawerAvatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  drawerTeacherName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#121c28',
  },
  drawerTeacherRole: {
    fontSize: 11,
    color: '#737686',
    marginTop: 2,
  },
  drawerNav: {
    flex: 1,
    padding: 16,
  },
  drawerNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  drawerNavItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#434654',
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderColor: '#eeeff8',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  drawerLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 12,
  },
  drawerLogoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ba1a1a',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  breadcrumbText: {
    fontSize: 12,
    color: '#737686',
  },
  breadcrumbDivider: {
    marginHorizontal: 4,
  },
  breadcrumbActive: {
    fontSize: 12,
    fontWeight: '700',
    color: '#003fb1',
  },
  titleSection: {
    marginBottom: 20,
  },
  headlineTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#121c28',
  },
  headlineSubtitle: {
    fontSize: 14,
    color: '#737686',
    marginTop: 4,
  },
  titleButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  draftBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#737686',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  draftBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#003fb1',
  },
  submitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#003fb1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#eef4ff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 12,
    padding: 12,
  },
  statsLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#737686',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statusInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orangeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#723b00',
  },
  statsValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#121c28',
  },
  greenText: {
    color: '#006c4a',
  },
  filterBar: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    gap: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    borderRadius: 8,
    paddingHorizontal: 10,
    flex: 1,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#121c28',
    padding: 0,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 36,
    backgroundColor: '#e5eeff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  filterBtnActive: {
    backgroundColor: '#003fb1',
  },
  filterBtnText: {
    fontSize: 12,
    color: '#737686',
    fontWeight: '600',
  },
  filterBtnTextActive: {
    color: '#ffffff',
  },
  rosterContainer: {
    gap: 10,
  },
  studentRow: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  initialsCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121c28',
  },
  studentId: {
    fontSize: 11,
    color: '#737686',
    marginTop: 2,
  },
  studentRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hideOnMobile: {
    ...Platform.select({
      ios: { display: 'flex' },
      android: { display: 'flex' },
    }),
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef4ff',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 38,
  },
  scoreInput: {
    width: 32,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: '#003fb1',
    padding: 0,
  },
  maxScore: {
    fontSize: 11,
    color: '#737686',
    marginLeft: 2,
  },
  editBtn: {
    padding: 6,
  },
  emptyList: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#737686',
  },
  footerContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  saveContinueBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#003fb1',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#003fb1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  saveContinueText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default GradingResultsScreen;
