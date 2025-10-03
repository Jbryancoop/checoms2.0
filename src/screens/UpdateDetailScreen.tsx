import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StaffUpdate } from '../types';

interface UpdateDetailScreenProps {
  update: StaffUpdate;
  onBack: () => void;
}

export default function UpdateDetailScreen({ update, onBack }: UpdateDetailScreenProps) {
  const handleLinkPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this link');
      }
    } catch (error) {
      console.error('Error opening link:', error);
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getImageUrl = () => {
    if (!update.image) return null;
    return Array.isArray(update.image) ? update.image[0]?.url : update.image;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image */}
        {getImageUrl() && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: getImageUrl()! }} 
              style={styles.image}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Content */}
        <View style={styles.contentCard}>
          <Text style={styles.title}>{update.Title}</Text>
          <Text style={styles.date}>{formatDate(update.Date)}</Text>
          
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>{update.Description}</Text>
          </View>

          {update.Link && (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => handleLinkPress(update.Link!)}
            >
              <Ionicons name="link" size={20} color="#fff" />
              <Text style={styles.linkText}>Open Link</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#e0e0e0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  contentCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  date: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 24,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  description: {
    fontSize: 17,
    color: '#1c1c1e',
    lineHeight: 26,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  linkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: -0.1,
  },
});
