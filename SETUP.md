# 🚀 Wanderlust Stories - Complete Setup Guide

This guide will walk you through setting up the complete Wanderlust Stories application with all features including AI integration, real-time feed, and Firebase backend.

## 📋 Prerequisites

- Node.js 16+ installed
- Firebase account
- Google Cloud account (for Gemini AI)
- Git installed

## 🔧 Step-by-Step Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd wanderlust-stories

# Install dependencies
npm install --legacy-peer-deps
```

### 2. Firebase Setup

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `wanderlust-stories`
4. Enable Google Analytics (optional)
5. Create project

#### Enable Authentication
1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password**
3. Enable **Google** sign-in
   - Add your domain to authorized domains
   - Download the config for web

#### Setup Firestore Database
1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (we'll add security rules later)
4. Select a location close to your users

#### Enable Storage
1. Go to **Storage**
2. Click **Get started**
3. Start in test mode
4. Choose same location as Firestore

#### Get Firebase Config
1. Go to **Project Settings** (gear icon)
2. Scroll down to **Your apps**
3. Click **Web app** icon
4. Register app with name "Wanderlust Stories"
5. Copy the config object

### 3. Google Gemini AI Setup

#### Get Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the API key

### 4. Environment Configuration

Create `.env.local` file in the root directory:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id

# Google Gemini AI Configuration
REACT_APP_GEMINI_API_KEY=your-gemini-api-key
```

### 5. Update Firebase Configuration

Update `src/config/firebase.js` with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};
```

### 6. Firestore Security Rules

In Firebase Console, go to **Firestore Database** > **Rules** and update:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Stories are readable by all, writable by authenticated users
    match /stories/{storyId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == resource.data.authorId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.authorId;
    }
    
    // User likes - users can only manage their own likes
    match /userLikes/{likeId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // User bookmarks - users can only manage their own bookmarks
    match /userBookmarks/{bookmarkId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### 7. Storage Security Rules

In Firebase Console, go to **Storage** > **Rules** and update:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can upload to their own folders
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 8. Firestore Indexes

Create these composite indexes in **Firestore Database** > **Indexes**:

1. **Stories Collection**:
   - Fields: `isDraft` (Ascending), `pinned` (Descending), `createdAt` (Descending)
   - Fields: `isDraft` (Ascending), `pinned` (Descending), `score` (Descending), `createdAt` (Descending)
   - Fields: `authorId` (Ascending), `createdAt` (Descending)
   - Fields: `authorId` (Ascending), `isDraft` (Ascending), `createdAt` (Descending)

2. **User Likes Collection**:
   - Fields: `userId` (Ascending), `createdAt` (Descending)

3. **User Bookmarks Collection**:
   - Fields: `userId` (Ascending), `createdAt` (Descending)

### 9. Start Development Server

```bash
npm start
```

The app will open at `http://localhost:3000`

## 🎯 Testing the Application

### 1. Test Authentication
1. Go to the landing page
2. Click "Get Started" or "Sign In"
3. Create a new account or sign in with Google
4. Verify you're redirected to the dashboard

### 2. Test Story Creation
1. Click the "Create New Story" button
2. Fill in title and content
3. Test AI features:
   - Click "Suggest titles"
   - Click "Auto-tag"
   - Click "Summarize"
   - Click "Instagram Caption"
4. Upload some images
5. Add location and tags
6. Save as draft or publish

### 3. Test Feed
1. Create a few stories
2. Check the feed updates in real-time
3. Test like/bookmark functionality
4. Test different feed types (Latest, Trending, etc.)

### 4. Test Mobile Responsiveness
1. Open developer tools
2. Switch to mobile view
3. Test navigation and composer
4. Verify floating action button works

## 🚀 Deployment Options

### Vercel (Recommended)
1. Push code to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy

### Netlify
1. Build: `npm run build`
2. Deploy `build` folder to Netlify
3. Add environment variables

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

## 🔧 Troubleshooting

### Common Issues

1. **Firebase Config Error**
   - Ensure all environment variables are set correctly
   - Check Firebase project settings

2. **AI Features Not Working**
   - Verify Gemini API key is correct
   - Check browser console for errors
   - Ensure API key has proper permissions

3. **Real-time Updates Not Working**
   - Check Firestore security rules
   - Verify user authentication
   - Check browser console for connection errors

4. **Image Upload Failing**
   - Check Storage security rules
   - Verify file size limits (10MB max)
   - Check file type restrictions

### Performance Optimization

1. **Enable Firestore Offline Persistence**
   ```javascript
   import { enableNetwork, disableNetwork } from 'firebase/firestore';
   // Enable offline persistence in firebase.js
   ```

2. **Optimize Images**
   - Implement image compression before upload
   - Use WebP format when possible
   - Generate multiple sizes for responsive images

3. **Implement Caching**
   - Use TanStack Query for better caching
   - Implement service worker for offline support

## 📊 Monitoring and Analytics

### Firebase Analytics
1. Enable Analytics in Firebase Console
2. Add analytics tracking to key user actions
3. Monitor user engagement and retention

### Performance Monitoring
1. Enable Performance Monitoring in Firebase
2. Track page load times and user interactions
3. Monitor API response times

## 🔒 Security Best Practices

1. **Environment Variables**
   - Never commit `.env.local` to version control
   - Use different configs for development/production

2. **API Keys**
   - Restrict Firebase API keys to specific domains
   - Monitor API usage and set quotas

3. **User Data**
   - Implement proper data validation
   - Sanitize user inputs
   - Follow GDPR compliance if applicable

## 📈 Scaling Considerations

1. **Database**
   - Monitor Firestore usage and costs
   - Implement pagination for large datasets
   - Consider data archiving strategies

2. **Storage**
   - Implement CDN for image delivery
   - Set up automatic image optimization
   - Monitor storage costs

3. **AI Usage**
   - Monitor Gemini API usage and costs
   - Implement rate limiting for AI features
   - Cache AI responses when appropriate

---

## 🎉 You're All Set!

Your Wanderlust Stories application is now fully configured with:
- ✅ Real-time feed with infinite scroll
- ✅ AI-powered story creation
- ✅ Secure authentication
- ✅ Image upload and storage
- ✅ Mobile-responsive design
- ✅ Dark mode support

Happy coding! 🚀