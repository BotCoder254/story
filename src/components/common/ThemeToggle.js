import React from 'react';
import { motion } from 'framer-motion';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className={`relative w-14 h-7 bg-neutral-200 dark:bg-neutral-700 rounded-full p-1 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="w-5 h-5 bg-white dark:bg-neutral-800 rounded-full shadow-sm flex items-center justify-center"
        animate={{
          x: isDark ? 24 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30
        }}
      >
        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 0 : 1,
            rotate: isDark ? 180 : 0,
          }}
          transition={{ duration: 0.2 }}
          className="absolute"
        >
          <FiSun className="w-3 h-3 text-yellow-500" />
        </motion.div>
        
        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 1 : 0,
            rotate: isDark ? 0 : -180,
          }}
          transition={{ duration: 0.2 }}
          className="absolute"
        >
          <FiMoon className="w-3 h-3 text-blue-400" />
        </motion.div>
      </motion.div>
    </motion.button>
  );
};

export default ThemeToggle;