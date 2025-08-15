import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'border-primary-600',
    secondary: 'border-secondary-600',
    accent: 'border-accent-600',
    white: 'border-white',
    neutral: 'border-neutral-600'
  };

  return (
    <motion.div
      className={`
        ${sizeClasses[size]} 
        ${colorClasses[color]}
        border-2 border-t-transparent rounded-full
        ${className}
      `}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );
};

export default LoadingSpinner;