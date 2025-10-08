import { AirtableService } from './airtable';
import { AuthService } from './auth';
import { Image } from 'react-native';

interface PreloadedData {
  updates: any[];
  users: any[];
  currentUser?: any;
  students?: any[]; // Waiver students
  programs?: any[]; // Staff programs
  allStudents?: any[]; // All students by programs
  weeklyAttendance?: Map<string, any[]>; // Map of date string to attendance records
}

class PreloadService {
  private static preloadedData: PreloadedData | null = null;
  private static isPreloading = false;
  private static preloadPromise: Promise<PreloadedData> | null = null;

  // Start preloading data in the background
  static async preloadData(): Promise<PreloadedData> {
    // If already preloading, return the existing promise
    if (this.preloadPromise) {
      return this.preloadPromise;
    }

    // If already preloaded, return cached data
    if (this.preloadedData) {
      return this.preloadedData;
    }

    this.isPreloading = true;

    this.preloadPromise = (async () => {
      try {
        // Preload updates and users in parallel
        const [updates, staff, users, currentUser] = await Promise.all([
          AirtableService.getStaffUpdates(),
          AirtableService.getAllStaff(),
          AirtableService.getAllUsers(),
          this.preloadCurrentUser(),
        ]);

        this.preloadedData = {
          updates,
          users: [...staff, ...users],
          currentUser,
        };

        // Preload profile pictures for current user and recent contacts
        this.preloadImages();

        // If current user is a leader with waiver access, preload students
        if (currentUser?.['User Type'] === 'Staff' || currentUser?.['Type of Campus']) {
          this.preloadStudents().catch(err =>
            console.error('Failed to preload students:', err)
          );

          // Preload programs and all students
          this.preloadProgramsAndStudents(currentUser.id).catch(err =>
            console.error('Failed to preload programs and students:', err)
          );

          // Preload attendance for current week
          this.preloadWeeklyAttendance().catch(err =>
            console.error('Failed to preload weekly attendance:', err)
          );
        }

        return this.preloadedData;
      } catch (error) {
        console.error('❌ Error preloading data:', error);
        // Return empty data on error
        this.preloadedData = {
          updates: [],
          users: [],
        };
        return this.preloadedData;
      } finally {
        this.isPreloading = false;
      }
    })();

    return this.preloadPromise;
  }

  // Preload current user's detailed info
  private static async preloadCurrentUser(): Promise<any | null> {
    try {
      const authResult = await AuthService.getCurrentUserWithStaffInfo();
      if (authResult?.userInfo) {
        return authResult.userInfo;
      }
      return null;
    } catch (error) {
      console.error('Failed to preload current user:', error);
      return null;
    }
  }

  // Preload student data (for leaders)
  private static async preloadStudents(): Promise<void> {
    try {
      const students = await AirtableService.getAllStudents();
      if (this.preloadedData) {
        this.preloadedData.students = students;
      }
    } catch (error) {
      console.error('Failed to preload students:', error);
    }
  }

  // Preload programs and students for staff
  private static async preloadProgramsAndStudents(userId: string): Promise<void> {
    try {
      const programs = await AirtableService.getStaffPrograms(userId);

      if (this.preloadedData) {
        this.preloadedData.programs = programs;
      }

      // If there are programs, preload students for those programs
      if (programs.length > 0) {
        const programIds = programs.map(p => p.id);
        const allStudents = await AirtableService.getStudentsByPrograms(programIds);

        // Sort students alphabetically by name
        const sortedStudents = allStudents.sort((a, b) => {
          const nameA = a.Student?.toLowerCase() || '';
          const nameB = b.Student?.toLowerCase() || '';
          return nameA.localeCompare(nameB);
        });

        if (this.preloadedData) {
          this.preloadedData.allStudents = sortedStudents;
        }
      }
    } catch (error) {
      console.error('Failed to preload programs and students:', error);
    }
  }

