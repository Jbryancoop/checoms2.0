import React, { useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTheme } from '../contexts/ThemeContext';
import { RootTabParamList } from '../types';
import { Colors as ThemeColors } from '../theme/colors';

type NavigationProp = BottomTabNavigationProp<RootTabParamList, 'Home'>;

interface HomeSection {
  key: keyof RootTabParamList;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const sections: HomeSection[] = [
    {
      key: 'Updates',
      title: 'Staff Updates',
      description: 'Stay current with announcements, action items, and campus highlights.',
      icon: 'newspaper-outline',
    },
    {
      key: 'Info',
      title: 'Resource Hub',
      description: 'Find handbooks, key dates, and quick links tailored for your role.',
      icon: 'information-circle-outline',
    },
    {
      key: 'Messages',
      title: 'Messages',
      description: 'Connect with teammates and campus directors in one organized inbox.',
      icon: 'chatbubbles-outline',
    },
    {
      key: 'Profile',
      title: 'Your Profile',
      description: 'Review your details, manage preferences, and sign out safely.',
      icon: 'person-outline',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.welcomeTitle}>Welcome to CHE Communicator</Text>
          <Text style={styles.welcomeSubtitle}>
            Choose a section below to jump into updates, resources, or conversations.
          </Text>
        </View>

        <View style={styles.cardsGrid}>
          {sections.map((section, index) => (
            <TouchableOpacity
              key={section.key}
              style={[styles.card, index === sections.length - 1 && styles.lastCard]}
              activeOpacity={0.9}
              onPress={() => navigation.navigate(section.key)}
              accessibilityRole="button"
              accessibilityLabel={`${section.title}. ${section.description}`}
            >
              <View style={styles.iconContainer}>
                <Ionicons name={section.icon} size={30} color={colors.primary} />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>{section.title}</Text>
                <Text style={styles.cardDescription}>{section.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Need a hand?</Text>
          <Text style={styles.footerDescription}>
            Reach out to your campus director or tech support if you are unsure where to go next.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof ThemeColors.light) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      padding: 20,
    },
    header: {
      marginBottom: 24,
    },
    welcomeTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    welcomeSubtitle: {
      fontSize: 16,
      lineHeight: 22,
      color: colors.textSecondary,
    },
    cardsGrid: {
    },
    card: {
      marginBottom: 16,
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 16,
      elevation: 3,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
    },
    iconContainer: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    cardTextContainer: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    cardDescription: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
    },
    lastCard: {
      marginBottom: 0,
    },
    footer: {
      marginTop: 32,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
    },
    footerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    footerDescription: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
    },
  });

