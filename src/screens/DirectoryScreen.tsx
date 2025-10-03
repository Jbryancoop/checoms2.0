import React, { useState, useEffect, useCallback } from 'react';
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

interface DirectoryScreenProps {
  onBack: () => void;
}

export default function DirectoryScreen({ onBack }: DirectoryScreenProps) {
  const [staff, setStaff] = useState<Leader[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Leader[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadStaff = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading staff directory...');
      
      // Get all staff from the Leaders table
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
    if (phone) {
      // Remove any non-digit characters except + for international numbers
      const cleanPhone = phone.replace(/[^\d+]/g, '');
      const phoneUrl = `tel:${cleanPhone}`;
      
      // You can use Linking.openURL here if needed
      console.log('Calling:', phoneUrl);
      Alert.alert('Call', `Call ${phone}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => console.log('Call initiated') }
      ]);
    }
  };

  const handleEmail = (email: string) => {
    if (email) {
      const emailUrl = `mailto:${email}`;
      console.log('Emailing:', emailUrl);
      Alert.alert('Email', `Send email to ${email}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Email', onPress: () => console.log('Email initiated') }
      ]);
    }
  };

  const renderStaffMember = ({ item }: { item: Leader }) => (
    <View style={styles.staffCard}>
      <View style={styles.staffInfo}>
        <Text style={styles.staffName}>{item['Full Name']}</Text>
        <Text style={styles.staffCampus}>{item['Type of Campus']}</Text>
        {item['CHE Email'] && (
          <Text style={styles.staffEmail}>{item['CHE Email']}</Text>
        )}
        {item.Phone && (
          <Text style={styles.staffPhone}>{item.Phone}</Text>
        )}
      </View>
      
      <View style={styles.actionButtons}>
        {item.Phone && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleCall(item.Phone)}
          >
            <Ionicons name="call" size={20} color="#007AFF" />
          </TouchableOpacity>
        )}
        {item['CHE Email'] && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEmail(item['CHE Email'])}
          >
            <Ionicons name="mail" size={20} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color="#c7c7cc" />
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
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Campus Directory</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading directory...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Campus Directory</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#8e8e93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or campus..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#8e8e93"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => handleSearch('')}
            >
              <Ionicons name="close-circle" size={20} color="#8e8e93" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Staff List */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e5e5ea',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e5e5ea',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#c6c6c8',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#e5e5ea',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  clearSearchButton: {
    marginLeft: 8,
  },
  flatListStyle: {
    backgroundColor: '#e5e5ea',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  staffCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  staffCampus: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  staffEmail: {
    fontSize: 15,
    color: '#007AFF',
    marginBottom: 2,
  },
  staffPhone: {
    fontSize: 15,
    color: '#1c1c1e',
  },
  actionButtons: {
    flexDirection: 'row',
    marginLeft: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f2f2f7',
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
    color: '#8e8e93',
    textAlign: 'center',
    marginBottom: 16,
  },
  clearButton: {
    backgroundColor: '#f2f2f7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#007AFF',
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
    color: '#8e8e93',
  },
});
