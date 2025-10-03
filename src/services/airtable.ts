import Airtable from 'airtable';
import { StaffInfo, StaffUpdate, StaffMessage, Leader, AppUser, AnyUser } from '../types';

// Initialize Airtable
console.log('🔧 Airtable API Key:', process.env.EXPO_PUBLIC_AIRTABLE_API_KEY ? 'Present' : 'Missing');
console.log('🔧 Airtable Base ID:', process.env.EXPO_PUBLIC_AIRTABLE_BASE_ID || 'Missing');

const base = new Airtable({
  apiKey: process.env.EXPO_PUBLIC_AIRTABLE_API_KEY || '',
}).base(process.env.EXPO_PUBLIC_AIRTABLE_BASE_ID || '');

// Table IDs from your CSV
const TABLES = {
  STAFF_INFO: 'tblO65y2oxVPbROoU',
  USERS: 'tblg4lVUqJavsmRTq', // Users table
  STAFF_UPDATES: 'tblJqbelzK03BNOwZ',
  STAFF_MESSAGES: 'tbl0VWPjWbDv1Cv4O',
  LEADERS: 'tblltaeQ2muGLvXcb',
};

// Field IDs from your CSV
const FIELDS = {
  STAFF_INFO: {
    NAME: 'fldFKyFC5IRy08hie',
    EMAIL: 'fldohzjGVvfew60LR',
    ROLE: 'fldqwuwuS4H5FGUvU',
    PUSH_TOKEN: 'fldSECQNo74J6sz72',
    CAMPUS: 'fldrCnhG6Tu1RIqai',
  },
  STAFF_UPDATES: {
    TITLE: 'fldSKVRGaKR1N1Mba',
    DESCRIPTION: 'flddJaRWFiWOFQvlg',
    DATE: 'fldzU9kcRvqWeD29c',
    LINK: 'fldzWuRsBGwVQXfm6',
    IMAGE: 'fldImage', // TODO: Replace with actual image field ID from Airtable
  },
  STAFF_MESSAGES: {
    SENDER_EMAIL: 'flds3SeBpOoGJSwbI',
    RECIPIENT_GROUP: 'fld3Zzo81cr2VHsLF',
    MESSAGE: 'fld0Jzb9shIln3Nu9',
    TIMESTAMP: 'fldla5QYFo7mFlVTh',
  },
  LEADERS: {
    MICRO_CAMPUS_LEADER: 'fldeKXvCoUuddUAFT',
    FULL_NAME: 'fldax0T7pcVBal477',
    FIRST_NAME: 'fldbDDrvOSqY019LF',
    LAST_NAME: 'fldIJnXrLtRgQeael',
    GOOGLE_ID: 'fld9J6JzNQH60qAra',
    PHONE: 'fldyZNKafEUCUxm5P',
    TYPE_OF_CAMPUS: 'fldWIn8cixpPhr2Hd',
    CHE_EMAIL: 'fld0Pt2lcXwJ98Xfi',
    CAMPUS_DIRECTOR: 'fldKWWsuRkTLul0dG',
    PROFILE_PIC: 'fldn3PTlfulF0zgKs',
    UID: 'fldUID', // TODO: Replace with actual UID field ID from Airtable
  },
  USERS: {
    FULL_NAME: 'fld49XrNRSBQNAmTF',
    FIRST_NAME: 'fldyOGxTRBHuxIQId',
    LAST_NAME: 'fldo77pe5pVyNrTMN',
    EMAIL: 'fld3d7CFrwAxT91Iq',
    PHONE: 'fldseOi3k9E8hMunC',
    USER_TYPE: 'fld2L6T7J5y1fwOse',
    UID: 'fldFvsVcXayl0DZT4',
    PROFILE_PIC: 'fldqCv9V2GsOXsYso',
    ACTIVE: 'fldn7dYSupCY345Ew',
  },
};

