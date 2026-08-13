import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import apiClient from '../../api/client';

export default function StudentReportCardScreen() {
  const [grades, setGrades] = useState<any[]>([]);
  const [examInfo, setExamInfo] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        // First get the available published exams
        const initRes = await apiClient.get(`/academic/results/my`);
        const publishedExams = initRes.data?.publishedExams || [];
        
        if (publishedExams.length > 0) {
          // Fetch the grades for the most recent exam
          const firstExamId = publishedExams[0].exam_id || publishedExams[0].id;
          const gradesRes = await apiClient.get(`/academic/results/my?examId=${firstExamId}`);
          setGrades(gradesRes.data?.grades || []);
          setExamInfo(gradesRes.data?.selectedExam || publishedExams[0]);
          setSummary(gradesRes.data?.summary || null);
        } else {
          setGrades([]);
        }
      } catch (error) {
        console.error('Failed to fetch report card:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, []);

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" color="#e65100" />;
  }

  return (
    <View style={styles.container}>
      {examInfo && (
        <View style={styles.examHeader}>
          <Text style={styles.examTitle}>{examInfo.title || 'Report Card'}</Text>
          {summary && (
            <Text style={styles.examSubtitle}>
              Total Score: {summary.totalObtained} / {summary.totalMax} ({summary.percentage}%)
            </Text>
          )}
        </View>
      )}
      
      <FlatList
        data={grades}
        keyExtractor={(item, index) => item.subject_id?.toString() || index.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.subject}>{item.subject_name || 'Unknown Subject'}</Text>
            <View style={styles.gradeRow}>
              <Text>Grade: <Text style={styles.bold}>{item.grade_letter || 'N/A'}</Text></Text>
              <Text>Score: <Text style={styles.bold}>{item.marks_obtained !== null ? item.marks_obtained : '--'}/{item.max_marks || 100}</Text></Text>
            </View>
            {item.remarks && <Text style={styles.remarks}>Remarks: {item.remarks}</Text>}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No published results available yet.</Text>}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f9ff' },
  loader: { flex: 1, justifyContent: 'center' },
  examHeader: { marginBottom: 16, padding: 16, backgroundColor: '#ffffff', borderRadius: 12, elevation: 1 },
  examTitle: { fontSize: 18, fontWeight: 'bold', color: '#121c28' },
  examSubtitle: { fontSize: 14, color: '#737686', marginTop: 4 },
  card: { padding: 16, backgroundColor: 'white', marginBottom: 12, borderRadius: 10, elevation: 1, borderWidth: 1, borderColor: '#eef0f6' },
  subject: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: '#1565c0' },
  gradeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  bold: { fontWeight: '700', color: '#121c28' },
  remarks: { fontStyle: 'italic', color: '#737686', marginTop: 4, fontSize: 12 },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 14, color: '#737686' }
});
