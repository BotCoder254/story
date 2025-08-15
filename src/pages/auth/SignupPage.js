import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiUser,
  FiArrowLeft,
  FiGlobe,
  FiCheck
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../../components/common/ThemeToggle';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const SignupPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signup, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      setError('confirmPassword', {
        type: 'manual',
        message: 'Passwords do not match'
      });
      return;
    }

    try {
      setIsLoading(true);
      await signup(data.email, data.password, data.fullName);
      navigate('/dashboard');
    } catch (error) {
      setError('root', {
        type: 'manual',
        message: 'Failed to create account. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (error) {
      setError('root', {
        type: 'manual',
        message: 'Failed to sign up with Google.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordRequirements = [
    { text: 'At least 6 characters', met: password && password.length >= 6 },
    { text: 'Contains a number', met: password && /\d/.test(password) },
    { text: 'Contains a letter', met: password && /[a-zA-Z]/.test(password) }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=1200&fit=crop"
          alt="Adventure landscape"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-secondary-600/80 via-primary-700/60 to-primary-600/80" />
        
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
              Start your journey as a
              <span className="block text-secondary-200">
                travel storyteller
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-white/90 leading-relaxed max-w-md"
            >
              Join our community of passionate travelers and share your adventures with the world.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              <div className="flex items-center space-x-3 text-white/90">
                <div className="w-6 h-6 bg-accent-500 rounded-full flex items-center justify-center">
                  <FiCheck className="text-sm" />
                </div>
                <span>AI-powered story creation</span>
              </div>
              <div className="flex items-center space-x-3 text-white/90">
                <div className="w-6 h-6 bg-accent-500 rounded-full flex items-center justify-center">
                  <FiCheck className="text-sm" />
                </div>
                <span>Connect with fellow travelers</span>
              </div>
              <div className="flex items-center space-x-3 text-white/90">
                <div className="w-6 h-6 bg-accent-500 rounded-full flex items-center justify-center">
                  <FiCheck className="text-sm" />
                </div>
                <span>Beautiful interactive maps</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden relative h-48 bg-gradient-to-br from-secondary-600 to-primary-600">
          <img
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop"
            alt="Adventure landscape"
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
              <p className="text-white/90">Join our community!</p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-neutral-900 custom-scrollbar overflow-y-auto">
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
                Create your account
              </motion.h2>
              
              <p className="text-neutral-600 dark:text-neutral-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                >
                  Sign in
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
              {/* Full Name Field */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Full name
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    {...register('fullName', {
                      required: 'Full name is required',
                      minLength: {
                        value: 2,
                        message: 'Name must be at least 2 characters'
                      }
                    })}
                    className={`input-field pl-10 ${errors.fullName ? 'input-error' : ''}`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

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
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                
                {/* Password Requirements */}
                {password && (
                  <div className="mt-2 space-y-1">
                    {passwordRequirements.map((req, index) => (
                      <div
                        key={index}
                        className={`flex items-center space-x-2 text-xs ${
                          req.met ? 'text-accent-600 dark:text-accent-400' : 'text-neutral-500 dark:text-neutral-400'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                          req.met ? 'bg-accent-500' : 'bg-neutral-300 dark:bg-neutral-600'
                        }`}>
                          {req.met && <FiCheck className="text-white text-xs" />}
                        </div>
                        <span>{req.text}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Confirm password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword', {
                      required: 'Please confirm your password'
                    })}
                    className={`input-field pl-10 pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Terms and Privacy */}
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                By creating an account, you agree to our{' '}
                <a href="#" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                  Privacy Policy
                </a>
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
                    <span className="ml-2">Creating account...</span>
                  </div>
                ) : (
                  'Create account'
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

              {/* Google Sign Up */}
              <motion.button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FcGoogle className="text-xl mr-3" />
                Sign up with Google
              </motion.button>
            </motion.form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;