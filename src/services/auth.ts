import { 
  GoogleAuthProvider, 
  signInWithCredential, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from './firebase';
import { AirtableService } from './airtable';
import { Leader } from '../types';

export class AuthService {
  // Configure Google Sign-In
  static configureGoogleSignIn() {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    });
  }

  // Check if email is authorized (CHE or VentureOff domain)
  static isAuthorizedEmail(email: string): boolean {
    const authorizedDomains = ['@che.school', '@ventureoff.org'];
    return authorizedDomains.some(domain => email.endsWith(domain));
  }

  // Sign in with Google using native Google Sign-In
  static async signInWithGoogle(): Promise<{ user: User; staffInfo: Leader } | null> {
    try {
      // Check if your device supports Google Play
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
      const result = await signInWithCredential(auth, googleCredential);
      const user = result.user;
      
      if (!user.email) {
        throw new Error('No email found in Google account');
      }

      console.log('Google sign-in attempt for email:', user.email);

      // Check if email is authorized
      if (!this.isAuthorizedEmail(user.email)) {
        await this.signOut();
        throw new Error('Email domain not authorized. Only @che.school and @ventureoff.org emails are allowed.');
      }

      // Get staff info from Airtable
      console.log('🔍 About to call AirtableService.getStaffByEmail with:', user.email);
      const staffInfo = await AirtableService.getStaffByEmail(user.email);
      console.log('🔍 AirtableService.getStaffByEmail result:', staffInfo);
      
      if (!staffInfo) {
        console.log('❌ No staff info found, signing out...');
        await this.signOut();
        throw new Error('Email not found in staff database. Please contact your administrator.');
      }

      // Update the UID in Airtable
      try {
        await AirtableService.updateStaffUID(user.email, user.uid);
        console.log('✅ Successfully updated UID in Airtable');
      } catch (error) {
        console.warn('⚠️ Failed to update UID in Airtable:', error);
        // Don't fail the authentication if UID update fails
      }

      return { user, staffInfo };
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // Get current user
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Listen to auth state changes
  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  // Check if user is authenticated and authorized
  static async getCurrentUserWithStaffInfo(): Promise<{ user: User; staffInfo: Leader } | null> {
    const user = this.getCurrentUser();
    if (!user || !user.email) return null;

    try {
      const staffInfo = await AirtableService.getStaffByEmail(user.email);
      if (!staffInfo) return null;

      return { user, staffInfo };
    } catch (error) {
      console.error('Error getting current user with staff info:', error);
      return null;
    }
  }
}
