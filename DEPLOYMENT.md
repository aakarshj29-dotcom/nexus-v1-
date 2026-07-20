# Nexus V1 - Production Deployment Guide & Launch Checklist

This document serves as the official operational guide and quality assurance roadmap for preparing, deploying, and launching the **Nexus V1** productivity and collaboration SaaS platform.

---

## 1. Environment Variable Audit

For security and operational integrity, all API configurations are kept outside the code bundle. To deploy Nexus V1 to Vercel, you must configure the following Environment Variables under your Vercel Project Dashboard (`Settings` -> `Environment Variables`):

### Production Variables (Firebase Mode)
These environment variables connect your Next.js application to your live cloud-hosted production Firebase instance.

| Variable Name | Description | Example / Standard Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Public Firebase Web API Key for client requests. | `AIzaSyA1...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Web domain handle for federated OAuth sign-in popups. | `nexus-v1.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Unique Cloud project ID containing Firestore and Storage. | `nexus-v1-prod` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Default path for Cloud Storage avatar image uploads. | `nexus-v1-prod.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`| Sender key ID for cloud messaging gateways. | `73819204859` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Identifies client instance connected to Firebase API. | `1:7381920:web:d82...` |
| `NEXT_PUBLIC_MOCK_AUTH` | **MUST be set to `false`** or deleted entirely in production. | `false` |
| `NEXT_PUBLIC_APP_URL` | The production URL of your Vercel deployment for SEO. | `https://nexus-v1.vercel.app` |

### Offline/Mock Mode (Local Development)
When performing offline QA, setting `NEXT_PUBLIC_MOCK_AUTH=true` activates a mock state machine bypass, bypassing Cloud Firebase connection constraints entirely. **Ensure this parameter is removed or turned off for the live SaaS launch.**

---

## 2. Firebase Cloud Architecture Configuration

Before routing client requests, prepare your production-grade Firebase instance from the [Firebase Console](https://console.firebase.google.com/):

### A. Authentication
1. Navigate to **Build > Authentication** and click **Get Started**.
2. Under **Sign-in method**, enable:
   - **Email/Password**: Ensure standard sign-up/sign-in flows function properly.
   - **Google**: Add Google OAuth provider support.
3. In **Authorized Domains**, add your Vercel deployment URL (e.g., `nexus-v1.vercel.app`) to authorize federated logins.

### B. Cloud Firestore Database
1. Navigate to **Build > Firestore Database** and click **Create database**.
2. Select **Production mode** and choose your nearest data hosting region (e.g., `us-east1`).
3. Click **Enable**.

### C. Cloud Storage
1. Navigate to **Build > Storage** and click **Get Started**.
2. Choose **Production mode** (default rules will be updated by our secure local file rules).
3. Select your storage bucket location matching your Firestore database region and click **Done**.

---

## 3. Firebase CLI Security Rules Deployment

Nexus V1 ships with robust, tested security rules defining precise permissions, profile ownership, role controls, soft-delete constraints, and file constraints:
- `firestore.rules`: Defines read/write boundaries, workspace role constraints, message isolation, and soft-delete enforcement.
- `storage.rules`: Implements profile-owner restricted write paths, image type validation, and strict file size limits (2MB).

To deploy these security policies directly from this repository:

1. Install the global Firebase Command Line Interface if you haven't already:
   ```bash
   npm install -g firebase-tools
   ```
2. Log in and authenticate your CLI with your Google Account:
   ```bash
   firebase login
   ```
3. Initialize the CLI association with your production Firebase Project:
   ```bash
   firebase use --add
   ```
4. Deploy the Security Rules for both Cloud Firestore and Cloud Storage:
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```

---

## 4. Vercel Deployment & Compatibility

Nexus V1 is built on the modern **Next.js 15 App Router** utilizing optimized build compiling and dynamic route caching.

### Deploying via Vercel Git Integration
1. Go to your **Vercel Dashboard** and click **Add New > Project**.
2. Import your Nexus V1 Git repository.
3. In **Build & Development Settings**, keep default options:
   - Framework Preset: `Next.js`
   - Build Command: `next build` or `npm run build`
4. Expand **Environment Variables** and copy the values audited in Section 1 of this document.
5. Click **Deploy**. Vercel will build, compile types, audit code patterns, generate page paths, and launch the platform.

---

## 5. Search Engine Optimization & Crawling Controls

To maximize search discoverability while securing private operational paths, Nexus V1 utilizes programmatic crawling parameters:
- **`app/robots.ts`**: Expressly authorizes crawler search engines (`Googlebot`, `Bingbot`, etc.) to index the landing page `/` and the sign-in endpoint `/login`, while strictly blocking crawling access to private dashboard sub-paths (`/dashboard/`, `/projects/`, `/onboarding/`).
- **`app/sitemap.ts`**: Programmatically generates a complete sitemap list indexing the public routes (`/` and `/login`) with search priority metadata.

---

## 6. Comprehensive Production Launch QA Checklist

Before announcing the public launch of Nexus V1, complete this step-by-step Quality Assurance (QA) verification checklist:

### Phase A: Setup & Builds
- [ ] **TypeScript Compilations**: Run `npm run build` locally to verify 0 compiler errors.
- [ ] **Linter Conformity**: Run `npm run lint` and confirm code complies with rules.
- [ ] **Environment Variable Verification**: Ensure `NEXT_PUBLIC_MOCK_AUTH` is explicitly configured to `false` or deleted on Vercel.

### Phase B: Auth & Account Creation
- [ ] **Email Sign Up**: Verify creating a new email account from `/login` correctly puts users into `onboardingComplete: false` and redirects them to the onboarding guide.
- [ ] **Google Sign In**: Verify registering/signing in with Google functions correctly.
- [ ] **Onboarding Form**: Progress through onboarding steps, confirming username validation checks and avatar photo uploads (size < 2MB).
- [ ] **Onboarding Redirect**: Verify onboarding complete flag flips to `true` and users are cleanly forwarded to `/dashboard`.
- [ ] **Protected Routes**: Try to navigate manually to `/dashboard` from an unauthenticated incognito browser, verifying automatic redirection back to `/login`.

### Phase C: Workspace & Project Coordination
- [ ] **Workspace Creation**: Create team-level and personal-level workspaces.
- [ ] **Workspace Switching**: Verify dropdown switcher smoothly swaps workspace scopes.
- [ ] **Project Add**: Create projects, ensuring status starts as `active`.
- [ ] **Task Creation**: Create tasks within projects, checking status transition updates on the Kanban Board view.
- [ ] **Task Soft-Delete**: soft-delete a task and ensure it disappears from view and updates the parent project counter.

### Phase D: Notes, Messaging, & Calendar
- [ ] **Tiptap Notes**: Create collaborative notes, test rich-text tools, and verify soft-deletion and note restoration.
- [ ] **Direct Message Channels**: Open conversation channels with team members, ensuring messages arrive dynamically.
- [ ] **Live Object Attachments**: Attach a project or task inside a message chat, confirming click-through navigation routes users to correct detail pages.
- [ ] **Unified Calendar Dashboard**: Verify task target dates, project deadlines, and user-scheduled events are dynamically populated onto `/dashboard/calendar`.

---
*For further technical support or architecture deep-dives, consult standard SaaS platform administrators or the Nexus V1 Developer documentation.*
