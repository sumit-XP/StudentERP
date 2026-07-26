import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

interface ClassAttendance {
  id: string;
  className: string;
  presentCount: number;
  totalCount: number;
  attendanceRate: number;
}

const MOCK_CLASSES: ClassAttendance[] = [
  {
    id: '1',
    className: 'Grade 10-B',
    presentCount: 28,
    totalCount: 32,
    attendanceRate: 87.5,
  },
  {
    id: '2',
    className: 'Grade 12-A',
    presentCount: 29,
    totalCount: 30,
    attendanceRate: 96.6,
  },
  {
    id: '3',
    className: 'Grade 11-C',
    presentCount: 25,
    totalCount: 30,
    attendanceRate: 83.3,
  },
  {
    id: '4',
    className: 'Grade 9-D',
    presentCount: 31,
    totalCount: 32,
    attendanceRate: 96.8,
  },
];

const AdminAttendanceOverviewScreen: React.FC = () => {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');

  const filteredClasses = MOCK_CLASSES.filter((c) =>
    c.className.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Attendance Stats Header */}
        <View style={styles.summaryStatsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>School Average</Text>
            <Text style={[styles.statValue, styles.textBlue]}>91.4%</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Present</Text>
            <Text style={[styles.statValue, styles.textGreen]}>2,410</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Absent</Text>
            <Text style={[styles.statValue, styles.textRed]}>42</Text>
          </View>
        </View>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <Icon name="magnify" size={20} color="#737686" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search classes (e.g. Grade 10)..."
            placeholderTextColor="#737686"
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {/* Classes List */}
        <View style={styles.listContainer}>
          <Text style={styles.listHeaderTitle}>Class-wise Attendance Ratios</Text>
          {filteredClasses.length === 0 ? (
            <Text style={styles.emptyText}>No classes found matching search.</Text>
          ) : (
            filteredClasses.map((item) => {
              const rateColor =
                item.attendanceRate >= 90
                  ? '#006c4a'
                  : item.attendanceRate >= 85
                  ? '#6e3900'
                  : '#ba1a1a';
              const progressFillWidth = `${item.attendanceRate}%`;

              return (
                <View key={item.id} style={styles.classRow}>
                  <View style={styles.rowHeader}>
                    <Text style={styles.className}>{item.className}</Text>
                    <Text style={styles.ratioText}>
                      {item.presentCount}/{item.totalCount} present
                    </Text>
                  </View>

                  <View style={styles.progressContainer}>
                    <View style={styles.progressBarBg}>
                      {}
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: progressFillWidth, backgroundColor: rateColor },
                        ]}
                      />
                    </View>
                    <Text style={[styles.rateText, { color: rateColor }]}>
                      {item.attendanceRate.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Back Button */}
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
  summaryStatsCard: {
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
  textRed: {
    color: '#ba1a1a',
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
    marginBottom: 20,
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
  classRow: {
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9ff',
    paddingBottom: 12,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  className: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121c28',
  },
  ratioText: {
    fontSize: 11,
    color: '#737686',
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5eeff',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  rateText: {
    fontSize: 13,
    fontWeight: '700',
    width: 48,
    textAlign: 'right',
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

export default AdminAttendanceOverviewScreen;
