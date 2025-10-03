import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AirtableService } from '../services/airtable';
import { Leader, AppUser, AnyUser } from '../types';

interface UserSelectionScreenProps {
  onBack: () => void;
  onUserSelect: (user: AnyUser) => void;
}

export default function UserSelectionScreen({ onBack, onUserSelect }: UserSelectionScreenProps) {
  const [allUsers, setAllUsers] = useState<AnyUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AnyUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading all users for messaging...');
      
      // Get both staff and users
      const [staff, users] = await Promise.all([
        AirtableService.getAllStaff(),
        AirtableService.getAllUsers(),
      ]);
      
      const combinedUsers = [...staff, ...users];
      console.log('📱 Loaded users:', combinedUsers.length);
      
      setAllUsers(combinedUsers);
      setFilteredUsers(combinedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredUsers(allUsers);
      return;
    }

    const filtered = allUsers.filter(user => {
      const fullName = user['Full Name']?.toLowerCase() || '';
      const firstName = user['First Name']?.toLowerCase() || '';
      const lastName = user['Last Name']?.toLowerCase() || '';
      const email = ('CHE Email' in user ? user['CHE Email'] : user['Email'])?.toLowerCase() || '';
      const userType = ('Type of Campus' in user ? user['Type of Campus'] : user['User Type'])?.toLowerCase() || '';
      
      const searchTerm = query.toLowerCase();
      
      return fullName.includes(searchTerm) ||
             firstName.includes(searchTerm) ||
             lastName.includes(searchTerm) ||
             email.includes(searchTerm) ||
             userType.includes(searchTerm);
    });

    setFilteredUsers(filtered);
  };

  const handleUserSelect = (user: AnyUser) => {
    onUserSelect(user);
  };

  const getUserDisplayName = (user: AnyUser) => {
    return user['Full Name'] || 'Unknown User';
  };

  const getUserEmail = (user: AnyUser) => {
    return 'CHE Email' in user ? user['CHE Email'] : user['Email'];
  };

  const getUserType = (user: AnyUser) => {
    return 'Type of Campus' in user ? user['Type of Campus'] : user['User Type'];
  };

  const getUserProfilePic = (user: AnyUser) => {
    return user.ProfilePic;
  };

  const renderUser = ({ item }: { item: AnyUser }) => {
    const displayName = getUserDisplayName(item);
    const email = getUserEmail(item);
    const userType = getUserType(item);
    const profilePic = getUserProfilePic(item);
    const isSelected = selectedUsers.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.userCard, isSelected && styles.selectedUserCard]}
        onPress={() => handleUserSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.userInfo}>
          <View style={styles.profileImageContainer}>
            {profilePic ? (
              <Image 
                source={{ uri: Array.isArray(profilePic) ? profilePic[0]?.url : profilePic }} 
                style={styles.profileImage}
                onError={() => console.log('Failed to load profile image')}
              />
            ) : (
              <View style={styles.defaultProfileImage}>
                <Ionicons name="person" size={24} color="#007AFF" />
              </View>
            )}
          </View>
          
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userEmail}>{email}</Text>
            <View style={styles.userTypeContainer}>
              <Text style={styles.userType}>{userType}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.userActions}>
          <Ionicons 
            name={isSelected ? "checkmark-circle" : "chevron-forward"} 
            size={24} 
            color={isSelected ? "#007AFF" : "#8e8e93"} 
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color="#c7c7cc" />
      <Text style={styles.emptyStateText}>
        {searchQuery ? 'No users found matching your search' : 'No users available'}
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
          <Text style={styles.headerTitle}>Select User</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading users...</Text>
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
        <Text style={styles.headerTitle}>Select User</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#8e8e93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
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

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
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
    backgroundColor: '#f2f2f7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f2f7',
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
    backgroundColor: '#f2f2f7',
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
    backgroundColor: '#f2f2f7',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  userCard: {
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
  selectedUserCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginRight: 12,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  defaultProfileImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 4,
  },
  userTypeContainer: {
    alignSelf: 'flex-start',
  },
  userType: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    fontWeight: '500',
  },
  userActions: {
    marginLeft: 12,
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
