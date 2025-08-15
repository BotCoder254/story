import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  FiMail,
  FiArrowLeft,
  FiGlobe,
  FiCheck
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../../components/common/ThemeToggle';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    getValues
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      await resetPassword(data.email);
      setEmailSent(true);
    } catch (error) {
      setError('root', {
        type: 'manual',
        message: 'Failed to send reset email. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex">
        {/* Left Side - Image */}
        <div className="hidden lg:flex lg:w-1/2 relative">
          <img
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=1200&fit=crop"
            alt="Mountain landscape"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-accent-600/80 via-primary-700/60 to-primary-600/80" />
          
          <div className="absolute inset-0 flex flex-col justify-center items-center p-12 text-white text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-8"
            >
              <FiCheck className="text-4xl text-accent-300" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-display font-bold mb-4"
            >
              Check your email
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-white/90 leading-relaxed max-w-md"
            >
              We've sent password reset instructions to your email address.
            </motion.p>
          </div>
        </div>

        {/* Right Side - Success Message */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <div className="lg:hidden relative h-48 bg-gradient-to-br from-accent-600 to-primary-600">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCheck className="text-2xl text-accent-300" />
                </div>
                <h2 className="text-xl font-display font-bold">Check your email</h2>
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-neutral-900">
            <div className="w-full max-w-md space-y-8 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-accent-100 dark:bg-accent-900/30 rounded-full flex items-center justify-center mx-auto lg:hidden">
                  <FiCheck className="text-2xl text-accent-600 dark:text-accent-400" />
                </div>
                
                <h2 className="text-3xl font-display font-bold text-neutral-900 dark:text-white">
                  Check your email
                </h2>
                
                <p className="text-neutral-600 dark:text-neutral-400">
                  We've sent password reset instructions to{' '}
                  <span className="font-medium text-neutral-900 dark:text-white">
                    {getValues('email')}
                  </span>
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-accent-50 dark:bg-accent-900/20 rounded-lg border border-accent-200 dark:border-accent-800">
                  <p className="text-sm text-accent-700 dark:text-accent-300">
                    <strong>Didn't receive the email?</strong> Check your spam folder or try again with a different email address.
                  </p>
                </div>

                <div className="flex flex-col space-y-3">
                  <Link
                    to="/login"
                    className="btn-primary"
                  >
                    Back to sign in
                  </Link>
                  
                  <button
                    onClick={() => {
                      setEmailSent(false);
                      setIsLoading(false);
                    }}
                    className="btn-ghost"
                  >
                    Try different email
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=1200&fit=crop"
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
              Forgot your password?
              <span className="block text-secondary-200">
                No worries!
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-white/90 leading-relaxed max-w-md"
            >
              Enter your email address and we'll send you instructions to reset your password.
            </motion.p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden relative h-48 bg-gradient-to-br from-primary-600 to-secondary-600">
          <img
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop"
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
              <p className="text-white/90">Reset your password</p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-neutral-900">
          <div className="w-full max-w-md space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <Link
                to="/login"
                className="inline-flex items-center text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-4"
              >
                <FiArrowLeft className="mr-2" />
                Back to sign in
              </Link>
              
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-display font-bold text-neutral-900 dark:text-white"
              >
                Reset your password
              </motion.h2>
              
              <p className="text-neutral-600 dark:text-neutral-400">
                Enter your email address and we'll send you a link to reset your password.
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
                    <span className="ml-2">Sending reset link...</span>
                  </div>
                ) : (
                  'Send reset link'
                )}
              </motion.button>

              {/* Back to Login */}
              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Remember your password? Sign in
                </Link>
              </div>
            </motion.form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;