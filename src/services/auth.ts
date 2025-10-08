import { auth } from './firebase';
import {
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AirtableService } from './airtable';
import { Leader, AppUser, AnyUser } from '../types';

// Type assertion for auth to fix implicit any type issues
const typedAuth = auth as Auth;

export class AuthService {
  // Configure Google Sign-In
  static configureGoogleSignIn() {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    });
  }

  // Check if email is authorized (CHE domain only)
  static isAuthorizedEmail(email: string): boolean {
    return email.endsWith('@che.school');
  }

  // Sign in with Google using native Google Sign-In
  static async signInWithGoogle(): Promise<{ user: User; userInfo: AnyUser } | null> {
    try {
      // Check if your device supports Google Play (required for Google Sign-In)
      await GoogleSignin.hasPlayServices();

      // Get the users ID token
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;

      if (!idToken) {
        throw new Error('No ID token found from Google Sign-In');
      }

      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      const result = await signInWithCredential(typedAuth, googleCredential);
      const user = result.user;

      if (!user.email) {
        throw new Error('No email found in Google account');
      }

      // Check if email is authorized
      if (!this.isAuthorizedEmail(user.email)) {
        await this.signOut();
        throw new Error('Email domain not authorized. Only @che.school emails are allowed.');
      }

      // Get user info from Airtable (check both Staff and Users tables)
      const userInfo = await AirtableService.getAnyUserByEmail(user.email);

      if (!userInfo) {
        await this.signOut();
        throw new Error('Email not found in user database. Please contact your administrator.');
      }

      // Update the UID in Airtable (try both tables)
      try {
        // Try to update in Leaders table first
        await AirtableService.updateStaffUID(user.email, user.uid);
      } catch (error) {
        // This is expected if user is in Users table instead of Leaders table
        try {
          await AirtableService.updateUserUID(user.email, user.uid);
        } catch (userError) {
          console.warn('Failed to update UID:', userError);
          // Don't fail the authentication if UID update fails
        }
      }

      // Ensure the userInfo has the Firebase UID
      userInfo.UID = user.uid;

      return { user, userInfo };
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      await firebaseSignOut(typedAuth);
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // Get current user
  static getCurrentUser(): User | null {
    return typedAuth.currentUser;
  }

  // Listen to auth state changes
  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return firebaseOnAuthStateChanged(typedAuth, callback);
  }

  // Check if user is authenticated and authorized
  static async getCurrentUserWithStaffInfo(): Promise<{ user: User; userInfo: AnyUser } | null> {
    const user = this.getCurrentUser();
    if (!user || !user.email) return null;

    try {
      const userInfo = await AirtableService.getAnyUserByEmail(user.email);
      if (!userInfo) return null;

      return { user, userInfo };
    } catch (error) {
      console.error('Error getting current user with user info:', error);
      return null;
    }
  }
}
