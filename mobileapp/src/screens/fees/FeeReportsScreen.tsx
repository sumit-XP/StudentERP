import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import apiClient from '../../api/client';

type ReportTab = 'dues' | 'defaulters' | 'collections';

const TABS: ReportTab[] = ['dues', 'defaulters', 'collections'];
const ENDPOINTS: Record<ReportTab, string> = {
  dues: '/fees/reports/dues',
  defaulters: '/fees/reports/defaulters',
  collections: '/fees/reports/collections',
};

const FeeReportsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('dues');
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(ENDPOINTS[activeTab]);
      const result = res.data as { data?: Record<string, unknown>[] } | Record<string, unknown>[];
      setData(
        Array.isArray(result)
          ? result
          : (result as { data?: Record<string, unknown>[] }).data ?? [],
      );
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Fee Reports</Text>
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => {
              setActiveTab(tab);
              setData([]);
            }}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.loadBtn} onPress={load} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.loadBtnText}>Load {activeTab}</Text>
        )}
      </TouchableOpacity>
      <FlatList
        data={data}
        keyExtractor={(_, i) => String(i)}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>No data. Tap Load to fetch.</Text> : null
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            {Object.entries(item).map(([k, v]) => (
              <Text key={k} style={styles.rowText}>
                {k}: {typeof v === 'object' ? JSON.stringify(v) : String(v)}
              </Text>
            ))}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  heading: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 16 },
  tabs: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    padding: 4,
  },
  tab: { flex: 1, padding: 8, alignItems: 'center', borderRadius: 6 },
  tabActive: { backgroundColor: '#1565c0' },
  tabText: { fontSize: 13, color: '#555', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  loadBtn: {
    backgroundColor: '#1565c0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  loadBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  row: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
  },
  rowText: { fontSize: 13, color: '#333', marginBottom: 2 },
  empty: { textAlign: 'center', color: '#999', marginTop: 32 },
});

export default FeeReportsScreen;
