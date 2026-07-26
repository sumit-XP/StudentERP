import React, { useState } from 'react';
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
  ActivityIndicator,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

const CreateAnnouncementScreen: React.FC = () => {
  const navigation = useNavigation();
  const [targetClass, setTargetClass] = useState('Grade 10-B');
  const [category, setCategory] = useState('General');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [highPriority, setHighPriority] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please enter a title and announcement content.');
      return;
    }

    setPublishing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Alert.alert('Success', `Announcement successfully broadcasted to ${targetClass}!`, [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to publish announcement.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
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
          <Icon name="bell-outline" size={22} color="#003fb1" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title Block */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Broadcast Announcement</Text>
          <Text style={styles.sectionSubtitle}>
            Send an announcement or message to your classes.
          </Text>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          {/* Target Class Dropdown */}
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>RECIPIENT CLASS</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => {
                setShowClassDropdown(!showClassDropdown);
                setShowCategoryDropdown(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.triggerText}>{targetClass}</Text>
              <Icon name="chevron-down" size={18} color="#737686" />
            </TouchableOpacity>

            {showClassDropdown && (
              <View style={styles.dropdownList}>
                {['Grade 10-B', 'Grade 10-A', 'Grade 11-C', 'All Classes'].map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setTargetClass(item);
                      setShowClassDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        targetClass === item && styles.dropdownItemActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Category Dropdown */}
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>CATEGORY</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => {
                setShowCategoryDropdown(!showCategoryDropdown);
                setShowClassDropdown(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.triggerText}>{category}</Text>
              <Icon name="chevron-down" size={18} color="#737686" />
            </TouchableOpacity>

            {showCategoryDropdown && (
              <View style={styles.dropdownList}>
                {['General', 'Academic', 'Alert/Urgent', 'Event'].map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setCategory(item);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        category === item && styles.dropdownItemActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Announcement Title */}
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>TITLE</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Science Fair Registration"
              placeholderTextColor="#737686"
              editable={!publishing}
            />
          </View>

          {/* Announcement Content */}
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>ANNOUNCEMENT DETAILS</Text>
            <TextInput
              style={styles.contentInput}
              value={content}
              onChangeText={setContent}
              placeholder="Type class announcement details here..."
              placeholderTextColor="#737686"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              editable={!publishing}
            />
          </View>

          {/* Options Switches */}
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Send Email Copy</Text>
              <Text style={styles.switchDesc}>Send copies directly to student emails</Text>
            </View>
            <Switch
              value={sendEmail}
              onValueChange={setSendEmail}
              trackColor={{ false: '#c3c5d7', true: '#b5c4ff' }}
              thumbColor={sendEmail ? '#003fb1' : '#f8f9ff'}
              disabled={publishing}
            />
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Mark High Priority</Text>
              <Text style={styles.switchDesc}>Renders announcement with red urgency tags</Text>
            </View>
            <Switch
              value={highPriority}
              onValueChange={setHighPriority}
              trackColor={{ false: '#c3c5d7', true: '#ffdad6' }}
              thumbColor={highPriority ? '#ba1a1a' : '#f8f9ff'}
              disabled={publishing}
            />
          </View>

          {/* Attachments simulator */}
          <TouchableOpacity
            style={styles.attachmentBtn}
            onPress={() => Alert.alert('Attachment', 'Launching file picker simulator.')}
            disabled={publishing}
            activeOpacity={0.6}
          >
            <Icon name="paperclip" size={18} color="#003fb1" style={styles.btnIcon} />
            <Text style={styles.attachmentBtnText}>Attach Files (PDF, Images)</Text>
          </TouchableOpacity>

          {/* Publish / Cancel actions */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => navigation.goBack()}
              disabled={publishing}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.publishBtn}
              onPress={handlePublish}
              disabled={publishing}
              activeOpacity={0.85}
            >
              {publishing ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.publishText}>Publish Announcement</Text>
              )}
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
  formContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    zIndex: 10,
  },
  formGroup: {
    width: '100%',
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#003fb1',
    letterSpacing: 1,
    marginBottom: 6,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9ff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  triggerText: {
    fontSize: 14,
    color: '#121c28',
    fontWeight: '500',
  },
  dropdownList: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9ff',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#434654',
  },
  dropdownItemActive: {
    color: '#003fb1',
    fontWeight: '700',
  },
  titleInput: {
    backgroundColor: '#f8f9ff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#121c28',
  },
  contentInput: {
    backgroundColor: '#f8f9ff',
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 120,
    fontSize: 14,
    color: '#121c28',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#121c28',
  },
  switchDesc: {
    fontSize: 11,
    color: '#737686',
    marginTop: 2,
  },
  attachmentBtn: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#003fb1',
    borderRadius: 10,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnIcon: {
    marginRight: 6,
  },
  attachmentBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#003fb1',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#c3c5d7',
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#434654',
  },
  publishBtn: {
    flex: 2,
    backgroundColor: '#003fb1',
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#003fb1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  publishText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});

export default CreateAnnouncementScreen;