  // Preload attendance for current week (Sunday to Saturday)
  private static async preloadWeeklyAttendance(): Promise<void> {
    try {
      // Get current date/time in Denver timezone
      const now = new Date();
      const denverDateString = now.toLocaleDateString('en-US', {
        timeZone: 'America/Denver',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });

      // Parse the Denver date string (MM/DD/YYYY format)
      const [month, day, year] = denverDateString.split('/');
      const denverDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

      const dayOfWeek = denverDate.getDay(); // 0 = Sunday, 6 = Saturday

      // Calculate Sunday of current week
      const sunday = new Date(denverDate);
      sunday.setDate(denverDate.getDate() - dayOfWeek);

      // Generate dates for the week
      const weekDates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(sunday);
        date.setDate(sunday.getDate() + i);

        // Format as YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        weekDates.push(`${year}-${month}-${day}`);
      }

      // Fetch attendance for all dates in parallel
      const attendancePromises = weekDates.map(date =>
        AirtableService.getAttendanceRecordsForDate(date)
          .then(records => ({ date, records }))
          .catch(err => {
            console.warn('Failed to preload attendance for', date, err);
            return { date, records: [] };
          })
      );

      const attendanceResults = await Promise.all(attendancePromises);

      // Store in Map
      const weeklyAttendance = new Map<string, any[]>();
      attendanceResults.forEach(({ date, records }) => {
        weeklyAttendance.set(date, records);
      });

      if (this.preloadedData) {
        this.preloadedData.weeklyAttendance = weeklyAttendance;
      }
    } catch (error) {
      console.error('Failed to preload weekly attendance:', error);
    }
  }

  // Preload images in the background
  private static async preloadImages(): Promise<void> {
    try {
      if (!this.preloadedData) return;

      const imagesToPreload: string[] = [];

      // Current user profile picture
      if (this.preloadedData.currentUser?.ProfilePic?.[0]?.url) {
        imagesToPreload.push(this.preloadedData.currentUser.ProfilePic[0].url);
      }

      // Update images (first 5)
      this.preloadedData.updates.slice(0, 5).forEach((update: any) => {
        if (update.image?.[0]?.url) {
          imagesToPreload.push(update.image[0].url);
        }
      });

      // Profile pictures of all users (for directory and messages)
      this.preloadedData.users.forEach((user: any) => {
        if (user.ProfilePic?.[0]?.url) {
          imagesToPreload.push(user.ProfilePic[0].url);
        }
      });

      if (imagesToPreload.length > 0) {
        // Preload images using React Native's Image.prefetch
        const prefetchPromises = imagesToPreload.map(url =>
          Image.prefetch(url).catch(err =>
            console.warn('Failed to prefetch image:', url, err)
          )
        );

        await Promise.all(prefetchPromises);
      }
    } catch (error) {
      console.error('Failed to preload images:', error);
    }
  }

  // Get preloaded updates
  static getPreloadedUpdates(): any[] {
    return this.preloadedData?.updates || [];
  }

  // Get preloaded users
  static getPreloadedUsers(): any[] {
    return this.preloadedData?.users || [];
  }

  // Get preloaded current user
  static getPreloadedCurrentUser(): any | null {
    return this.preloadedData?.currentUser || null;
  }

  // Get preloaded students
  static getPreloadedStudents(): any[] {
    return this.preloadedData?.students || [];
  }

  // Get preloaded attendance for a specific date
  static getPreloadedAttendance(date: string): any[] | null {
    if (!this.preloadedData?.weeklyAttendance) {
      return null;
    }
    return this.preloadedData.weeklyAttendance.get(date) || null;
  }

  // Get preloaded programs
  static getPreloadedPrograms(): any[] | null {
    return this.preloadedData?.programs || null;
  }

  // Get preloaded students (from programs)
  static getPreloadedAllStudents(): any[] | null {
    return this.preloadedData?.allStudents || null;
  }

  // Check if data is preloaded
  static isDataPreloaded(): boolean {
    return this.preloadedData !== null;
  }

  // Clear preloaded data (for refresh)
  static clearPreloadedData(): void {
    this.preloadedData = null;
    this.preloadPromise = null;
  }
}

export default PreloadService;
