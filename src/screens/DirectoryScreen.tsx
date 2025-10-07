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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AirtableService } from '../services/airtable';
import { Leader } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { Colors as ThemeColors } from '../theme/colors';

interface DirectoryScreenProps {
  onBack: () => void;
}

export default function DirectoryScreen({ onBack }: DirectoryScreenProps) {
  const [staff, setStaff] = useState<Leader[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Leader[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const loadStaff = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading staff directory...');

      const allStaff = await AirtableService.getAllStaff();
      console.log('📱 Received staff data:', allStaff);

      setStaff(allStaff);
      setFilteredStaff(allStaff);
    } catch (error) {
      console.error('Error loading staff:', error);
      Alert.alert('Error', 'Failed to load staff directory. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredStaff(staff);
      return;
    }

    const filtered = staff.filter(person => {
      const fullName = person['Full Name']?.toLowerCase() || '';
      const firstName = person['First Name']?.toLowerCase() || '';
      const lastName = person['Last Name']?.toLowerCase() || '';
      const email = person['CHE Email']?.toLowerCase() || '';
      const campus = person['Type of Campus']?.toLowerCase() || '';

      const searchTerm = query.toLowerCase();

      return fullName.includes(searchTerm) ||
        firstName.includes(searchTerm) ||
        lastName.includes(searchTerm) ||
        email.includes(searchTerm) ||
        campus.includes(searchTerm);
    });

    setFilteredStaff(filtered);
  };

  const handleCall = (phone: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const phoneUrl = `tel:${cleanPhone}`;

    console.log('Calling:', phoneUrl);
    Alert.alert('Call', `Call ${phone}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call', onPress: () => console.log('Call initiated') },
    ]);
  };

  const handleEmail = (email: string) => {
    if (!email) return;
    const emailUrl = `mailto:${email}`;

    console.log('Emailing:', emailUrl);
    Alert.alert('Email', `Send email to ${email}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Email', onPress: () => console.log('Email initiated') },
    ]);
  };

  const renderStaffMember = ({ item }: { item: Leader }) => (
    <View style={styles.staffCard}>
      <View style={styles.staffInfo}>
        <Text style={styles.staffName}>{item['Full Name']}</Text>
        <Text style={styles.staffCampus}>{item['Type of Campus']}</Text>
        {item['CHE Email'] && <Text style={styles.staffEmail}>{item['CHE Email']}</Text>}
        {item.Phone && <Text style={styles.staffPhone}>{item.Phone}</Text>}
      </View>

      <View style={styles.actionButtons}>
        {item.Phone && (
          <TouchableOpacity style={styles.actionButton} onPress={() => handleCall(item.Phone)}>
            <Ionicons name="call" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
        {item['CHE Email'] && (
          <TouchableOpacity style={styles.actionButton} onPress={() => handleEmail(item['CHE Email'])}>
            <Ionicons name="mail" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyStateText}>
        {searchQuery ? 'No staff found matching your search' : 'No staff directory available'}
      </Text>
      {searchQuery && (
        <TouchableOpacity style={styles.clearButton} onPress={() => handleSearch('')}>
          <Text style={styles.clearButtonText}>Clear Search</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Campus Directory</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading directory...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Campus Directory</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or campus..."
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

      <FlatList
        data={filteredStaff}
        renderItem={renderStaffMember}
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
  flatListStyle: {
    backgroundColor: colors.background,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  staffCard: {
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
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  staffCampus: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  staffEmail: {
    fontSize: 15,
    color: colors.primary,
    marginBottom: 2,
  },
  staffPhone: {
    fontSize: 15,
    color: colors.text,
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
    marginLeft: 8,
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
