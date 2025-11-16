# StudentERP Mobile App Setup Guide

## Prerequisites

1. **Node.js** (LTS version 18.x or 20.x)
2. **Java JDK 17** (Adoptium Temurin recommended)
3. **Android Studio** with SDK Platform 34+ and Platform Tools
4. **Firebase CLI**: `npm install -g firebase-tools`
5. **React Native CLI**: `npm install -g @react-native-community/cli`

## Environment Setup

### 1. Environment Variables
```bash
# Windows
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.x.x-hotspot
set ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools

# Add to your system PATH:
# - %ANDROID_HOME%\platform-tools
# - %ANDROID_HOME%\tools
# - %JAVA_HOME%\bin
```

### 2. Firebase Configuration

#### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project: `studenterp-mobile`
3. Enable Authentication, Firestore, Cloud Functions, and Cloud Messaging

#### Step 2: Configure Authentication
1. Go to Authentication > Sign-in method
2. Enable Email/Password provider
3. Add authorized domains if needed

#### Step 3: Configure Firestore
1. Go to Firestore Database
2. Create database in production mode
3. Deploy security rules: `firebase deploy --only firestore:rules`

#### Step 4: Android App Setup
1. Go to Project Settings > General
2. Add Android app with package name: `com.studenterp.mobile`
3. Download `google-services.json`
4. Copy to `android/app/google-services.json`

#### Step 5: Update Configuration Files
1. Copy `.env.example` to `.env`
2. Fill in your Firebase project details:
```env
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_API_KEY=your-firebase-api-key
# ... other values from Firebase console
```

3. Update `.firebaserc` with your project IDs:
```json
{
  "projects": {
    "default": "your-firebase-project-id",
    "dev": "your-firebase-project-id-dev",
    "prod": "your-firebase-project-id-prod"
  }
}
```

### 3. Cloudflare R2 Configuration

#### Step 1: Create R2 Bucket
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to R2 Object Storage
3. Create bucket: `studenterp-documents`
4. Configure CORS settings:
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

#### Step 2: Create API Token
1. Go to R2 > Manage R2 API tokens
2. Create token with Object Read & Write permissions
3. Note down Access Key ID and Secret Access Key

#### Step 3: Update Environment Variables
```env
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_R2_BUCKET_NAME=studenterp-documents
CLOUDFLARE_R2_ACCESS_KEY_ID=your-r2-access-key-id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
```

## Installation & Deployment

### 1. Install Dependencies

#### Root Project
```bash
cd mobileapp
npm install
```

#### Cloud Functions
```bash
cd functions
npm install
```

### 2. Firebase Setup
```bash
# Login to Firebase
firebase login

# Initialize project (if not already done)
firebase init

# Deploy Firestore rules and indexes
firebase deploy --only firestore

# Deploy Cloud Functions
firebase deploy --only functions
```

### 3. React Native Setup

#### Initialize React Native (if not done)
Since the mobileapp folder exists, you have two options:

**Option 1: Recreate folder (Recommended)**
```bash
# From StudentERP root directory
rmdir /s mobileapp
npx @react-native-community/cli@latest init mobileapp
# Then copy the configuration files back
```

**Option 2: Manual setup**
```bash
# From StudentERP root directory
npx @react-native-community/cli@latest init StudentERPMobileTemp
# Copy contents to mobileapp folder
# Delete temp folder
```

#### Install React Native Dependencies
```bash
cd mobileapp
npm install

# For Android
npx react-native run-android
```

### 4. Android Configuration

#### Update android/app/build.gradle
Add at the bottom:
```gradle
apply plugin: 'com.google.gms.google-services'
```

#### Update android/build.gradle
Add to dependencies:
```gradle
classpath 'com.google.gms:google-services:4.3.15'
```

#### Update MainApplication.java
```java
import io.invertase.firebase.app.ReactNativeFBAppPackage;

// Add to packages list
new ReactNativeFBAppPackage()
```

## Development Workflow

### 1. Start Development Server
```bash
# Terminal 1: Start Metro bundler
npm start

# Terminal 2: Run Android app
npm run android
```

### 2. Deploy Functions
```bash
cd functions
npm run deploy
```

### 3. Test Firestore Rules
```bash
firebase emulators:start --only firestore
# Test rules in Firebase console
```

## Security Checklist

- [ ] Firestore security rules deployed and tested
- [ ] R2 bucket is private (no public access)
- [ ] Environment variables are not committed to git
- [ ] Firebase project has proper IAM roles
- [ ] FCM server key is stored securely
- [ ] API endpoints validate authentication tokens

## Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache with `npx react-native start --reset-cache`
2. **Android build fails**: Clean with `cd android && ./gradlew clean`
3. **Firebase connection issues**: Check google-services.json placement
4. **R2 CORS errors**: Verify CORS configuration in Cloudflare dashboard

### Logs and Debugging

```bash
# View Cloud Functions logs
firebase functions:log

# View Android logs
npx react-native log-android

# View Firestore security rules simulator
# Go to Firebase Console > Firestore > Rules > Simulator
```

## Next Steps

1. Set up CI/CD pipeline with GitHub Actions
2. Configure app signing for release builds
3. Set up crash reporting with Firebase Crashlytics
4. Implement offline-first data synchronization
5. Add comprehensive testing suite
