import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '../services/auth';
import { Leader } from '../types';

interface ProfileScreenProps {
  onLogout: () => void;
}

export default function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const [staffInfo, setStaffInfo] = useState<Leader | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStaffInfo();
  }, []);

  const loadStaffInfo = async () => {
    try {
      setIsLoading(true);
      const authResult = await AuthService.getCurrentUserWithStaffInfo();
      if (authResult) {
        console.log('📸 ProfilePic data:', authResult.staffInfo.ProfilePic);
        console.log('📸 ProfilePic type:', typeof authResult.staffInfo.ProfilePic);
        console.log('📸 ProfilePic is array:', Array.isArray(authResult.staffInfo.ProfilePic));
        setStaffInfo(authResult.staffInfo);
      }
    } catch (error) {
      console.error('Error loading staff info:', error);
      Alert.alert('Error', 'Failed to load profile information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.signOut();
              onLogout();
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!staffInfo) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-circle-outline" size={64} color="#999" />
        <Text style={styles.errorText}>Unable to load profile information</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadStaffInfo}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          {staffInfo.ProfilePic ? (
            <Image 
              source={{ uri: Array.isArray(staffInfo.ProfilePic) ? staffInfo.ProfilePic[0]?.url : staffInfo.ProfilePic }} 
              style={styles.profileImage}
              onError={() => console.log('Failed to load profile image')}
            />
          ) : (
            <View style={styles.defaultProfileImage}>
              <Ionicons name="person" size={40} color="#007AFF" />
            </View>
          )}
        </View>
        <Text style={styles.name}>{staffInfo['Full Name']}</Text>
      </View>

      {/* Profile Information */}
      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <Ionicons name="mail" size={20} color="#007AFF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{staffInfo['CHE Email']}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="call" size={20} color="#007AFF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{staffInfo.Phone}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="business" size={20} color="#007AFF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Campus Type</Text>
            <Text style={styles.infoValue}>{staffInfo['Type of Campus']}</Text>
          </View>
        </View>

        {staffInfo['Campus Director'] && staffInfo['Campus Director'].length > 0 && (
          <View style={styles.infoItem}>
            <Ionicons name="people" size={20} color="#007AFF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Campus Director</Text>
              <Text style={styles.infoValue}>{staffInfo['Campus Director'].join(', ')}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={20} color="#fff" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileImageContainer: {
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  defaultProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  role: {
    fontSize: 16,
    color: '#666',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginTop: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
