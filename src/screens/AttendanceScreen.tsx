import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Colors as ThemeColors } from '../theme/colors';
import { AirtableService } from '../services/airtable';
import { AuthService } from '../services/auth';

interface Student {
  id: string;
  Student: string;
  studentName: string; // The entry ID name for creating records
  sessionDates: string[];
  hasClass: boolean;
  isAbsent: boolean;
  attendanceRecordId?: string;
}

export default function AttendanceScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const dateScrollRef = useRef<FlatList>(null);

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const authResult = await AuthService.getCurrentUserWithStaffInfo();
        if (authResult?.userInfo?.id) {
          setCurrentUserId(authResult.userInfo.id);
          console.log('👤 Current user ID:', authResult.userInfo.id);
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };
    getCurrentUser();
  }, []);

  // Generate dates for horizontal calendar (30 days before and after today)
  const dates = useMemo(() => {
    const result = [];
    const today = new Date();
    for (let i = -30; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      result.push(date);
    }
    return result;
  }, []);

  const formatDate = (date: Date): string => {
    // Format date in Denver timezone (America/Denver)
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Denver',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };

    const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;

    return `${year}-${month}-${day}`;
  };

  const loadStudentsForDate = useCallback(async (date: Date) => {
    try {
      const dateStr = formatDate(date);
      console.log('📅 Loading students for date:', dateStr);
      console.log('👤 Using leader ID for filter:', currentUserId);

      if (!currentUserId) {
        console.log('⚠️ No current user ID yet, skipping load');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fetch students and attendance records in parallel
      const [allStudents, attendanceRecords] = await Promise.all([
        AirtableService.getAllStudentsWithSessionDates(currentUserId),
        AirtableService.getAttendanceRecordsForDate(dateStr),
      ]);

      console.log('📊 ========== PROCESSING STUDENTS ==========');
      console.log('📊 All students:', allStudents.length);
      console.log('📊 Attendance records:', attendanceRecords.length);
      console.log('📊 Student IDs:', allStudents.map(s => s.id));
      console.log('📊 Attendance appIDs:', attendanceRecords.map(r => r.appID));

      // Process students
      const processedStudents: Student[] = allStudents.map(student => {
        const sessionDatesStr = student['S1 Session Dates Text Rollup (from Classes)'] || '';
        const sessionDates = sessionDatesStr
          ? sessionDatesStr.split(',').map(d => d.trim())
          : [];

        const hasClass = sessionDates.includes(dateStr);

        // Check if student is marked absent by matching record ID
        const attendanceRecord = attendanceRecords.find(
          record => record.appID === student.id
        );

        console.log('🔍 Student:', student.Student, 'ID:', student.id, 'Attendance Record Found:', !!attendanceRecord);

        return {
          id: student.id,
          Student: student.Student,
          studentName: student.studentName,
          sessionDates,
          hasClass,
          isAbsent: !!attendanceRecord,
          attendanceRecordId: attendanceRecord?.id,
        };
      });

      setStudents(processedStudents);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      loadStudentsForDate(selectedDate);
    }
  }, [selectedDate, currentUserId, loadStudentsForDate]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStudentsForDate(selectedDate);
  }, [selectedDate, loadStudentsForDate]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setLoading(true);
  };

  const toggleAbsent = async (student: Student) => {
    if (!student.hasClass) return; // Can't mark absent if no class

    try {
      const dateStr = formatDate(selectedDate);

      if (student.isAbsent && student.attendanceRecordId) {
        // Remove absent mark
        await AirtableService.deleteAttendanceRecord(student.attendanceRecordId);

        // Update local state
        setStudents(prev =>
          prev.map(s =>
            s.id === student.id
              ? { ...s, isAbsent: false, attendanceRecordId: undefined }
              : s
          )
        );
      } else {
        // Mark as absent - pass student name and synced table record ID
        const record = await AirtableService.createAttendanceRecord(
          dateStr,
          student.studentName,
          student.id // Pass the synced table record ID for appID field
        );

        // Update local state
        setStudents(prev =>
          prev.map(s =>
            s.id === student.id
              ? { ...s, isAbsent: true, attendanceRecordId: record.id }
              : s
          )
        );
      }
    } catch (error) {
      console.error('Error toggling absent:', error);
    }
  };

  const renderDateItem = ({ item: date, index }: { item: Date; index: number }) => {
    const isSelected = formatDate(date) === formatDate(selectedDate);
    const isToday = formatDate(date) === formatDate(new Date());

    return (
      <TouchableOpacity
        style={[
          styles.dateItem,
          isSelected && styles.dateItemSelected,
          isToday && !isSelected && styles.dateItemToday,
        ]}
        onPress={() => handleDateChange(date)}
      >
        <Text
          style={[
            styles.dateDay,
            isSelected && styles.dateTextSelected,
          ]}
        >
          {date.getDate()}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderStudentItem = ({ item: student }: { item: Student }) => {
    return (
      <View style={styles.studentRow}>
        <Text style={styles.studentName}>{student.Student}</Text>
        {student.hasClass ? (
          <TouchableOpacity
            style={[
              styles.checkbox,
              student.isAbsent && styles.checkboxAbsent,
            ]}
            onPress={() => toggleAbsent(student)}
          >
            {student.isAbsent && (
              <Text style={styles.absentText}>A</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.nsBox}>
            <Text style={styles.nsText}>NS</Text>
          </View>
        )}
      </View>
    );
  };

  // Scroll to today on mount
  useEffect(() => {
    const todayIndex = dates.findIndex(
      date => formatDate(date) === formatDate(new Date())
    );
    if (todayIndex !== -1 && dateScrollRef.current) {
      setTimeout(() => {
        dateScrollRef.current?.scrollToIndex({
          index: todayIndex,
          animated: false,
          viewPosition: 0.5,
        });
      }, 100);
    }
  }, [dates]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance</Text>
        <Text style={styles.headerSubtitle}>
          {selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </View>

      {/* Horizontal Date Picker */}
      <FlatList
        ref={dateScrollRef}
        horizontal
        data={dates}
        renderItem={renderDateItem}
        keyExtractor={(item) => formatDate(item)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateList}
        getItemLayout={(data, index) => ({
          length: 62,
          offset: 62 * index,
          index,
        })}
        onScrollToIndexFailed={() => {}}
      />

      {/* Student List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={students}
          renderItem={renderStudentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.studentList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof ThemeColors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 20,
      paddingBottom: 16,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    dateList: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    dateItem: {
      width: 50,
      height: 50,
      marginHorizontal: 6,
      borderRadius: 25,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.separator,
    },
    dateItemSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    dateItemToday: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    dateDay: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    dateTextSelected: {
      color: '#FFFFFF',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    studentList: {
      padding: 20,
    },
    studentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: colors.card,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    studentName: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
      fontWeight: '500',
    },
    checkbox: {
      width: 40,
      height: 40,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.separator,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    checkboxAbsent: {
      backgroundColor: '#FED7D7',
      borderColor: '#F87171',
    },
    absentText: {
      fontSize: 20,
      fontWeight: '700',
      color: '#7C2D12',
    },
    nsBox: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    nsText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
  });
