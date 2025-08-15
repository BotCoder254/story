# Wanderlust Stories - Technical Stack & Guidelines

## Tech Stack

### Frontend Framework
- **React 19** with functional components and hooks
- **React Router DOM 6** for client-side routing
- **Create React App** as the build system

### Styling & UI
- **Tailwind CSS 3** with custom design system
- **Framer Motion** for animations and transitions
- **React Icons** for iconography
- **Custom Color Palette**: Deep Ocean Blue (#0ea5e9), Sunset Orange (#f37316), Forest Green (#22c55e)
- **Typography**: Poppins (display), Inter (body)

### State Management & Data Fetching
- **TanStack Query (React Query)** for server state management and caching
- **React Context** for global state (Auth, Theme)
- **React Hook Form** for form handling and validation

### Backend & Database
- **Firebase Authentication** (Email/Password + Google Sign-in)
- **Firestore** for real-time database
- **Firebase Storage** for media files
- **Google Gemini AI** for content enhancement

### Maps & Geolocation
- **React Leaflet** with OpenStreetMap
- **Leaflet.markercluster** for map clustering
- **ngeohash** for geospatial queries
- **geofire-common** for location utilities

### Development Tools
- **ESLint** with react-app configuration
- **React Testing Library** for component testing
- **Web Vitals** for performance monitoring

## Build System & Commands

### Development
```bash
npm start          # Start development server (localhost:3000)
npm test           # Run tests in watch mode
npm run build      # Create production build
npm run eject      # Eject from Create React App (not recommended)
```

### Package Management
```bash
npm install        # Install dependencies
npm ci             # Clean install for CI/CD
npm audit          # Check for security vulnerabilities
npm update         # Update dependencies
```

### Firebase Deployment
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

## Code Style & Conventions

### Component Structure
- Use functional components with hooks
- Prefer named exports over default exports for components
- Use PascalCase for component names
- Use camelCase for props and variables

### File Organization
- Components in `/src/components/` organized by feature
- Services in `/src/services/` for business logic
- Contexts in `/src/contexts/` for global state
- Pages in `/src/pages/` for route components

### Styling Guidelines
- Use Tailwind utility classes
- Custom colors from the design system (primary, secondary, accent, neutral)
- Responsive design with mobile-first approach
- Dark mode support with `dark:` prefixes

### State Management Patterns
- Use TanStack Query for server state
- Use React Context sparingly for truly global state
- Prefer local state with useState for component-specific state
- Use useEffect for side effects and cleanup

### Error Handling
- Use React Error Boundaries for component-level errors
- Implement try-catch blocks in async functions
- Use react-hot-toast for user-friendly error messages
- Log errors to console for debugging

### Performance Best Practices
- Use React.memo for expensive components
- Implement virtualization for large lists (TanStack Virtual)
- Optimize images and use appropriate formats
- Implement code splitting with React.lazy
- Use Firestore listeners efficiently to avoid unnecessary re-renders