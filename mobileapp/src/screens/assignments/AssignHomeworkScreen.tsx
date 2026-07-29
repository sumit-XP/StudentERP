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
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DocumentPicker, { DocumentPickerResponse, types } from 'react-native-document-picker';
import academicService from '../../services/academicService';
import assignmentService from '../../services/assignmentService';
import {
  MenuIcon,
  BellIcon,
  ChevronRightIcon,
  FactCheckIcon,
  AssignmentIcon,
  SettingsIcon,
  ProfileIcon,
  CalendarIcon,
  CloudUploadIcon,
  SendIcon,
} from '../../assets/svgs';

const AssignHomeworkScreen: React.FC = () => {
  const navigation = useNavigation();
  const [showDrawer, setShowDrawer] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<DocumentPickerResponse | null>(null);

  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedClassName, setSelectedClassName] = useState<string>('Select Class');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>('Select Subject');

  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    Promise.allSettled([academicService.getClasses(), academicService.getSubjects()])
      .then(([clsRes, subjRes]) => {
        if (clsRes.status === 'fulfilled' && Array.isArray(clsRes.value) && clsRes.value.length > 0) {
          setClasses(clsRes.value);
          const firstCls = clsRes.value[0];
          setSelectedClassId(firstCls.id);
          setSelectedClassName(`${firstCls.name}${firstCls.section ? `-${firstCls.section}` : ''}`);
        }

        if (subjRes.status === 'fulfilled' && Array.isArray(subjRes.value) && subjRes.value.length > 0) {
          setSubjects(subjRes.value);
          const firstSubj = subjRes.value[0];
          setSelectedSubjectId(firstSubj.id);
          setSelectedSubjectName(firstSubj.name);
        }
      })
      .catch(() => {});
  }, []);

  const handleUpload = async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [types.allFiles],
      });
      if (results && results.length > 0) {
        setSelectedFile(results[0]);
      }
    } catch (err: any) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('File Picker Error', 'Unable to pick file from device.');
      }
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter an assignment title.');
      return;
    }

    if (!selectedClassId || !selectedSubjectId) {
      Alert.alert('Validation Error', 'Please select both a valid class and subject.');
      return;
    }

    setPublishing(true);
    try {
      await assignmentService.createAssignment({
        title: title.trim(),
        description: description.trim(),
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        dueDate,
        maxMarks: 100,
      });

      Alert.alert('Success', 'Assignment has been published successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Publish Error', err?.message || 'Failed to publish assignment.');
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveDraft = () => {
    Alert.alert('Saved', 'Assignment draft has been saved.');
  };

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
                      uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAskjKz-2WijGA-I77PW9FcroZ1EFD19YvjBz8S-Fxj3RqVPT0GrX5ioNbig5tTlsAWM7HO745X15IXmXjc-Qv8tlrVgjpfyrHI3FYyDxEdpsXycWnp5XUwBlRoQRwbDZumPjlFcEkw9zXm-CEgkSrAB-V-eGYG2hSOCsGZGup33ayC9OCRyW79wfQNW89ZdnJLY9GVDStotIiI5WwGfcmzTdSMxdFATSc41ucjz7oSMWOV2tw8zY2n',
                    }}
                  />
                </View>
                <View>
                  <Text style={styles.drawerTeacherName}>Teacher Portal</Text>
                  <Text style={styles.drawerTeacherRole}>Academic Staff</Text>
                </View>
              </View>

              {/* Drawer Links */}
              <ScrollView style={styles.drawerNav}>
                <TouchableOpacity
                  style={styles.drawerNavItem}
                  activeOpacity={0.6}
                  onPress={() => {
                    setShowDrawer(false);
                    navigation.goBack();
                  }}
                >
                  <ProfileIcon size={22} color="#434654" />
                  <Text style={styles.drawerNavItemText}>Dashboard</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.drawerNavItem, styles.drawerNavItemActive]}
                  activeOpacity={0.6}
                  onPress={() => setShowDrawer(false)}
                >
                  <AssignmentIcon size={22} color="#005137" />
                  <Text style={[styles.drawerNavItemText, styles.drawerNavItemTextActive]}>
                    Assignments
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Header block */}
          <View style={styles.pageHeader}>
            <Text style={styles.headlineTitle}>Create Assignment</Text>
            <Text style={styles.headlineSubtitle}>
              Publish coursework and send notifications to your enrolled students.
            </Text>
          </View>

          {/* Title input */}
          <View style={styles.glassCard}>
            <Text style={styles.inputLabel}>ASSIGNMENT TITLE</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="e.g. Chapter 4 - Thermodynamics Exercises"
              placeholderTextColor="#737686"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Description input */}
          <View style={styles.glassCard}>
            <Text style={styles.inputLabel}>INSTRUCTIONS & DESCRIPTION</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Detailed instructions for the assignment..."
              placeholderTextColor="#737686"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Attachment upload area */}
          {selectedFile ? (
            <View style={styles.glassCard}>
              <Text style={styles.inputLabel}>ATTACHED FILE</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#121c28' }} numberOfLines={1}>
                    {selectedFile.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#737686', marginTop: 2 }}>
                    {selectedFile.size ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Selected'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedFile(null)} activeOpacity={0.7} style={{ padding: 6 }}>
                  <Text style={{ color: '#ba1a1a', fontWeight: '700', fontSize: 12 }}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadCard} activeOpacity={0.7} onPress={handleUpload}>
              <CloudUploadIcon size={36} color="#003fb1" />
              <Text style={styles.uploadTitle}>Upload Attachments</Text>
              <Text style={styles.uploadDesc}>
                Tap to browse files from your device (PDF, DOCX, ZIP, Images)
              </Text>
            </TouchableOpacity>
          )}

          {/* Configuration Card */}
          <View style={styles.glassCard}>
            {/* Target Class Dropdown */}
            <View style={styles.selectWrapper}>
              <Text style={styles.inputLabel}>TARGET CLASS</Text>
              <TouchableOpacity
                style={styles.dropdownSelector}
                activeOpacity={0.7}
                onPress={() => setShowClassDropdown(!showClassDropdown)}
              >
                <Text style={styles.dropdownText}>{selectedClassName}</Text>
                <ChevronRightIcon size={18} color="#003fb1" style={styles.rotate90} />
              </TouchableOpacity>

              {showClassDropdown && (
                <View style={styles.dropdownMenu}>
                  {classes.map((c) => {
                    const cName = `${c.name}${c.section ? `-${c.section}` : ''}`;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={styles.dropdownMenuItem}
                        onPress={() => {
                          setSelectedClassId(c.id);
                          setSelectedClassName(cName);
                          setShowClassDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownMenuItemText}>{cName}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Subject Selector */}
            <View style={styles.selectWrapper}>
              <Text style={styles.inputLabel}>SUBJECT</Text>
              <TouchableOpacity
                style={styles.dropdownSelector}
                activeOpacity={0.7}
                onPress={() => setShowSubjectDropdown(!showSubjectDropdown)}
              >
                <Text style={styles.dropdownText}>{selectedSubjectName}</Text>
                <ChevronRightIcon size={18} color="#003fb1" style={styles.rotate90} />
              </TouchableOpacity>

              {showSubjectDropdown && (
                <View style={styles.dropdownMenu}>
                  {subjects.map((subj) => (
                    <TouchableOpacity
                      key={subj.id}
                      style={styles.dropdownMenuItem}
                      onPress={() => {
                        setSelectedSubjectId(subj.id);
                        setSelectedSubjectName(subj.name);
                        setShowSubjectDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownMenuItemText}>{subj.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Due Date field */}
            <View style={styles.selectWrapper}>
              <Text style={styles.inputLabel}>DUE DATE</Text>
              <View style={styles.dateInputWrapper}>
                <TextInput
                  style={styles.dateInput}
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#737686"
                />
                <CalendarIcon size={20} color="#737686" style={styles.dateIcon} />
              </View>
            </View>
          </View>

          {/* Summary & Publish Box */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Max Points</Text>
              <Text style={styles.summaryValue}>100 pts</Text>
            </View>

            <TouchableOpacity
              style={styles.publishBtn}
              activeOpacity={0.8}
              onPress={handlePublish}
              disabled={publishing}
            >
              {publishing ? (
                <ActivityIndicator color="#003fb1" />
              ) : (
                <>
                  <SendIcon size={18} color="#003fb1" />
                  <Text style={styles.publishBtnText}>Publish Assignment</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveDraftBtn}
              activeOpacity={0.7}
              onPress={handleSaveDraft}
            >
              <Text style={styles.saveDraftBtnText}>Save as Draft</Text>
            </TouchableOpacity>
          </View>
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
  drawerNavItemActive: {
    backgroundColor: '#82f5c1',
  },
  drawerNavItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#434654',
  },
  drawerNavItemTextActive: {
    color: '#005137',
  },
  drawerDivider: {
    height: 1,
    backgroundColor: '#eeeff8',
    marginVertical: 12,
    marginHorizontal: 12,
  },
  drawerStatsWrapper: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  drawerStatsCard: {
    backgroundColor: '#003fb1',
    borderRadius: 12,
    padding: 14,
  },
  drawerStatsLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  drawerStatsValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drawerStatsValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  rotateIcon: {
    transform: [{ rotate: '-45deg' }],
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  pageHeader: {
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
  formContainer: {
    gap: 16,
  },
  glassCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 12,
    padding: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#003fb1',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  titleInput: {
    fontSize: 15,
    fontWeight: '600',
    color: '#121c28',
    borderBottomWidth: 1.5,
    borderBottomColor: '#737686',
    paddingVertical: 6,
    paddingHorizontal: 0,
  },
  descriptionInput: {
    backgroundColor: '#f8f9ff',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: '#121c28',
    minHeight: 120,
  },
  formatButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  formatBtn: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#e5eeff',
  },
  formatBtnTextBold: {
    fontWeight: '700',
    fontSize: 12,
    color: '#434654',
  },
  formatBtnTextItalic: {
    fontStyle: 'italic',
    fontSize: 12,
    color: '#434654',
  },
  formatBtnTextList: {
    fontSize: 12,
    color: '#434654',
  },
  formatBtnTextLink: {
    fontSize: 12,
    color: '#434654',
    textDecorationLine: 'underline',
  },
  uploadCard: {
    borderWidth: 1.5,
    borderColor: '#737686',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121c28',
    marginTop: 10,
  },
  uploadDesc: {
    fontSize: 11,
    color: '#737686',
    marginTop: 4,
    textAlign: 'center',
  },
  selectWrapper: {
    marginBottom: 16,
  },
  dropdownSelector: {
    height: 48,
    backgroundColor: '#f8f9ff',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  dropdownText: {
    fontSize: 13,
    color: '#121c28',
  },
  rotate90: {
    transform: [{ rotate: '90deg' }],
  },
  dropdownMenu: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeff8',
  },
  dropdownMenuItemText: {
    fontSize: 13,
    color: '#121c28',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: '#737686',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#003fb1',
    borderColor: '#003fb1',
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#121c28',
  },
  dateInputWrapper: {
    height: 48,
    backgroundColor: '#f8f9ff',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  dateInput: {
    flex: 1,
    fontSize: 13,
    color: '#121c28',
    padding: 0,
  },
  dateIcon: {
    marginLeft: 8,
  },
  summaryCard: {
    backgroundColor: '#003fb1',
    borderRadius: 12,
    padding: 20,
    gap: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  publishBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  publishBtnText: {
    color: '#003fb1',
    fontSize: 15,
    fontWeight: '700',
  },
  saveDraftBtn: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveDraftBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default AssignHomeworkScreen;
