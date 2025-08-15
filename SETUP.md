# Wanderlust Stories - Setup Guide

## Environment Variables

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Fill in your configuration values:

### Firebase Setup
- Go to [Firebase Console](https://console.firebase.google.com/)
- Create a new project or use existing one
- Enable Authentication (Email/Password and Google)
- Enable Firestore Database
- Enable Storage
- Copy your config values to `.env.local`

### Mapbox Setup
- Go to [Mapbox](https://www.mapbox.com/)
- Create a free account
- Get your access token from the dashboard
- Add it to `.env.local` as `REACT_APP_MAPBOX_TOKEN`

### Google Gemini AI (Optional)
- Go to [Google AI Studio](https://makersuite.google.com/)
- Get your API key
- Add it to `.env.local` as `REACT_APP_GEMINI_API_KEY`

## Installation

```bash
npm install
npm start
```

## Features Implemented

✅ **Mapbox Integration**: Interactive maps with story markers
✅ **User Profiles**: Clickable profiles with follow/unfollow functionality  
✅ **Real-time Activity**: Live notifications and activity feed
✅ **Enhanced Story Cards**: Image carousel with map integration
✅ **Travel Maps**: User travel history visualization
✅ **Social Features**: Follow system, user stats, profile editing
✅ **No Firebase Indexes**: All queries optimized to avoid composite indexes

## Key Components

- `TravelMap.js`: Mapbox-powered interactive map component
- `UserProfilePage.js`: Complete user profile with stats and social features
- `socialService.js`: Handles all social interactions and real-time updates
- Enhanced `StoryCard.js`: Clickable profiles and media carousel with maps
- Real-time activity feed in dashboard

## Notes

- All Firebase queries are optimized to avoid composite index requirements
- Maps work offline with fallback loading states
- Real-time updates for activity, notifications, and social interactions
- Responsive design maintains the same UI across all screen sizes