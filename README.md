# 🌍 Wanderlust Stories

A modern, AI-powered travel story app built with React and Firebase. Share your adventures, connect with fellow travelers, and inspire others to explore the world.

![Wanderlust Stories](https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=400&fit=crop)

## ✨ Features

### Core Features
- **🤖 AI-Powered Storytelling**: Transform your travel photos into compelling narratives with Google Gemini
- **📱 Three-Column Layout**: Desktop layout with left nav, center feed, and right sidebar
- **🔄 Real-time Feed**: Live updates with infinite scroll and virtualization
- **✍️ Advanced Composer**: Full-featured story editor with AI assistance
- **🗺️ Interactive Maps**: Visualize your journeys with beautiful maps
- **👥 Community Driven**: Connect with fellow travelers and share experiences

### AI Features
- **📝 Title Suggestions**: AI-generated compelling titles
- **🏷️ Auto-tagging**: Smart tag suggestions based on content
- **📄 Content Summarization**: Automatic story summaries
- **📸 Instagram Captions**: Generate social media ready captions
- **✨ Story Enhancement**: Improve writing with AI assistance

### Technical Features
- **🌙 Dark Mode**: Beautiful dark/light theme toggle
- **📱 Mobile Responsive**: Optimized three-column to single-column layout
- **🔐 Secure Authentication**: Firebase Auth with Google Sign-in
- **⚡ Real-time Updates**: Live feed updates with Firestore listeners
- **🚀 Performance**: Virtualized lists and optimized queries
- **💾 Auto-save**: Automatic draft saving every 5 seconds

## 🚀 Tech Stack

- **Frontend**: React 19, React Router DOM
- **Styling**: Tailwind CSS with custom design system
- **Animation**: Framer Motion
- **State Management**: TanStack Query
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Storage**: Firebase Storage
- **Icons**: React Icons
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast

## 🎨 Design System

### Color Palette
- **Primary**: Deep Ocean Blue (#0ea5e9)
- **Secondary**: Sunset Orange (#f37316)
- **Accent**: Forest Green (#22c55e)
- **Neutral**: Modern Grays

### Typography
- **Display**: Poppins (headings)
- **Body**: Inter (content)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd wanderlust-stories
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password and Google)
   - Enable Firestore Database
   - Enable Storage
   - Copy your Firebase config

4. **Configure Firebase**
   - Update `src/config/firebase.js` with your Firebase configuration:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-app-id"
   };
   ```

5. **Set up Firestore Security Rules**
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
         allow write: if request.auth != null;
       }
     }
   }
   ```

6. **Start the development server**
   ```bash
   npm start
   ```

## 🌐 Deployment

### Deploy to Vercel
1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables if needed
4. Deploy!

### Deploy to Netlify
1. Build the project: `npm run build`
2. Drag and drop the `build` folder to [Netlify](https://netlify.com)
3. Or connect your GitHub repository for automatic deployments

### Deploy to Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Build: `npm run build`
5. Deploy: `firebase deploy`

## 📱 Pages & Features

### Landing Page
- Hero section with compelling visuals
- Featured stories carousel
- Community showcase
- Feature highlights
- Call-to-action sections

### Authentication
- **Login Page**: Email/password and Google sign-in
- **Signup Page**: Account creation with validation
- **Forgot Password**: Password reset functionality
- Split-screen design with travel imagery

### Dashboard
- Personal story management
- Travel statistics
- Interactive navigation
- Profile settings
- Trending destinations

## 🎯 Project Structure

```
src/
├── components/
│   └── common/
│       ├── ThemeToggle.js
│       └── LoadingSpinner.js
├── contexts/
│   ├── AuthContext.js
│   └── ThemeContext.js
├── pages/
│   ├── auth/
│   │   ├── LoginPage.js
│   │   ├── SignupPage.js
│   │   └── ForgotPasswordPage.js
│   ├── LandingPage.js
│   └── DashboardPage.js
├── config/
│   └── firebase.js
├── App.js
├── index.js
└── index.css
```

## 🔧 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## 🌟 Key Features Implementation

### Authentication Flow
- Protected routes with automatic redirects
- Persistent login state
- Error handling with user-friendly messages
- Profile creation in Firestore

### Theme System
- System preference detection
- Smooth transitions between themes
- Persistent theme selection
- CSS custom properties for dynamic styling

### Responsive Design
- Mobile-first approach
- Flexible grid layouts
- Touch-friendly interactions
- Optimized images and assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Unsplash](https://unsplash.com) for beautiful travel photography
- [React Icons](https://react-icons.github.io/react-icons/) for the icon library
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS framework
- [Framer Motion](https://www.framer.com/motion/) for smooth animations

## 📞 Support

If you have any questions or need help setting up the project, please open an issue or contact the maintainers.

---

**Happy Traveling! 🌍✈️**