export class AirtableService {
  // Get staff member by email
  static async getStaffByEmail(email: string): Promise<Leader | null> {
    try {
      console.log('🔍 Searching for staff with email:', email);
      console.log('🔍 Using Airtable base ID:', process.env.EXPO_PUBLIC_AIRTABLE_BASE_ID);
      console.log('🔍 Using Airtable API key:', process.env.EXPO_PUBLIC_AIRTABLE_API_KEY ? 'Present' : 'Missing');
      
      const records = await base(TABLES.LEADERS)
        .select({
          filterByFormula: `LOWER({CHE Email}) = LOWER('${email}')`,
          maxRecords: 1,
        })
        .firstPage();

      console.log('🔍 Found records:', records.length);
      
      if (records.length === 0) {
        // Let's also try to see what records exist in the table
        console.log('🔍 No records found, checking if table has any data...');
        const allRecords = await base(TABLES.LEADERS)
          .select({
            maxRecords: 5,
          })
          .firstPage();
        
        console.log('🔍 Sample records in table:', allRecords.map(r => ({
          id: r.id,
          cheEmail: r.get(FIELDS.LEADERS.CHE_EMAIL),
          fullName: r.get(FIELDS.LEADERS.FULL_NAME)
        })));
        
        return null;
      }

      const record = records[0];
      console.log('✅ Found staff record:', {
        id: record.id,
        cheEmail: record.get(FIELDS.LEADERS.CHE_EMAIL),
        fullName: record.get(FIELDS.LEADERS.FULL_NAME)
      });
      
      // Debug: Let's see what fields are actually available
      console.log('🔍 Available fields in record:', Object.keys(record.fields));
      console.log('🔍 All field values:', record.fields);
      
      return {
        id: record.id,
        'Micro-Campus Leader': record.get('Micro-Campus Leader') as string,
        'Full Name': record.get('Full Name') as string,
        'First Name': record.get('First Name') as string,
        'Last Name': record.get('Last Name') as string,
        'Google ID': record.get('Google ID') as string || '', // This field doesn't exist yet
        Phone: record.get('Phone') as string,
        'Type of Campus': record.get('Type of Campus') as any,
        'CHE Email': record.get('CHE Email') as string,
        'Campus Director': record.get('Campus Director (from Micro-Campus Data)') as string[],
        ProfilePic: record.get('ProfilePic') as string,
        UID: record.get('UID') as string || '', // This field doesn't exist yet
      };
    } catch (error) {
      console.error('Error fetching staff by email:', error);
      throw error;
    }
  }

  // Update staff Firebase UID
  static async updateStaffUID(email: string, uid: string): Promise<void> {
    try {
      console.log('🔄 Updating UID for email:', email, 'with UID:', uid);
      
      const records = await base(TABLES.LEADERS)
        .select({
          filterByFormula: `LOWER({CHE Email}) = LOWER('${email}')`,
          maxRecords: 1,
        })
        .firstPage();

      if (records.length === 0) {
        throw new Error('Staff member not found');
      }

      // Check if UID field exists by trying to update it
      // If the field doesn't exist, we'll get an error and handle it gracefully
      try {
        await base(TABLES.LEADERS).update(records[0].id, {
          'UID': uid,
        });
        console.log('✅ Successfully updated UID for:', email);
      } catch (fieldError: any) {
        if (fieldError.error === 'UNKNOWN_FIELD_NAME') {
          console.warn('⚠️ UID field does not exist in Airtable yet. Please add the UID field to your Leaders table.');
          console.warn('⚠️ Field name should be: UID');
          // Don't throw error, just log warning
        } else {
          throw fieldError;
        }
      }
    } catch (error) {
      console.error('Error updating UID:', error);
      throw error;
    }
  }

  // Update staff push token (storing in a custom field or using Google ID field temporarily)
  static async updateStaffPushToken(email: string, pushToken: string): Promise<void> {
    try {
      const records = await base(TABLES.LEADERS)
        .select({
          filterByFormula: `LOWER({CHE Email}) = LOWER('${email}')`,
          maxRecords: 1,
        })
        .firstPage();

      if (records.length === 0) {
        throw new Error('Staff member not found');
      }

      // For now, we'll store the push token in a comment or note field
      // You may want to add a dedicated PushToken field to your Airtable base
      console.log(`Push token for ${email}: ${pushToken}`);
      
      // TODO: Add a PushToken field to your Leaders table and update this code
      // await base(TABLES.LEADERS).update(records[0].id, {
      //   [FIELDS.LEADERS.PUSH_TOKEN]: pushToken,
      // });
    } catch (error) {
      console.error('Error updating push token:', error);
      throw error;
    }
  }

