import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

interface CalendarScreenProps {
  onBack: () => void;
}

export default function CalendarScreen({ onBack }: CalendarScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [calendarError, setCalendarError] = useState(false);

  // Use the embed format with schedule view for better mobile display
  const calendarUrl = 'https://calendar.google.com/calendar/embed?src=Y18zZmNkZDNiMWIxMDdmMmYyOWJjNDA5YjhlYTdjZTBjOWJkZDRmNzUyNmUxOWI3MTgyMjdiMDZlOTE3ODEwNGU0QGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20&ctz=America%2FDenver&mode=AGENDA';

  const handleOpenInBrowser = async () => {
    try {
      // Use the original calendar URL for browser
      const browserUrl = 'https://calendar.google.com/calendar/u/0?cid=Y18zZmNkZDNiMWIxMDdmMmYyOWJjNDA5YjhlYTdjZTBjOWJkZDRmNzUyNmUxOWI3MTgyMjdiMDZlOTE3ODEwNGU0QGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20';
      const supported = await Linking.canOpenURL(browserUrl);
      if (supported) {
        await Linking.openURL(browserUrl);
      } else {
        Alert.alert('Error', 'Cannot open calendar in browser');
      }
    } catch (error) {
      console.error('Error opening calendar:', error);
      Alert.alert('Error', 'Failed to open calendar');
    }
  };

  const handleWebViewError = () => {
    console.log('WebView failed to load calendar');
    setCalendarError(true);
    setIsLoading(false);
  };

  const handleWebViewLoad = () => {
    console.log('WebView loaded calendar successfully');
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Key Dates & Calendar</Text>
        <TouchableOpacity style={styles.browserButton} onPress={handleOpenInBrowser}>
          <Ionicons name="open-outline" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Calendar Content */}
      <View style={styles.calendarContainer}>
        {calendarError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="calendar-outline" size={64} color="#c7c7cc" />
            <Text style={styles.errorTitle}>Calendar Unavailable</Text>
            <Text style={styles.errorMessage}>
              Unable to load the calendar in the app. The calendar may require authentication or the embed format may not be available. Tap the browser icon to open the full calendar experience.
            </Text>
            <TouchableOpacity style={styles.openButton} onPress={handleOpenInBrowser}>
              <Ionicons name="open-outline" size={20} color="#fff" />
              <Text style={styles.openButtonText}>Open in Browser</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading calendar...</Text>
              </View>
            )}
            
            <WebView
              source={{ uri: calendarUrl }}
              style={styles.webView}
              onError={handleWebViewError}
              onLoad={handleWebViewLoad}
              startInLoadingState={true}
              scalesPageToFit={false}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              mixedContentMode="compatibility"
              allowsBackForwardNavigationGestures={false}
              bounces={false}
              scrollEnabled={true}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={true}
              userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
            />
          </>
        )}
      </View>

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
    flex: 1,
    textAlign: 'center',
  },
  browserButton: {
    padding: 8,
    marginRight: -8,
  },
  calendarContainer: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  webView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8e8e93',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#8e8e93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  openButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
