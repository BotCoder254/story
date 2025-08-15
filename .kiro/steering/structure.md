# Wanderlust Stories - Project Structure & Architecture

## Project Organization

### Root Directory Structure
```
wanderlust-stories/
├── public/                 # Static assets and HTML template
├── src/                   # Source code
├── .env.example          # Environment variables template
├── .gitignore           # Git ignore rules
├── package.json         # Dependencies and scripts
├── tailwind.config.js   # Tailwind CSS configuration
└── README.md           # Project documentation
```

### Source Code Architecture (`/src`)

#### Core Application Files
```
src/
├── App.js              # Main app component with routing
├── index.js           # React app entry point
├── index.css          # Global styles and Tailwind imports
└── setupTests.js      # Test configuration
```

#### Component Organization (`/src/components`)
Components are organized by feature/domain:

```
components/
├── common/            # Reusable UI components
│   ├── LoadingSpinner.js
│   └── ThemeToggle.js
├── composer/          # Story creation components
│   └── Composer.js
├── feed/             # Feed and story display
│   ├── Feed.js
│   ├── StoryCard.js
│   └── StoryCardSkeleton.js
├── map/              # Map and location features
│   ├── NearbyStories.js
│   ├── TravelMap.js
│   └── TripTimeline.js
├── search/           # Search functionality
│   ├── SearchBar.js
│   └── SearchResults.js
└── social/           # Social interaction components
    └── Comments.js
```

#### Pages & Routing (`/src/pages`)
Route-level components organized by feature:

```
pages/
├── auth/             # Authentication pages
│   ├── LoginPage.js
│   ├── SignupPage.js
│   └── ForgotPasswordPage.js
├── DashboardPage.js  # Main dashboard (three-column layout)
├── LandingPage.js    # Public landing page
└── SearchPage.js     # Search and discovery
```

#### Business Logic (`/src/services`)
Service layer for API interactions and business logic:

```
services/
├── aiService.js              # Google Gemini AI integration
├── geolocationService.js     # GPS and location utilities
├── searchService.js          # Search functionality
├── socialService.js          # Social interactions (likes, follows)
├── storyService.js          # Story CRUD operations
└── storyServiceExtended.js  # Extended story features
```

#### Global State (`/src/contexts`)
React contexts for application-wide state:

```
contexts/
├── AuthContext.js    # User authentication and profile
└── ThemeContext.js   # Dark/light theme management
```

#### Configuration (`/src/config`)
```
config/
└── firebase.js       # Firebase configuration and initialization
```

#### Custom Hooks (`/src/hooks`)
```
hooks/
└── useDebounce.js    # Debouncing utility hook
```

## Architectural Patterns

### Component Hierarchy
- **App.js**: Root component with providers (Auth, Theme, Query)
- **Pages**: Route-level components that compose features
- **Feature Components**: Domain-specific components (feed, composer, map)
- **Common Components**: Reusable UI elements

### Data Flow Architecture
1. **UI Components** trigger actions
2. **Services** handle business logic and API calls
3. **Contexts** manage global state
4. **TanStack Query** handles server state and caching
5. **Firebase** provides real-time data synchronization

### Routing Structure
- **Public Routes**: Landing, Login, Signup, Forgot Password
- **Protected Routes**: Dashboard, Search (require authentication)
- **Route Guards**: PublicRoute and ProtectedRoute components handle redirects

### Service Layer Pattern
Each service handles a specific domain:
- **storyService**: Story CRUD, media upload, real-time listeners
- **socialService**: Likes, comments, follows, notifications
- **geolocationService**: GPS, geocoding, distance calculations
- **aiService**: Google Gemini integration for content enhancement

## File Naming Conventions

### Components
- **PascalCase** for component files: `StoryCard.js`, `LoadingSpinner.js`
- **camelCase** for utility files: `useDebounce.js`, `firebase.js`
- **kebab-case** for CSS classes (following Tailwind conventions)

### Directories
- **camelCase** for feature directories: `components/`, `services/`
- **lowercase** for simple directories: `auth/`, `map/`

## Import/Export Patterns

### Component Exports
```javascript
// Prefer named exports for components
export const StoryCard = ({ story }) => { ... };

// Default export for main component files
export default StoryCard;
```

### Service Exports
```javascript
// Services use class instances or object exports
class StoryService { ... }
export default new StoryService();
```

### Context Exports
```javascript
// Export both context and hook
export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);
export const AuthProvider = ({ children }) => { ... };
```

## Development Guidelines

### Component Structure
1. **Imports** (React, libraries, local imports)
2. **Component definition** with props destructuring
3. **Hooks and state** declarations
4. **Event handlers** and utility functions
5. **Render logic** with early returns for loading/error states
6. **Export statement**

### State Management Hierarchy
1. **Local state** (useState) for component-specific data
2. **TanStack Query** for server state and caching
3. **React Context** for truly global state (auth, theme)
4. **Props** for parent-child communication

### Error Boundaries
- Implement at route level for page-wide error handling
- Use try-catch in async functions with user-friendly error messages
- Log errors for debugging while showing graceful UI feedback