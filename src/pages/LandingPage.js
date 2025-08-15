import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiPlay,
  FiStar,
  FiUsers,
  FiGlobe,
  FiHeart,
  FiCamera,
  FiMap,
  FiBookOpen,
  FiGithub,
  FiExternalLink,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from '../components/common/ThemeToggle';

const LandingPage = () => {
  const { isDark } = useTheme();
  const { currentUser } = useAuth();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  // Sample stories for carousel
  const featuredStories = [
    {
      id: 1,
      title: "Sunrise Over Santorini",
      author: "Maria Rodriguez",
      image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&h=600&fit=crop",
      excerpt: "Watching the sun paint the white-washed buildings in golden hues...",
      location: "Santorini, Greece",
      likes: 234
    },
    {
      id: 2,
      title: "Lost in Tokyo Streets",
      author: "Kenji Tanaka",
      image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop",
      excerpt: "Neon lights reflecting on wet streets after midnight rain...",
      location: "Tokyo, Japan",
      likes: 189
    },
    {
      id: 3,
      title: "Sahara Desert Dreams",
      author: "Ahmed Hassan",
      image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&h=600&fit=crop",
      excerpt: "Endless dunes stretching beyond the horizon under starlit skies...",
      location: "Sahara Desert, Morocco",
      likes: 312
    }
  ];

  const contributors = [
    { name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face", stories: 23 },
    { name: "Marco Silva", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face", stories: 18 },
    { name: "Aisha Patel", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face", stories: 31 },
    { name: "David Kim", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face", stories: 15 },
    { name: "Elena Volkov", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face", stories: 27 },
    { name: "Carlos Mendez", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face", stories: 19 }
  ];

  const features = [
    {
      icon: FiCamera,
      title: "AI-Powered Storytelling",
      description: "Transform your travel photos into compelling narratives with our advanced AI writing assistant."
    },
    {
      icon: FiMap,
      title: "Interactive Maps",
      description: "Visualize your journeys with beautiful, interactive maps that bring your stories to life."
    },
    {
      icon: FiUsers,
      title: "Community Driven",
      description: "Connect with fellow travelers, share experiences, and discover hidden gems around the world."
    },
    {
      icon: FiHeart,
      title: "Personalized Feed",
      description: "Discover stories tailored to your interests and travel preferences with smart recommendations."
    }
  ];

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStoryIndex((prev) => (prev + 1) % featuredStories.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featuredStories.length]);

  const nextStory = () => {
    setCurrentStoryIndex((prev) => (prev + 1) % featuredStories.length);
  };

  const prevStory = () => {
    setCurrentStoryIndex((prev) => (prev - 1 + featuredStories.length) % featuredStories.length);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              to={currentUser ? "/dashboard" : "/"}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-2"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
                  <FiGlobe className="text-white text-lg" />
                </div>
                <span className="text-xl font-display font-bold gradient-text">
                  Wanderlust Stories
                </span>
              </motion.div>
            </Link>

            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link
                to="/login"
                className="btn-ghost"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="btn-primary"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-screen py-20">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium"
                >
                  <FiStar className="mr-2" />
                  AI-Powered Travel Stories
                </motion.div>
                
                <h1 className="text-5xl lg:text-7xl font-display font-bold text-neutral-900 dark:text-white leading-tight">
                  Share Your
                  <span className="gradient-text block">
                    Adventures
                  </span>
                </h1>
                
                <p className="text-xl text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-lg">
                  Transform your travel memories into captivating stories with AI assistance. 
                  Connect with fellow wanderers and inspire others to explore the world.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/signup"
                  className="btn-primary group inline-flex items-center justify-center"
                >
                  Start Your Journey
                  <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <button className="btn-outline group inline-flex items-center justify-center">
                  <FiPlay className="mr-2 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </button>
              </div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-3 gap-8 pt-8 border-t border-neutral-200 dark:border-neutral-700"
              >
                <div>
                  <div className="text-3xl font-bold text-neutral-900 dark:text-white">10K+</div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">Stories Shared</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-neutral-900 dark:text-white">5K+</div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">Travelers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-neutral-900 dark:text-white">150+</div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">Countries</div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Content - Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-strong">
                <img
                  src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=1000&fit=crop"
                  alt="Travel Adventure"
                  className="w-full h-[600px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                
                {/* Floating Cards */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 }}
                  className="absolute top-8 right-8 glass rounded-2xl p-4 max-w-xs"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face"
                      alt="User"
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <div className="text-sm font-medium text-white">Sarah Chen</div>
                      <div className="text-xs text-white/70">Just shared a story</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 }}
                  className="absolute bottom-8 left-8 glass rounded-2xl p-4"
                >
                  <div className="flex items-center space-x-2 text-white">
                    <FiHeart className="text-red-400" />
                    <span className="text-sm font-medium">234 likes</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Stories Carousel */}
      <section className="py-20 bg-neutral-50 dark:bg-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-display font-bold text-neutral-900 dark:text-white mb-4">
              Featured Stories
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
              Discover amazing travel experiences shared by our community
            </p>
          </motion.div>

          <div className="relative">
            <div className="overflow-hidden rounded-3xl">
              <motion.div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentStoryIndex * 100}%)` }}
              >
                {featuredStories.map((story, index) => (
                  <div key={story.id} className="w-full flex-shrink-0">
                    <div className="grid lg:grid-cols-2 gap-0 bg-white dark:bg-neutral-800 rounded-3xl overflow-hidden shadow-strong">
                      <div className="relative h-96 lg:h-auto">
                        <img
                          src={story.image}
                          alt={story.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-6 left-6 text-white">
                          <div className="flex items-center space-x-2 text-sm mb-2">
                            <FiMap className="text-primary-400" />
                            <span>{story.location}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-8 lg:p-12 flex flex-col justify-center">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-3xl font-display font-bold text-neutral-900 dark:text-white mb-4">
                              {story.title}
                            </h3>
                            <p className="text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed">
                              {story.excerpt}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full flex items-center justify-center text-white font-medium">
                                {story.author.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium text-neutral-900 dark:text-white">
                                  {story.author}
                                </div>
                                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                  Travel Storyteller
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 text-neutral-500 dark:text-neutral-400">
                              <FiHeart className="text-red-500" />
                              <span>{story.likes}</span>
                            </div>
                          </div>
                          
                          <button className="btn-primary w-full sm:w-auto">
                            Read Full Story
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Carousel Controls */}
            <button
              onClick={prevStory}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white dark:bg-neutral-800 rounded-full shadow-medium flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <FiChevronLeft className="text-xl" />
            </button>
            
            <button
              onClick={nextStory}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white dark:bg-neutral-800 rounded-full shadow-medium flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <FiChevronRight className="text-xl" />
            </button>

            {/* Carousel Indicators */}
            <div className="flex justify-center space-x-2 mt-8">
              {featuredStories.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStoryIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentStoryIndex
                      ? 'bg-primary-600'
                      : 'bg-neutral-300 dark:bg-neutral-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-display font-bold text-neutral-900 dark:text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
              Everything you need to create, share, and discover amazing travel stories
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card card-hover text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="text-2xl text-white" />
                </div>
                <h3 className="text-xl font-display font-semibold text-neutral-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-20 bg-neutral-50 dark:bg-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-display font-bold text-neutral-900 dark:text-white mb-4">
              Join Our Community
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
              Connect with passionate travelers from around the world
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {contributors.map((contributor, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card card-hover text-center"
              >
                <img
                  src={contributor.avatar}
                  alt={contributor.name}
                  className="w-16 h-16 rounded-full mx-auto mb-4 object-cover"
                />
                <h4 className="font-medium text-neutral-900 dark:text-white mb-1">
                  {contributor.name}
                </h4>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {contributor.stories} stories
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-neutral-900 dark:text-white">
              Ready to Share Your
              <span className="gradient-text block">
                Travel Stories?
              </span>
            </h2>
            
            <p className="text-xl text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
              Join thousands of travelers who are already sharing their adventures and inspiring others to explore the world.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="btn-primary group inline-flex items-center justify-center text-lg px-8 py-4"
              >
                Get Started Free
                <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <a
                href="https://github.com/your-repo/wanderlust-stories"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline group inline-flex items-center justify-center text-lg px-8 py-4"
              >
                <FiGithub className="mr-2" />
                View on GitHub
                <FiExternalLink className="ml-2 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 dark:bg-neutral-950 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
                  <FiGlobe className="text-white text-lg" />
                </div>
                <span className="text-xl font-display font-bold">
                  Wanderlust Stories
                </span>
              </div>
              <p className="text-neutral-400">
                Share your travel adventures and inspire others to explore the world.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-neutral-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-neutral-400">
                <li><a href="#" className="hover:text-white transition-colors">Stories</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contributors</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Guidelines</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-neutral-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-neutral-800 mt-12 pt-8 text-center text-neutral-400">
            <p>&copy; 2024 Wanderlust Stories. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;