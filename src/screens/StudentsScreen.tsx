import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Linking,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AirtableService } from '../services/airtable';
import { AuthService } from '../services/auth';
import PreloadService from '../services/preloadService';
import { AllStudent, Program } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { Colors as ThemeColors } from '../theme/colors';

export default function StudentsScreen() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [students, setStudents] = useState<AllStudent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<AllStudent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<AllStudent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Check for preloaded data first
      const preloadedPrograms = PreloadService.getPreloadedPrograms();
      const preloadedStudents = PreloadService.getPreloadedAllStudents();

      if (preloadedPrograms !== null && preloadedStudents !== null) {
        setPrograms(preloadedPrograms);
        setStudents(preloadedStudents);
        setFilteredStudents(preloadedStudents);
        setIsLoading(false);
        return;
      }

      // Otherwise, fetch from API
      // Get current user
      const authResult = await AuthService.getCurrentUserWithStaffInfo();
      if (!authResult?.userInfo) {
        Alert.alert('Error', 'Unable to get user information');
        return;
      }

      const userInfo = authResult.userInfo;

      // Get programs for this staff member
      const staffPrograms = await AirtableService.getStaffPrograms(userInfo.id);
      setPrograms(staffPrograms);

      // Get students for these programs
      if (staffPrograms.length > 0) {
        const programIds = staffPrograms.map(p => p.id);
        const programStudents = await AirtableService.getStudentsByPrograms(programIds);

        // Sort students alphabetically by name
        const sortedStudents = programStudents.sort((a, b) => {
          const nameA = a.Student?.toLowerCase() || '';
          const nameB = b.Student?.toLowerCase() || '';
          return nameA.localeCompare(nameB);
        });

        setStudents(sortedStudents);
        setFilteredStudents(sortedStudents);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load students. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter(student => {
      const studentName = student.Student?.toLowerCase() || '';
      const parentFirstName = student['Parent First Name']?.toLowerCase() || '';
      const parentLastName = student['Parent Last Name']?.toLowerCase() || '';
      const gradeLevel = student['Grade Level']?.toLowerCase() || '';
      const searchTerm = query.toLowerCase();

      return studentName.includes(searchTerm) ||
        parentFirstName.includes(searchTerm) ||
        parentLastName.includes(searchTerm) ||
        gradeLevel.includes(searchTerm);
    });

    setFilteredStudents(filtered);
  };

  const handleStudentPress = (student: AllStudent) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
  };

  const handleEmailPress = (email: string) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Error', 'Unable to open email app');
    });
  };

  const handlePhonePress = (phone: string) => {
    if (!phone) return;

    Alert.alert(
      'Contact',
      phone,
      [
        {
          text: 'Call',
          onPress: () => {
            Linking.openURL(`tel:${phone}`).catch(() => {
              Alert.alert('Error', 'Unable to make call');
            });
          },
        },
        {
          text: 'Text',
          onPress: () => {
            Linking.openURL(`sms:${phone}`).catch(() => {
              Alert.alert('Error', 'Unable to send text');
            });
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const renderStudentCard = ({ item }: { item: AllStudent }) => (
    <TouchableOpacity style={styles.studentCard} onPress={() => handleStudentPress(item)}>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.Student}</Text>
        {item['Grade Level'] && (
          <Text style={styles.studentGrade}>Grade: {item['Grade Level']}</Text>
        )}
        {item['Parent First Name'] && item['Parent Last Name'] && (
          <Text style={styles.studentParent}>
            {item['Parent First Name']} {item['Parent Last Name']}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderStudentDetail = () => {
    if (!selectedStudent) return null;

    const parentName = [selectedStudent['Parent First Name'], selectedStudent['Parent Last Name']]
      .filter(Boolean)
      .join(' ');

    return (
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDetailModal(false)}
            >
              <Ionicons name="close" size={28} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Student Details</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Student Information</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name:</Text>
                <Text style={styles.detailValue}>{selectedStudent.Student}</Text>
              </View>
              {selectedStudent['Grade Level'] && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Grade:</Text>
                  <Text style={styles.detailValue}>{selectedStudent['Grade Level']}</Text>
                </View>
              )}
            </View>

            {parentName && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Parent Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{parentName}</Text>
                </View>
                {selectedStudent['Parent Email'] && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue} selectable>{selectedStudent['Parent Email']}</Text>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => handleEmailPress(selectedStudent['Parent Email']!)}
                    >
                      <Ionicons name="mail-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}
                {selectedStudent['Parent Phone'] && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone:</Text>
                    <Text style={styles.detailValue} selectable>{selectedStudent['Parent Phone']}</Text>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => handlePhonePress(selectedStudent['Parent Phone']!)}
                    >
                      <Ionicons name="call-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading students...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Students</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by student or parent name..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor={colors.textSecondary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearSearchButton} onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.studentsSection}>
        <Text style={styles.sectionHeader}>
          Students ({filteredStudents.length})
        </Text>
        <FlatList
          data={filteredStudents}
          renderItem={renderStudentCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.studentsList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'No students found matching your search' : 'No students found'}
              </Text>
              {searchQuery && (
                <TouchableOpacity style={styles.clearButton} onPress={() => handleSearch('')}>
                  <Text style={styles.clearButtonText}>Clear Search</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      </View>

      {renderStudentDetail()}
    </View>
  );
}

const createStyles = (colors: typeof ThemeColors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.headerBackground,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.separator,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  programsSection: {
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  programHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  programHeaderText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: colors.background,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  clearSearchButton: {
    marginLeft: 8,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  studentsSection: {
    flex: 1,
    paddingTop: 16,
  },
  studentsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  studentGrade: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  studentParent: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  clearButton: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  clearButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.separator,
  },
  closeButton: {
    padding: 8,
    marginLeft: -8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 44,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 15,
    color: colors.textSecondary,
    width: 80,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
});
