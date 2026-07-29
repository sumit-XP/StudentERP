import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import academicService from '../../services/academicService';
import attendanceService from '../../services/attendanceService';
import {
  BellIcon,
  CalendarIcon,
  ChevronDownIcon,
  InfoIcon,
  CheckIcon,
  SendIcon,
} from '../../assets/svgs';

type AttendanceStatus = 'present' | 'absent';

interface StudentRosterItem {
  rollNo: string;
  id: string;
  name: string;
  avatar?: string;
  status: AttendanceStatus;
}

interface ClassItem {
  id: string;
  name: string;
  section?: string;
}

const MarkAttendanceScreen: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedClassName, setSelectedClassName] = useState<string>('Select Class');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [roster, setRoster] = useState<StudentRosterItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);

  // Load Classes list on mount
  useEffect(() => {
    academicService
      .getClasses()
      .then((clsList: any[]) => {
        if (Array.isArray(clsList) && clsList.length > 0) {
          setClasses(clsList);
          const first = clsList[0];
          setSelectedClassId(first.id);
          setSelectedClassName(`${first.name}${first.section ? `-${first.section}` : ''}`);
        }
      })
      .catch(() => {
        // Handled silently
      });
  }, []);

  // Fetch student roster and existing attendance when class or date changes
  const fetchRoster = useCallback(async () => {
    if (!selectedClassId) return;
    try {
      setLoading(true);
      const [studentsRes, attRes] = await Promise.allSettled([
        academicService.getStudents({ classId: selectedClassId }),
        attendanceService.getAttendanceByClassAndDate(selectedClassId, date),
      ]);

      const studentsList = studentsRes.status === 'fulfilled' && Array.isArray(studentsRes.value) ? studentsRes.value : [];
      const existingAttendance = attRes.status === 'fulfilled' && attRes.value?.attendance && Array.isArray(attRes.value.attendance)
        ? attRes.value.attendance
        : [];

      const attMap = new Map<string, AttendanceStatus>();
      existingAttendance.forEach((record: any) => {
        if (record.student_id) {
          attMap.set(record.student_id, record.status === 'absent' ? 'absent' : 'present');
        }
      });

      const formattedRoster: StudentRosterItem[] = studentsList.map((stu: any, idx: number) => ({
        id: stu.id,
        rollNo: stu.roll_number ? String(stu.roll_number).padStart(2, '0') : String(idx + 1).padStart(2, '0'),
        name: stu.user_name || stu.name || `Student ${idx + 1}`,
        avatar: stu.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAb1KmSbcZM91b7BIlYcyl6-uJnCU8uJ624gLvluXkD28wzwFtCLEOdrnshcrCDltuUi_U2fDZ6UwqPq324rma9Qt25dnKVWTEgZ-j6XvcQ2MjVP3kxT3kuJR8NX1F09fVwKo7MCG1jeBGs3WlEzAQ_PmCuBlDnGypU76JGsKxdJPk8aRQ5Lx1DwQndGofPs44Fwc7Me6B0lGg9JZ-Jc96mr_gKc5mWThMvsJJzLAd3ZGnCXcCStnGW',
        status: attMap.get(stu.id) || 'present',
      }));

      setRoster(formattedRoster);
    } catch {
      setRoster([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClassId, date]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  const toggleStatus = (studentId: string) => {
    setRoster((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, status: s.status === 'present' ? 'absent' : 'present' } : s,
      ),
    );
  };

  const handleMarkAllPresent = () => {
    setRoster((prev) => prev.map((s) => ({ ...s, status: 'present' })));
  };

  const handleSubmit = async () => {
    if (!selectedClassId) {
      Alert.alert('Selection Error', 'Please select a valid class first.');
      return;
    }

    if (roster.length === 0) {
      Alert.alert('Roster Empty', 'No students found in this class to mark attendance.');
      return;
    }

    setSubmitting(true);
    try {
      const attendanceData = roster.map((s) => ({
        studentId: s.id,
        classId: selectedClassId,
        date: date,
        status: s.status,
      }));

      await attendanceService.markAttendance(attendanceData);
      Alert.alert(
        'Attendance Submitted',
        `Successfully submitted attendance for ${selectedClassName} on ${date}.`,
        [{ text: 'OK' }],
      );
    } catch (err: any) {
      Alert.alert('Submission Error', err?.message || 'Failed to submit attendance to server.');
    } finally {
      setSubmitting(false);
    }
  };

  // Stats calculation
  const totalStudents = roster.length;
  const markedPresent = roster.filter((s) => s.status === 'present').length;
  const percentPresent = totalStudents > 0 ? Math.round((markedPresent / totalStudents) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerProfile}>
          <View style={styles.avatarWrapper}>
            <Image
              style={styles.avatarImg}
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqoiiJazE13Bpcm2H0C8R7GgHZuUxg0tJ34PwUL0QvIopK7jeU65MLM0hrnDl1-3js_U5w9bda4hwgbItVyIMNrSX1M7VvZS8HdX2T6IwaFyHMv-7GUSBlaO4fmb90QZ8cdjyk4uw1NxGJiY7Rb1QYWswiSRKQ-Ss4tCJjJVwykZtH9W5E5X-fbo2raRUQgA3xMcG9QjmVEfUF981urInTDgDmELI8thf61hWl090YT_AMoP_te5Eh',
              }}
            />
          </View>
          <Text style={styles.headerText}>Teacher Portal</Text>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          activeOpacity={0.6}
          onPress={() => Alert.alert('Notifications', 'No new notifications.')}
        >
          <BellIcon size={22} color="#003fb1" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Attendance</Text>
          <Text style={styles.sectionSubtitle}>
            Mark daily attendance for your assigned classes.
          </Text>
        </View>

        {/* Controls Bento Grid */}
        <View style={styles.controlsGrid}>
          {/* Class Selector Card */}
          <View style={styles.controlCard}>
            <Text style={styles.controlLabel}>SELECT CLASS</Text>
            <TouchableOpacity
              style={styles.selectorWrapper}
              onPress={() => setShowClassDropdown(!showClassDropdown)}
              activeOpacity={0.7}
            >
              <Text style={styles.selectorText}>{selectedClassName}</Text>
              <ChevronDownIcon size={20} color="#737686" />
            </TouchableOpacity>

            {showClassDropdown && (
              <View style={styles.dropdownMenu}>
                {classes.length === 0 ? (
                  <View style={styles.dropdownItem}>
                    <Text style={styles.dropdownItemText}>No classes found</Text>
                  </View>
                ) : (
                  classes.map((cls) => {
                    const cName = `${cls.name}${cls.section ? `-${cls.section}` : ''}`;
                    return (
                      <TouchableOpacity
                        key={cls.id}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedClassId(cls.id);
                          setSelectedClassName(cName);
                          setShowClassDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            selectedClassId === cls.id && styles.dropdownItemActive,
                          ]}
                        >
                          {cName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}
          </View>

          {/* Date Picker Card */}
          <View style={styles.controlCard}>
            <Text style={styles.controlLabel}>DATE</Text>
            <View style={styles.datePickerInputWrapper}>
              <CalendarIcon size={18} color="#003fb1" style={styles.inputIcon} />
              <TextInput
                style={styles.dateInput}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#737686"
              />
            </View>
          </View>

          {/* Statistics Card */}
          <View style={styles.statsCard}>
            <View style={styles.statsCardTop}>
              <Text style={styles.statsLabel}>CLASS SUMMARY</Text>
              <InfoIcon size={18} color="#d4dcff" />
            </View>
            <View style={styles.statsCardBottom}>
              <View>
                <Text style={styles.statsCount}>
                  {markedPresent} / {totalStudents}
                </Text>
                <Text style={styles.statsSubtext}>STUDENTS PRESENT</Text>
              </View>

              <View style={styles.progressCircle}>
                <View style={styles.innerCircle}>
                  <Text style={styles.progressPercent}>{percentPresent}%</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Student Roster Header */}
        <View style={styles.rosterHeader}>
          <Text style={styles.rosterTitle}>Student Roster</Text>
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={handleMarkAllPresent}
            activeOpacity={0.6}
          >
            <Text style={styles.markAllText}>Mark All Present</Text>
          </TouchableOpacity>
        </View>

        {/* Student Roster List */}
        {loading ? (
          <ActivityIndicator size="large" color="#003fb1" style={{ marginVertical: 32 }} />
        ) : roster.length === 0 ? (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ color: '#737686', fontSize: 14 }}>No students enrolled in this class.</Text>
          </View>
        ) : (
          <View style={styles.rosterContainer}>
            {roster.map((student) => (
              <TouchableOpacity
                key={student.id}
                style={styles.rosterItem}
                activeOpacity={0.8}
                onPress={() => toggleStatus(student.id)}
              >
                <View style={styles.studentDetailsCol}>
                  <Text style={styles.rollNoText}>{student.rollNo}</Text>
                  <View style={styles.studentAvatarWrapper}>
                    <Image style={styles.studentAvatar} source={{ uri: student.avatar }} />
                  </View>
                  <View style={styles.studentMeta}>
                    <Text style={styles.studentName} numberOfLines={1}>
                      {student.name}
                    </Text>
                    <Text style={styles.studentIdText}>{student.id}</Text>
                  </View>
                </View>

                <View style={styles.checkboxWrapper}>
                  <View
                    style={[
                      styles.checkboxCircle,
                      student.status === 'present' && styles.checkboxCircleChecked,
                    ]}
                  >
                    {student.status === 'present' && <CheckIcon size={14} color="#ffffff" />}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Submit Button Area */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={submitting || roster.length === 0}
          activeOpacity={0.9}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <View style={styles.submitBtnContent}>
              <SendIcon size={18} color="#ffffff" style={styles.btnIcon} />
              <Text style={styles.submitButtonText}>Submit Attendance</Text>
            </View>
          )}
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
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#003fb1',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#003fb1',
    marginLeft: 10,
  },
  notifBtn: {
    padding: 8,
    borderRadius: 9999,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#121c28',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#434654',
    marginTop: 2,
    lineHeight: 20,
  },
  controlsGrid: {
    marginBottom: 24,
    gap: 12,
  },
  controlCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 16,
    padding: 16,
    zIndex: 10,
  },
  controlLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#003fb1',
    letterSpacing: 1,
    marginBottom: 8,
  },
  selectorWrapper: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9ff',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#121c28',
  },
  dropdownMenu: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeff8',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#434654',
  },
  dropdownItemActive: {
    color: '#003fb1',
    fontWeight: '700',
  },
  datePickerInputWrapper: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  dateInput: {
    flex: 1,
    fontSize: 14,
    color: '#121c28',
    padding: 0,
  },
  statsCard: {
    backgroundColor: '#003fb1',
    borderRadius: 16,
    padding: 16,
  },
  statsCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1,
  },
  statsCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsCount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  statsSubtext: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  progressCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#003fb1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  rosterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#121c28',
  },
  markAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#e5eeff',
  },
  markAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#003fb1',
  },
  rosterContainer: {
    marginBottom: 24,
    gap: 10,
  },
  rosterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 16,
    padding: 12,
  },
  studentDetailsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rollNoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#737686',
    width: 24,
  },
  studentAvatarWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    marginRight: 10,
  },
  studentAvatar: {
    width: '100%',
    height: '100%',
  },
  studentMeta: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121c28',
  },
  studentIdText: {
    fontSize: 11,
    color: '#737686',
    marginTop: 2,
  },
  checkboxWrapper: {
    paddingLeft: 12,
  },
  checkboxCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#c3c5d7',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxCircleChecked: {
    backgroundColor: '#003fb1',
    borderColor: '#003fb1',
  },
  submitButton: {
    height: 48,
    backgroundColor: '#003fb1',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnIcon: {
    marginRight: 2,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});

export default MarkAttendanceScreen;