  // Get staff updates
  static async getStaffUpdates(): Promise<StaffUpdate[]> {
    try {
      console.log('🔍 Fetching staff updates from Airtable...');
      console.log('🔍 Using table ID:', TABLES.STAFF_UPDATES);
      
      const records = await base(TABLES.STAFF_UPDATES)
        .select({
          sort: [{ field: 'Date', direction: 'desc' }],
        })
        .firstPage();

      console.log('🔍 Found records:', records.length);
      
      if (records.length === 0) {
        console.log('🔍 No records found, checking if table has any data...');
        const allRecords = await base(TABLES.STAFF_UPDATES)
          .select({
            maxRecords: 5,
          })
          .firstPage();
        
        console.log('🔍 Sample records in table:', allRecords.map(r => ({
          id: r.id,
          fields: r.fields
        })));
        
        return [];
      }

      const updates = records.map(record => {
        console.log('🔍 Processing record:', {
          id: record.id,
          fields: record.fields
        });
        
        const update = {
          id: record.id,
          Title: record.get('Title') as string,
          Description: record.get('Description') as string,
          Date: record.get('Date') as string,
          Link: record.get('Link') as string,
          image: record.get('image') as string | Array<{url: string}>,
        };
        
        console.log('🔍 Processed update:', update);
        return update;
      });
      
      console.log('✅ Returning updates:', updates);
      return updates;
    } catch (error) {
      console.error('Error fetching staff updates:', error);
      throw error;
    }
  }

  // Get staff messages
  static async getStaffMessages(): Promise<StaffMessage[]> {
    try {
      const records = await base(TABLES.STAFF_MESSAGES)
        .select({
          sort: [{ field: 'Timestamp', direction: 'desc' }],
        })
        .firstPage();

      return records.map(record => ({
        id: record.id,
        SenderEmail: record.get('Sender') as string, // This is a linked record, might need adjustment
        RecipientGroup: record.get('RecipientGroup') as any,
        Message: record.get('Message') as string,
        Timestamp: record.get('Timestamp') as string,
      }));
    } catch (error) {
      console.error('Error fetching staff messages:', error);
      throw error;
    }
  }

  // Send staff message
  static async sendStaffMessage(
    senderEmail: string,
    recipientGroup: 'Coordinator' | 'Director' | 'Tech',
    message: string
  ): Promise<void> {
    try {
      await base(TABLES.STAFF_MESSAGES).create([
        {
          fields: {
            'Sender': senderEmail, // This might need to be a linked record ID
            'RecipientGroup': recipientGroup,
            'Message': message,
          },
        },
      ]);
    } catch (error) {
      console.error('Error sending staff message:', error);
      throw error;
    }
  }

  // Get all staff members for directory
  static async getAllStaff(): Promise<Leader[]> {
    try {
      console.log('🔍 Fetching all staff for directory...');
      
      const records = await base(TABLES.LEADERS)
        .select({
          sort: [{ field: 'Full Name', direction: 'asc' }],
        })
        .all();

      console.log('🔍 Found staff records:', records.length);

      const staff = records.map(record => ({
        id: record.id,
        'Micro-Campus Leader': record.get('Micro-Campus Leader') as string,
        'Full Name': record.get('Full Name') as string,
        'First Name': record.get('First Name') as string,
        'Last Name': record.get('Last Name') as string,
        'Google ID': record.get('Google ID') as string || '',
        Phone: record.get('Phone') as string,
        'Type of Campus': record.get('Type of Campus') as any,
        'CHE Email': record.get('CHE Email') as string,
        'Campus Director': record.get('Campus Director (from Micro-Campus Data)') as string[],
        ProfilePic: record.get('ProfilePic') as string,
        UID: record.get('UID') as string || '',
      }));

      console.log('✅ Returning staff directory:', staff.length, 'members');
      return staff;
    } catch (error) {
      console.error('Error fetching all staff:', error);
      throw error;
    }
  }

