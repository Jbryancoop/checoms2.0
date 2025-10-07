import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AirtableService } from '../services/airtable';
import { AuthService } from '../services/auth';
import { Student, Leader } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { Colors as ThemeColors } from '../theme/colors';

interface WaiversScreenProps {
  onBack: () => void;
}

export default function WaiversScreen({ onBack }: WaiversScreenProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [waiverLink, setWaiverLink] = useState<string | null>(null);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const loadStudents = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading students with waivers...');

      // Load current user to get waiver link
      const authResult = await AuthService.getCurrentUserWithStaffInfo();
      console.log('🔍 Auth result:', authResult);
      console.log('🔍 User info type:', typeof authResult?.userInfo);
      console.log('🔍 User info keys:', authResult?.userInfo ? Object.keys(authResult.userInfo) : 'none');
      console.log('🔍 User info (full):', JSON.stringify(authResult?.userInfo, null, 2));

      if (authResult) {
        console.log('🔍 Has nonCheStudentWaiverLink property?', 'nonCheStudentWaiverLink' in authResult.userInfo);

        if ('nonCheStudentWaiverLink' in authResult.userInfo) {
          const leader = authResult.userInfo as Leader;
          console.log('🔍 Leader waiver link value:', leader.nonCheStudentWaiverLink);
          console.log('🔍 Leader waiver link type:', typeof leader.nonCheStudentWaiverLink);
          console.log('🔍 Leader waiver link truthy?', !!leader.nonCheStudentWaiverLink);

          const linkValue = leader.nonCheStudentWaiverLink || null;
          console.log('🔍 Setting waiver link to:', linkValue);
          setWaiverLink(linkValue);
        } else {
          console.log('❌ No nonCheStudentWaiverLink field found in user info');
          console.log('❌ Available fields:', Object.keys(authResult.userInfo));
        }
      } else {
        console.log('❌ No auth result');
      }

      const allStudents = await AirtableService.getAllStudents();
      console.log('📱 Received student data:', allStudents);

      // Sort by last name (extract last word from Name field)
      const sortedStudents = allStudents.sort((a, b) => {
        const lastNameA = a.Name?.split(' ').pop()?.toLowerCase() || '';
        const lastNameB = b.Name?.split(' ').pop()?.toLowerCase() || '';
        return lastNameA.localeCompare(lastNameB);
      });

      setStudents(sortedStudents);
      setFilteredStudents(sortedStudents);
    } catch (error) {
      console.error('Error loading students:', error);
      Alert.alert('Error', 'Failed to load student waivers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Log whenever waiverLink changes
  useEffect(() => {
    console.log('📌 waiverLink state changed to:', waiverLink);
    console.log('📌 waiverLink is truthy?', !!waiverLink);
    console.log('📌 Should show button?', !!waiverLink);
  }, [waiverLink]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter(student => {
      const name = student.Name?.toLowerCase() || '';
      // Parent Name and Parent Email are lookup fields (arrays)
      const parentName = Array.isArray(student['Parent Name'])
        ? student['Parent Name'].join(' ').toLowerCase()
        : (student['Parent Name'] || '').toLowerCase();
      const parentEmail = Array.isArray(student['Parent Email'])
        ? student['Parent Email'].join(' ').toLowerCase()
        : (student['Parent Email'] || '').toLowerCase();
      const searchTerm = query.toLowerCase();

      return name.includes(searchTerm) ||
        parentName.includes(searchTerm) ||
        parentEmail.includes(searchTerm);
    });

    setFilteredStudents(filtered);
  };

  const handleViewWaiver = (student: Student) => {
    if (!student.Waiver || student.Waiver.length === 0) {
      Alert.alert('No Waiver', 'This student does not have a waiver on file.');
      return;
    }

    const waiverUrl = student.Waiver[0].url;
    Linking.openURL(waiverUrl).catch(() => {
      Alert.alert('Error', 'Failed to open waiver document.');
    });
  };

  const handleSendWaiver = async () => {
    if (!waiverLink) {
      Alert.alert('Not Available', 'Waiver link not available for your account.');
      return;
    }

    try {
      await Share.share({
        message: `Please complete this liability waiver:\n${waiverLink.trim()}`,
        url: waiverLink.trim(), // iOS can share URLs directly
        title: 'CHE Liability Waiver',
      });
    } catch (error) {
      console.error('Error sharing waiver:', error);
      Alert.alert('Error', 'Failed to share waiver link.');
    }
  };

  const renderStudentCard = ({ item }: { item: Student }) => {
    // Handle lookup fields that return arrays
    const parentName = Array.isArray(item['Parent Name'])
      ? item['Parent Name'][0]
      : item['Parent Name'];

    return (
      <View style={styles.studentCard}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.Name}</Text>
          {item.Date && <Text style={styles.studentDate}>Signed: {new Date(item.Date).toLocaleDateString()}</Text>}
          {parentName && <Text style={styles.studentParent}>{parentName}</Text>}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              (!item.Waiver || item.Waiver.length === 0) && styles.actionButtonDisabled
            ]}
            onPress={() => handleViewWaiver(item)}
            disabled={!item.Waiver || item.Waiver.length === 0}
          >
            <Ionicons
              name="document-text"
              size={20}
              color={(!item.Waiver || item.Waiver.length === 0) ? colors.textSecondary : colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyStateText}>
        {searchQuery ? 'No students found matching your search' : 'No student waivers available'}
      </Text>
      {searchQuery && (
        <TouchableOpacity style={styles.clearButton} onPress={() => handleSearch('')}>
          <Text style={styles.clearButtonText}>Clear Search</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    console.log('🔄 Rendering: Loading state');
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Liability Waivers</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading waivers...</Text>
        </View>
      </View>
    );
  }

  console.log('🔄 Rendering: Main view');
  console.log('🔄 waiverLink value in render:', waiverLink);
  console.log('🔄 Will render Send Waiver button?', !!waiverLink);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Liability Waivers</Text>
        <View style={styles.placeholder} />
      </View>

      {console.log('🔄 Conditional check for button - waiverLink:', waiverLink, 'truthy:', !!waiverLink)}
      {waiverLink ? (
        <>
          {console.log('✅ Rendering Send Waiver button!')}
          <View style={styles.sendWaiverContainer}>
            <TouchableOpacity style={styles.sendWaiverButton} onPress={handleSendWaiver}>
              <Ionicons name="send-outline" size={16} color={colors.primary} />
              <Text style={styles.sendWaiverText}>Send Waiver</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          {console.log('❌ NOT rendering Send Waiver button - waiverLink is:', waiverLink)}
        </>
      )}

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

      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'}
        </Text>
      </View>

      <FlatList
        data={filteredStudents}
        renderItem={renderStudentCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        style={styles.flatListStyle}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const createStyles = (colors: typeof ThemeColors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
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
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  sendWaiverContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 0,
    backgroundColor: colors.background,
  },
  sendWaiverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.separator,
    backgroundColor: colors.surface,
  },
  sendWaiverText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 6,
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
  infoBar: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  flatListStyle: {
    backgroundColor: colors.background,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  studentCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
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
  studentDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  studentParent: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    marginLeft: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.4,
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
});
