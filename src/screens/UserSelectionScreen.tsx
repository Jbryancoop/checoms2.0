import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { AnyUser } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { Colors as ThemeColors } from '../theme/colors';

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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading all users for messaging...');

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

      return (
        fullName.includes(searchTerm) ||
        firstName.includes(searchTerm) ||
        lastName.includes(searchTerm) ||
        email.includes(searchTerm) ||
        userType.includes(searchTerm)
      );
    });

    setFilteredUsers(filtered);
  };

  const handleUserSelectInternal = (user: AnyUser) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(user.id)) {
      newSelection.delete(user.id);
    } else {
      newSelection.add(user.id);
    }
    setSelectedUsers(newSelection);
    onUserSelect(user);
  };

  const getUserDisplayName = (user: AnyUser) => user['Full Name'] || 'Unknown User';

  const getUserEmail = (user: AnyUser) => ('CHE Email' in user ? user['CHE Email'] : user['Email']) || '';

  const getUserType = (user: AnyUser) => ('Type of Campus' in user ? user['Type of Campus'] : user['User Type']) || '';

  const getUserProfilePic = (user: AnyUser) => user.ProfilePic;

  const renderUser = ({ item }: { item: AnyUser }) => {
    const displayName = getUserDisplayName(item);
    const email = getUserEmail(item);
    const userType = getUserType(item);
    const profilePic = getUserProfilePic(item);
    const isSelected = selectedUsers.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.userCard, isSelected && styles.selectedUserCard]}
        onPress={() => handleUserSelectInternal(item)}
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
                <Ionicons name="person" size={24} color={colors.primary} />
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
            name={isSelected ? 'checkmark-circle' : 'chevron-forward'}
            size={24}
            color={isSelected ? colors.primary : colors.textSecondary}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
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
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select User</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading users...</Text>
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
        <Text style={styles.headerTitle}>Select User</Text>
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
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        style={styles.flatList}
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
  flatList: {
    backgroundColor: colors.background,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  userCard: {
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
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  selectedUserCard: {
    borderColor: colors.primary,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: colors.surface,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  defaultProfileImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  userTypeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  userType: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  clearButton: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearButtonText: {
    color: colors.primaryText,
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