  // Get all users from Users table
  static async getAllUsers(): Promise<AppUser[]> {
    try {
      console.log('🔍 Fetching all users from Users table...');
      
      const records = await base(TABLES.USERS)
        .select({
          sort: [{ field: 'Full Name', direction: 'asc' }],
        })
        .all();

      console.log('🔍 Found user records:', records.length);

      const users = records.map(record => ({
        id: record.id,
        'Full Name': record.get('Full Name') as string,
        'First Name': record.get('First Name') as string,
        'Last Name': record.get('Last Name') as string,
        'Email': record.get('Email') as string,
        'Phone': record.get('Phone') as string,
        'User Type': record.get('User Type') as any,
        'UID': record.get('UID') as string || '',
        'ProfilePic': record.get('ProfilePic') as string | Array<{url: string}>,
        'Active': record.get('Active') as boolean || true,
      }));

      console.log('✅ Returning users:', users.length, 'members');
      return users;
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }

  // Get user by email from Users table
  static async getUserByEmail(email: string): Promise<AppUser | null> {
    try {
      console.log('🔍 Fetching user by email:', email);
      
      const records = await base(TABLES.USERS)
        .select({
          filterByFormula: `LOWER({Email}) = LOWER('${email}')`,
        })
        .firstPage();

      if (records.length === 0) {
        console.log('❌ No user found with email:', email);
        return null;
      }

      const record = records[0];
      console.log('🔍 Found user record:', record.id);

      const user: AppUser = {
        id: record.id,
        'Full Name': record.get('Full Name') as string,
        'First Name': record.get('First Name') as string,
        'Last Name': record.get('Last Name') as string,
        'Email': record.get('Email') as string,
        'Phone': record.get('Phone') as string,
        'User Type': record.get('User Type') as any,
        'UID': record.get('UID') as string || '',
        'ProfilePic': record.get('ProfilePic') as string | Array<{url: string}>,
        'Active': record.get('Active') as boolean || true,
      };

      console.log('✅ Found user:', user);
      return user;
    } catch (error) {
      // If the Users table doesn't exist yet, just return null instead of throwing
      if (error.message?.includes('TABLE_NOT_FOUND') || error.message?.includes('NOT_FOUND')) {
        console.log('⚠️ Users table does not exist yet, skipping user lookup');
        return null;
      }
      console.error('Error fetching user by email:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  // Get user by ID from both tables
  static async getUserById(userId: string): Promise<AnyUser | null> {
    try {
      console.log('🔍 Fetching user by ID:', userId);
      
      // First try to find in Leaders table
      try {
        const leaderRecords = await base(TABLES.LEADERS)
          .select({
            filterByFormula: `{UID} = '${userId}'`,
            maxRecords: 1,
          })
          .firstPage();

        if (leaderRecords.length > 0) {
          const record = leaderRecords[0];
          const leader: Leader = {
            id: record.id,
            'Micro-Campus Leader': record.get('Micro-Campus Leader') as string,
            'Full Name': record.get('Full Name') as string,
            'First Name': record.get('First Name') as string,
            'Last Name': record.get('Last Name') as string,
            'Google ID': record.get('Google ID') as string || '',
            Phone: record.get('Phone') as string,
            'Type of Campus': record.get('Type of Campus') as any,
            'CHE Email': record.get('CHE Email') as string,
            'Campus Director': record.get('Campus Director (from Micro-Campus Data)') as string[],
            ProfilePic: record.get('ProfilePic') as string | Array<{url: string}>,
            UID: record.get('UID') as string || '',
          };
          console.log('✅ Found user in Leaders table:', leader);
          return leader;
        }
      } catch (leaderError) {
        console.log('⚠️ Error checking Leaders table:', leaderError);
      }

      // Then try to find in Users table
      try {
        const userRecords = await base(TABLES.USERS)
          .select({
            filterByFormula: `{UID} = '${userId}'`,
            maxRecords: 1,
          })
          .firstPage();

        if (userRecords.length > 0) {
          const record = userRecords[0];
          const user: AppUser = {
            id: record.id,
            'Full Name': record.get('Full Name') as string,
            'First Name': record.get('First Name') as string,
            'Last Name': record.get('Last Name') as string,
            'Email': record.get('Email') as string,
            'Phone': record.get('Phone') as string,
            'User Type': record.get('User Type') as any,
            'UID': record.get('UID') as string || '',
            'ProfilePic': record.get('ProfilePic') as string | Array<{url: string}>,
            'Active': record.get('Active') as boolean || true,
          };
          console.log('✅ Found user in Users table:', user);
          return user;
        }
      } catch (userError) {
        console.log('⚠️ Error checking Users table:', userError);
      }

      console.log('❌ No user found with UID:', userId);
      return null;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw error;
    }
  }

  // Get any user (staff or regular user) by email
  static async getAnyUserByEmail(email: string): Promise<AnyUser | null> {
    try {
      console.log('🔍 Searching for user in both tables:', email);
      
      // First try to find in Leaders table (staff)
      const staff = await this.getStaffByEmail(email);
      if (staff) {
        console.log('✅ Found in Leaders table');
        return staff;
      }

      // Then try to find in Users table
      try {
        const user = await this.getUserByEmail(email);
        if (user) {
          console.log('✅ Found in Users table');
          return user;
        }
      } catch (userError) {
        console.warn('⚠️ Error checking Users table, continuing with staff-only lookup:', userError.message);
        // Don't throw here, just continue without the Users table
      }

      console.log('❌ User not found in any table');
      return null;
    } catch (error) {
      console.error('Error fetching any user by email:', error);
      throw error;
    }
  }

  // Update user UID in Users table
  static async updateUserUID(email: string, uid: string): Promise<void> {
    try {
      console.log('🔄 Updating UID for user email:', email);
      
      const records = await base(TABLES.USERS)
        .select({
          filterByFormula: `LOWER({Email}) = LOWER('${email}')`,
        })
        .firstPage();

      if (records.length === 0) {
        console.log('❌ No user found to update UID');
        return;
      }

      await base(TABLES.USERS).update(records[0].id, {
        'UID': uid,
      });

      console.log('✅ Successfully updated user UID');
    } catch (error) {
      // If the Users table doesn't exist yet, just log and continue
      if (error.message?.includes('TABLE_NOT_FOUND') || error.message?.includes('NOT_FOUND')) {
        console.log('⚠️ Users table does not exist yet, skipping UID update');
        return;
      }
      if (error.message?.includes('UNKNOWN_FIELD_NAME')) {
        console.warn('⚠️ UID field does not exist in Users table yet. Please add the UID field to your Users table.');
        console.warn('⚠️ Field ID should be:', FIELDS.USERS.UID);
      } else {
        console.error('Error updating user UID:', error);
        throw error;
      }
    }
  }

  // Get staff members by role for push notifications
  static async getStaffByRole(role: 'Coordinator' | 'Director' | 'Tech'): Promise<Leader[]> {
    try {
      const records = await base(TABLES.LEADERS)
        .select({
          filterByFormula: `FIND('${role}', {Type of Campus}) > 0`,
        })
        .firstPage();

      return records.map(record => ({
        id: record.id,
        'Micro-Campus Leader': record.get(FIELDS.LEADERS.MICRO_CAMPUS_LEADER) as string,
        'Full Name': record.get(FIELDS.LEADERS.FULL_NAME) as string,
        'First Name': record.get(FIELDS.LEADERS.FIRST_NAME) as string,
        'Last Name': record.get(FIELDS.LEADERS.LAST_NAME) as string,
        'Google ID': record.get(FIELDS.LEADERS.GOOGLE_ID) as string,
        Phone: record.get(FIELDS.LEADERS.PHONE) as string,
        'Type of Campus': record.get(FIELDS.LEADERS.TYPE_OF_CAMPUS) as any,
        'CHE Email': record.get(FIELDS.LEADERS.CHE_EMAIL) as string,
        'Campus Director': record.get(FIELDS.LEADERS.CAMPUS_DIRECTOR) as string[],
        ProfilePic: record.get(FIELDS.LEADERS.PROFILE_PIC) as string,
      }));
    } catch (error) {
      console.error('Error fetching staff by role:', error);
      throw error;
    }
  }
}
