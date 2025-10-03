import { AirtableService } from './airtable';

interface PreloadedData {
  updates: any[];
  users: any[];
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

    console.log('🚀 Starting data preload...');
    this.isPreloading = true;

    this.preloadPromise = (async () => {
      try {
        // Preload updates and users in parallel
        const [updates, staff, users] = await Promise.all([
          AirtableService.getStaffUpdates(),
          AirtableService.getAllStaff(),
          AirtableService.getAllUsers(),
        ]);

        this.preloadedData = {
          updates,
          users: [...staff, ...users],
        };

        console.log('✅ Data preloaded successfully:', {
          updates: updates.length,
          users: this.preloadedData.users.length,
        });

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

  // Get preloaded updates
  static getPreloadedUpdates(): any[] {
    return this.preloadedData?.updates || [];
  }

  // Get preloaded users
  static getPreloadedUsers(): any[] {
    return this.preloadedData?.users || [];
  }

  // Check if data is preloaded
  static isDataPreloaded(): boolean {
    return this.preloadedData !== null;
  }

  // Clear preloaded data (for refresh)
  static clearPreloadedData(): void {
    console.log('🗑️ Clearing preloaded data');
    this.preloadedData = null;
    this.preloadPromise = null;
  }
}

export default PreloadService;
