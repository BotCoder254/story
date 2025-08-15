import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Set CSS custom properties for toast styling
document.documentElement.style.setProperty('--toast-bg', '#ffffff');
document.documentElement.style.setProperty('--toast-color', '#374151');
document.documentElement.style.setProperty('--toast-border', '#e5e7eb');

// Update toast colors based on theme
const updateToastColors = () => {
  const isDark = document.documentElement.classList.contains('dark');
  if (isDark) {
    document.documentElement.style.setProperty('--toast-bg', '#1f2937');
    document.documentElement.style.setProperty('--toast-color', '#f3f4f6');
    document.documentElement.style.setProperty('--toast-border', '#374151');
  } else {
    document.documentElement.style.setProperty('--toast-bg', '#ffffff');
    document.documentElement.style.setProperty('--toast-color', '#374151');
    document.documentElement.style.setProperty('--toast-border', '#e5e7eb');
  }
};

// Watch for theme changes
const observer = new MutationObserver(updateToastColors);
observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['class']
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);