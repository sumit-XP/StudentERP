import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

interface StudentResult {
  id: string;
  name: string;
  avatar: string;
  className: string;
  subject: string;
  score: number;
  grade: string;
  status: 'passed' | 'failed' | 'warning';
}

const MOCK_RESULTS: StudentResult[] = [
  {
    id: '1',
    name: 'Alex Rivera',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBHNQnXBZokhepAnwoW8uhCkr4eNEyFySOS2yaWZrgNBiid5VvOj7EkHJV6ujJTOt4I1HJE8k3xjPMyMBl8OO5Aj7XYkTPDXkJJfTNKJ356m3EKKBe6b1wnM4FXrZBE2Y_b_63zx8q58uoDKkJTNonXOPjRbMRFwJZEiLCLp5REMHmv8ohWeU9Jld_y3nwrNoZxkrjPNQ-F_fjkovnizTAaC8x0skfKVXvEsy63w73fAkGU8sHUlAHl',
    className: 'Grade 10-B',
    subject: 'Science',
    score: 92,
    grade: 'A',
    status: 'passed',
  },
  {
    id: '2',
    name: 'Beatrice Silva',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC1sR-2NYx8TaKdbhsp7XR1X2LdIEjBO3XboKebnufHhqMkWKifyWvHSvu0ufL4Bcv5NBEDjeK18L2uj8QpKDHcu8jJS7VZNoZA2zdNZKiPgheRdMiS-Tecl954gqFMbzsBJTo0cyvXYEqoh5-ouBfzZ6mjmFKg3AosVc7SD8w8XemR0xgGqD3GWYzUpLPN00oNkHtx9OehgrgHmoTI9-tIzRx2U6ZdcdHaxmP0L-NhAhz9eDdTjiUX',
    className: 'Grade 10-B',
    subject: 'Science',
    score: 85,
    grade: 'B+',
    status: 'passed',
  },
  {
    id: '3',
    name: 'Marcus Thorne',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCq9wJY7B-K0Ihxiip8VMrikSOrHNoy5eFssAh2XF217PZHiLfG07ko4gc1cP5Fhlvdpu6CbC76K4zrD7k8ORQphKTcmkE_Vzb16BV3AK-oI9_HovLLZs6XYD3_iRpA_tUnpcR3Uv557n0VTrtV6uG3uQyH3IPsABlwhmMuoVZZCoF-XsyzSUoIpBjdWmXJcRK6AF-uBqBBKvzqf-oWQCBy-wFZOptOfYrAxfhywXZtqzY-ZmNfKYeN',
    className: 'Grade 12-A',
    subject: 'Physics',
    score: 72,
    grade: 'C+',
    status: 'warning',
  },
  {
    id: '4',
    name: 'Linh Nguyen',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAzWypNf-6tAHJ5nXLngWKe6x1JCnJMcKZhr-H_HgSJQKSPQdFHrLmKTv_6OEGHWeBTRi504sFoNfgOF8R4rUwYEc9OiPRFqP95EQuis9_77FAQOIu9NbPNqFTbr8RToo_ysYCBA-7FheYzmFgg8L02TwKsBfHWLSlyHtI-T_pYq6D3zSXPk-sjEykqjsh-uk4Q7UmOTN2c4Z7LOwn8JOgZkoqb28jxkhENTwPhC0AfHwtW54pyAIcV',
    className: 'Grade 11-C',
    subject: 'Math',
    score: 48,
    grade: 'F',
    status: 'failed',
  },
];

const AdminResultsOverviewScreen: React.FC = () => {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');

  const filteredResults = MOCK_RESULTS.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.subject.toLowerCase().includes(query.toLowerCase());
    const matchesClass = selectedClass === 'All' || r.className === selectedClass;
    return matchesSearch && matchesClass;
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* GPA Summary Card */}
        <View style={styles.statsSummaryCard}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>School GPA</Text>
            <Text style={[styles.statValue, styles.textBlue]}>3.62</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Passing Rate</Text>
            <Text style={[styles.statValue, styles.textGreen]}>94.8%</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Top Subject</Text>
            <Text style={[styles.statValue, styles.textOrange]}>Science</Text>
          </View>
        </View>

        {/* Search & Filter Section */}
        <View style={styles.filterSection}>
          <View style={styles.searchBar}>
            <Icon name="magnify" size={20} color="#737686" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by student name or subject..."
              placeholderTextColor="#737686"
              value={query}
              onChangeText={setQuery}
            />
          </View>

          {/* Class Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            {['All', 'Grade 10-B', 'Grade 11-C', 'Grade 12-A'].map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, selectedClass === c && styles.chipActive]}
                onPress={() => setSelectedClass(c)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, selectedClass === c && styles.chipTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Results List */}
        <View style={styles.listContainer}>
          <Text style={styles.listHeaderTitle}>Student Academic Results</Text>
          {filteredResults.length === 0 ? (
            <Text style={styles.emptyText}>No results match your filters.</Text>
          ) : (
            filteredResults.map((item) => (
              <View key={item.id} style={styles.resultRow}>
                <View style={styles.studentMeta}>
                  <View style={styles.avatarWrapper}>
                    <Image style={styles.avatar} source={{ uri: item.avatar }} />
                  </View>
                  <View style={styles.nameBlock}>
                    <Text style={styles.studentName}>{item.name}</Text>
                    <Text style={styles.subText}>
                      {item.className} • {item.subject}
                    </Text>
                  </View>
                </View>

                <View style={styles.scoreBlock}>
                  <Text style={styles.scoreText}>{item.score}%</Text>
                  <View
                    style={[
                      styles.gradeBadge,
                      item.status === 'passed' && styles.badgePassed,
                      item.status === 'warning' && styles.badgeWarning,
                      item.status === 'failed' && styles.badgeFailed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.gradeText,
                        item.status === 'passed' && styles.textPassed,
                        item.status === 'warning' && styles.textWarning,
                        item.status === 'failed' && styles.textFailed,
                      ]}
                    >
                      {item.grade}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Action Button to close */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.closeBtnText}>Return to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  statsSummaryCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#c3c5d7',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#737686',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  textBlue: {
    color: '#003fb1',
  },
  textGreen: {
    color: '#006c4a',
  },
  textOrange: {
    color: '#723b00',
  },
  filterSection: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#121c28',
    padding: 0,
  },
  chipsContainer: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#dfe9fa',
  },
  chipActive: {
    backgroundColor: '#003fb1',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#434654',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 16,
    padding: 16,
  },
  listHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121c28',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#737686',
    marginVertical: 20,
    fontSize: 13,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9ff',
    paddingVertical: 12,
  },
  studentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    marginLeft: 12,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121c28',
  },
  subText: {
    fontSize: 11,
    color: '#737686',
    marginTop: 2,
  },
  scoreBlock: {
    alignItems: 'flex-end',
    gap: 4,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121c28',
  },
  gradeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgePassed: {
    backgroundColor: '#82f5c1',
  },
  badgeWarning: {
    backgroundColor: '#ffdcc3',
  },
  badgeFailed: {
    backgroundColor: '#ffdad6',
  },
  gradeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  textPassed: {
    color: '#005137',
  },
  textWarning: {
    color: '#6e3900',
  },
  textFailed: {
    color: '#ba1a1a',
  },
  closeBtn: {
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#434654',
  },
});

export default AdminResultsOverviewScreen;
