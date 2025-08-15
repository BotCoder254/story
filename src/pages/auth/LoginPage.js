import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowLeft,
  FiGlobe
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../../components/common/ThemeToggle';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signin, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      await signin(data.email, data.password);
      navigate(from, { replace: true });
    } catch (error) {
      setError('root', {
        type: 'manual',
        message: 'Failed to sign in. Please check your credentials.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (error) {
      setError('root', {
        type: 'manual',
        message: 'Failed to sign in with Google.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=1200&fit=crop"
          alt="Mountain landscape"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/80 via-primary-700/60 to-secondary-600/80" />
        
        {/* Overlay Content */}
        <div className="absolute inset-0 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <FiGlobe className="text-lg" />
            </div>
            <span className="text-xl font-display font-bold">
              Wanderlust Stories
            </span>
          </div>
          
          <div className="space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl lg:text-5xl font-display font-bold leading-tight"
            >
              Welcome back to your
              <span className="block text-secondary-200">
                adventure journal
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-white/90 leading-relaxed max-w-md"
            >
              Continue sharing your travel stories and inspiring others to explore the world.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center space-x-4 text-white/80"
            >
              <div className="flex -space-x-2">
                <img
                  src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face"
                  alt="User"
                  className="w-10 h-10 rounded-full border-2 border-white/30"
                />
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face"
                  alt="User"
                  className="w-10 h-10 rounded-full border-2 border-white/30"
                />
                <img
                  src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face"
                  alt="User"
                  className="w-10 h-10 rounded-full border-2 border-white/30"
                />
              </div>
              <span className="text-sm">Join 10,000+ storytellers</span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden relative h-48 bg-gradient-to-br from-primary-600 to-secondary-600">
          <img
            src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=400&fit=crop"
            alt="Mountain landscape"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <FiGlobe className="text-lg" />
                </div>
                <span className="text-xl font-display font-bold">
                  Wanderlust Stories
                </span>
              </div>
              <p className="text-white/90">Welcome back!</p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-neutral-900">
          <div className="w-full max-w-md space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <Link
                to="/"
                className="inline-flex items-center text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-4"
              >
                <FiArrowLeft className="mr-2" />
                Back to home
              </Link>
              
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-display font-bold text-neutral-900 dark:text-white"
              >
                Sign in to your account
              </motion.h2>
              
              <p className="text-neutral-600 dark:text-neutral-400">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                >
                  Sign up
                </Link>
              </p>
            </div>

            {/* Theme Toggle */}
            <div className="flex justify-center">
              <ThemeToggle />
            </div>

            {/* Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    className={`input-field pl-10 ${errors.email ? 'input-error' : ''}`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    className={`input-field pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Forgot your password?
                </Link>
              </div>

              {/* Error Message */}
              {errors.root && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.root.message}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Signing in...</span>
                  </div>
                ) : (
                  'Sign in'
                )}
              </motion.button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-300 dark:border-neutral-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google Sign In */}
              <motion.button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FcGoogle className="text-xl mr-3" />
                Sign in with Google
              </motion.button>
            </motion.form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;