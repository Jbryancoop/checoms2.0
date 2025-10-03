Project Summary: CHE Staff Communication Helper App (Firebase-Only)

This project is a React Native app built with Expo Go for CHE staff. It integrates with Firebase (Authentication, Firestore, Cloud Functions, Messaging/Notifications) and Airtable to provide a lightweight staff communication platform with real Apple push notifications.

⸻

Goals
	•	Provide CHE staff with a centralized app for updates, info, and messaging.
	•	Enforce secure login with Google Auth via Firebase, restricted to @che.school and @ventureoff.org.
	•	Deliver real iOS push notifications (APNs via Firebase Cloud Messaging).
	•	Store staff info (roles, push tokens) in Airtable, but use Firebase Functions to handle event triggers and notifications.

⸻

Airtable Setup
	•	2025-2026 Leaders Table (read-only sync except editable Token field):
	•	Fields include CHE Email, Full Name, Type of Campus, Campus Director, Google ID, and Token.
	•	This is the source of truth for staff identity and roles.
	•	Token field is writable for storing each staff member’s FCM device token.
	•	StaffUpdates Table (new writable table):
	•	Fields: Title, Description, Date, Link.
	•	Used for displaying updates in card format inside the app.
	•	StaffMessages Table (new writable table):
	•	Fields: SenderEmail, RecipientGroup, Message, Timestamp.
	•	Used for sending messages between staff and their coordinators, directors, or tech team.

⸻

Authentication
	•	Uses Firebase Authentication with Google Sign-in (via Expo AuthSession).
	•	Flow:
	1.	User signs in with Google.
	2.	Firebase validates and returns user email.
	3.	Email is checked against 2025-2026 Leaders Table.
	4.	Only authorized emails (CHE/VentureOff staff) gain access.

⸻

Notifications
	•	Uses Firebase Cloud Messaging (FCM) for push notifications.
	•	On login, the app requests permission and retrieves an FCM token.
	•	That token is stored in Airtable (Token field for that staff member).
	•	Firebase Cloud Functions handle sending notifications:
	•	When a new message is written to StaffMessages in Airtable, a Cloud Function is triggered.
	•	Function looks up the correct recipient group in Airtable, retrieves their tokens, and sends push notifications via FCM.
	•	Notifications can deep-link into the Messages screen.

⸻

App Features
	1.	Login/AuthGate
	•	Firebase Google login.
	•	Checks email against Airtable leaders table.
	•	Blocks unauthorized users.
	2.	Updates Tab
	•	Displays cards from StaffUpdates.
	•	Title, date, short description, optional link.
	•	Pull-to-refresh supported.
	3.	Info Tab
	•	Static/semi-dynamic cards (Handbook, Key Dates, Tech Support).
	•	Optional stats (e.g., student/campus numbers).
	4.	Messages Tab
	•	Dropdown to select recipient group (Coordinator, Director, Tech).
	•	Input + send button → new record in StaffMessages.
	•	Thread view of messages (sorted newest first).
	•	New messages trigger Firebase Cloud Function → push notification to group.

⸻

Backend (Firebase Only)
	•	Firestore (optional) can cache tokens or logs, but Airtable remains system of record.
	•	Firebase Functions:
	•	sendNotification: Called when Airtable sends webhook on new message. Looks up recipients and sends push via FCM.
	•	Firebase Cloud Messaging: Used to deliver pushes to iOS and Android.

⸻

Navigation
	•	React Navigation bottom tabs:
	•	Updates | Info | Messages

⸻

Security
	•	Only CHE/VentureOff staff emails allowed.
	•	Push tokens tied to staff emails.
	•	Firebase Functions secured with service account.

⸻

Workflow
	1.	Staff signs in via Google → Firebase returns user email.
	2.	App looks up user in Airtable → confirms role.
	3.	App registers push token → saves to Airtable.
	4.	Staff sees updates and info in app.
	5.	Staff sends message → Airtable stores record.
	6.	Airtable webhook triggers Firebase Function → push notifications sent to recipient group.
	7.	Tap notification → navigates to Messages tab in app.

⸻

Stretch Goals
	•	Filter updates per role/campus.
	•	Rich notification payloads (e.g., include sender’s name, quick actions).
	•	Expand Info tab with live Airtable stats.
