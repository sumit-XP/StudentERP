import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  ScrollView,
  Alert
} from 'react-native';
import apiClient from '../../api/client';

export default function AdminClassesScreen() {
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [section, setSection] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [classTeacherId, setClassTeacherId] = useState('');

  // Edit Modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingClassId, setEditingClassId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editGradeLevel, setEditGradeLevel] = useState('');
  const [editSection, setEditSection] = useState('');
  const [editAcademicYearId, setEditAcademicYearId] = useState('');
  const [editClassTeacherId, setEditClassTeacherId] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, tRes, yRes] = await Promise.all([
        apiClient.get('/academic/classes'),
        apiClient.get('/academic/teachers?limit=1000').catch(() => ({ data: { teachers: [] } })),
        apiClient.get('/academic/academic-years').catch(() => ({ data: { academicYears: [] } }))
      ]);

      const classData = cRes.data?.classes || (Array.isArray(cRes.data) ? cRes.data : []);
      setClasses(classData);
      setTeachers(tRes.data?.teachers || []);
      const years = yRes.data?.academicYears || [];
      setAcademicYears(years);
      if (years.length > 0 && !academicYearId) {
        setAcademicYearId(String(years[0].id));
      }
    } catch (error) {
      console.error('Error fetching class data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddClass = async () => {
    if (!name.trim() || !gradeLevel.trim()) {
      Alert.alert('Validation Error', 'Please provide class name and grade level.');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/academic/classes', {
        name: name.trim(),
        gradeLevel: Number(gradeLevel),
        section: section.trim(),
        academicYearId: academicYearId ? Number(academicYearId) : null,
        classTeacherId: classTeacherId ? Number(classTeacherId) : null
      });
      setCreateModalVisible(false);
      setName('');
      setGradeLevel('');
      setSection('');
      setClassTeacherId('');
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Failed to create class');
    }
    setSaving(false);
  };

  const openEditModal = (cls: any) => {
    setEditingClassId(cls.id);
    setEditName(cls.name || '');
    setEditGradeLevel(cls.grade_level ? String(cls.grade_level) : (cls.gradeLevel ? String(cls.gradeLevel) : ''));
    setEditSection(cls.section || '');
    setEditAcademicYearId(cls.academic_year_id ? String(cls.academic_year_id) : '');
    setEditClassTeacherId(cls.class_teacher_id ? String(cls.class_teacher_id) : '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingClassId) return;
    if (!editName.trim() || !editGradeLevel.trim()) {
      Alert.alert('Validation Error', 'Class name and grade level are required.');
      return;
    }

    setSaving(true);
    try {
      await apiClient.put(`/academic/classes/${editingClassId}`, {
        name: editName.trim(),
        gradeLevel: Number(editGradeLevel),
        section: editSection.trim(),
        academicYearId: editAcademicYearId ? Number(editAcademicYearId) : null,
        classTeacherId: editClassTeacherId ? Number(editClassTeacherId) : null
      });
      setEditModalVisible(false);
      setEditingClassId(null);
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Failed to update class');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6200ea" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={classes}
        keyExtractor={(item) => String(item.id || Math.random())}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.subtitle}>
                  Grade {item.grade_level || item.gradeLevel} {item.section ? `• Sec ${item.section}` : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => openEditModal(item)}
              >
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Class Teacher:</Text>
              <Text style={[
                styles.infoValue,
                item.class_teacher_name ? styles.teacherAssigned : styles.teacherUnassigned
              ]}>
                {item.class_teacher_name || 'Unassigned'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Academic Year:</Text>
              <Text style={styles.infoValue}>{item.year_name || '-'}</Text>
            </View>

            {item.student_count !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Students:</Text>
                <Text style={styles.infoValue}>{item.student_count}</Text>
              </View>
            )}
          </View>
        )}
      />

      {/* FAB to Add Class */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setCreateModalVisible(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* CREATE CLASS MODAL */}
      <Modal visible={createModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>Create Class</Text>

              <Text style={styles.label}>Class Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Class 10-A"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Grade Level *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 10"
                keyboardType="numeric"
                value={gradeLevel}
                onChangeText={setGradeLevel}
              />

              <Text style={styles.label}>Section</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. A"
                value={section}
                onChangeText={setSection}
              />

              {/* Academic Year Selector */}
              <Text style={styles.label}>Academic Year</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                {academicYears.map((ay) => (
                  <TouchableOpacity
                    key={ay.id}
                    style={[
                      styles.chip,
                      academicYearId === String(ay.id) && styles.chipSelected
                    ]}
                    onPress={() => setAcademicYearId(String(ay.id))}
                  >
                    <Text style={[
                      styles.chipText,
                      academicYearId === String(ay.id) && styles.chipTextSelected
                    ]}>
                      {ay.year_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Class Teacher Selector */}
              <Text style={styles.label}>Class Teacher (Optional)</Text>
              <ScrollView style={styles.teacherListScroll} nestedScrollEnabled>
                <TouchableOpacity
                  style={[
                    styles.teacherOption,
                    classTeacherId === '' && styles.teacherOptionSelected
                  ]}
                  onPress={() => setClassTeacherId('')}
                >
                  <Text style={classTeacherId === '' ? styles.teacherOptionTextSelected : styles.teacherOptionText}>
                    -- None (Unassigned) --
                  </Text>
                </TouchableOpacity>
                {teachers.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.teacherOption,
                      classTeacherId === String(t.user_id) && styles.teacherOptionSelected
                    ]}
                    onPress={() => setClassTeacherId(String(t.user_id))}
                  >
                    <Text style={classTeacherId === String(t.user_id) ? styles.teacherOptionTextSelected : styles.teacherOptionText}>
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.btn, styles.cancelBtn]}
                  onPress={() => setCreateModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.saveBtn]}
                  onPress={handleAddClass}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>Create</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* EDIT CLASS MODAL */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>Edit Class & Class Teacher</Text>

              <Text style={styles.label}>Class Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={editName}
                onChangeText={setEditName}
              />

              <Text style={styles.label}>Grade Level *</Text>
              <TextInput
                style={styles.input}
                placeholder="Grade Level"
                keyboardType="numeric"
                value={editGradeLevel}
                onChangeText={setEditGradeLevel}
              />

              <Text style={styles.label}>Section</Text>
              <TextInput
                style={styles.input}
                placeholder="Section"
                value={editSection}
                onChangeText={setEditSection}
              />

              {/* Academic Year Selector */}
              <Text style={styles.label}>Academic Year</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                {academicYears.map((ay) => (
                  <TouchableOpacity
                    key={ay.id}
                    style={[
                      styles.chip,
                      editAcademicYearId === String(ay.id) && styles.chipSelected
                    ]}
                    onPress={() => setEditAcademicYearId(String(ay.id))}
                  >
                    <Text style={[
                      styles.chipText,
                      editAcademicYearId === String(ay.id) && styles.chipTextSelected
                    ]}>
                      {ay.year_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Class Teacher Selector */}
              <Text style={styles.label}>Assign Class Teacher</Text>
              <ScrollView style={styles.teacherListScroll} nestedScrollEnabled>
                <TouchableOpacity
                  style={[
                    styles.teacherOption,
                    editClassTeacherId === '' && styles.teacherOptionSelected
                  ]}
                  onPress={() => setEditClassTeacherId('')}
                >
                  <Text style={editClassTeacherId === '' ? styles.teacherOptionTextSelected : styles.teacherOptionText}>
                    -- None (Unassigned) --
                  </Text>
                </TouchableOpacity>
                {teachers.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.teacherOption,
                      editClassTeacherId === String(t.user_id) && styles.teacherOptionSelected
                    ]}
                    onPress={() => setEditClassTeacherId(String(t.user_id))}
                  >
                    <Text style={editClassTeacherId === String(t.user_id) ? styles.teacherOptionTextSelected : styles.teacherOptionText}>
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.btn, styles.cancelBtn]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.saveBtn]}
                  onPress={handleSaveEdit}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f9fa' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  subtitle: { fontSize: 13, color: '#6c757d', marginTop: 2 },
  editBtn: { backgroundColor: '#6200ea15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  editBtnText: { color: '#6200ea', fontWeight: '600', fontSize: 13 },
  divider: { height: 1, backgroundColor: '#f1f3f5', marginVertical: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 },
  infoLabel: { fontSize: 13, color: '#6c757d' },
  infoValue: { fontSize: 13, fontWeight: '500', color: '#212529' },
  teacherAssigned: { color: '#2e7d32', fontWeight: '600' },
  teacherUnassigned: { color: '#d32f2f', italic: 'italic' } as any,
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6200ea',
    justify: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#6200ea',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: { color: 'white', fontSize: 28, fontWeight: '400', marginTop: -2 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 16 },
  modalContent: { backgroundColor: 'white', borderRadius: 16, padding: 20, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#495057', marginTop: 10, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ced4da', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, fontSize: 14, backgroundColor: '#fdfdfd' },
  pickerScroll: { marginVertical: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#e9ecef', marginRight: 8 },
  chipSelected: { backgroundColor: '#6200ea' },
  chipText: { fontSize: 12, color: '#495057', fontWeight: '500' },
  chipTextSelected: { color: '#ffffff', fontWeight: '600' },
  teacherListScroll: { maxHeight: 120, borderWidth: 1, borderColor: '#ced4da', borderRadius: 8, marginTop: 4 },
  teacherOption: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#f1f3f5' },
  teacherOptionSelected: { backgroundColor: '#6200ea15' },
  teacherOptionText: { fontSize: 13, color: '#212529' },
  teacherOptionTextSelected: { fontSize: 13, color: '#6200ea', fontWeight: '700' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, minWidth: 80, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#e9ecef' },
  cancelBtnText: { color: '#495057', fontWeight: '600', fontSize: 14 },
  saveBtn: { backgroundColor: '#6200ea' },
  saveBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
});
