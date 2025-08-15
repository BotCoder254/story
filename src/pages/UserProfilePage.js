import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    FiArrowLeft,
    FiMapPin,
    FiCalendar,
    FiBookmark,
    FiUsers,
    FiUserPlus,
    FiUserMinus,
    FiEdit3,
    FiCamera,
    FiGlobe,
    FiInstagram,
    FiTwitter,
    FiTrendingUp,
    FiCompass,
    FiActivity,
    FiMap,
    FiHash,
    FiLogOut,
    FiRefreshCw
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import StoryCard from '../components/feed/StoryCard';
import StoryCardSkeleton from '../components/feed/StoryCardSkeleton';
import TravelMap from '../components/map/TravelMap';
import ThemeToggle from '../components/common/ThemeToggle';
import storyService from '../services/storyService';
import socialService from '../services/socialService';
import searchService from '../services/searchService';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const UserProfilePage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();
    const queryClient = useQueryClient();
    const [activeLeftTab, setActiveLeftTab] = useState('stories');
    const [activeRightTab, setActiveRightTab] = useState('map');
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        displayName: '',
        bio: '',
        location: '',
        website: '',
        instagram: '',
        twitter: ''
    });

    const isOwnProfile = currentUser?.uid === userId;

    // Fetch user profile
    const { data: userProfile, isLoading: profileLoading } = useQuery({
        queryKey: ['userProfile', userId],
        queryFn: () => socialService.getUserProfile(userId),
        enabled: !!userId,
    });

    // Fetch user stories
    const { data: userStories = [], isLoading: storiesLoading } = useQuery({
        queryKey: ['userStories', userId],
        queryFn: () => storyService.getUserStories(userId, false),
        enabled: !!userId,
    });

    // Fetch follow status
    const { data: followStatus } = useQuery({
        queryKey: ['followStatus', userId, currentUser?.uid],
        queryFn: () => socialService.checkFollowStatus(currentUser?.uid, userId),
        enabled: !!currentUser && !!userId && !isOwnProfile,
    });

    // Fetch followers and following
    const { data: followers = [] } = useQuery({
        queryKey: ['followers', userId],
        queryFn: () => socialService.getFollowers(userId),
        enabled: !!userId,
    });

    const { data: following = [] } = useQuery({
        queryKey: ['following', userId],
        queryFn: () => socialService.getFollowing(userId),
        enabled: !!userId,
    });

    // Fetch trending tags for sidebar
    const { data: trendingTags = [] } = useQuery({
        queryKey: ['trendingTags'],
        queryFn: () => searchService.getPopularTags(10),
        staleTime: 1000 * 60 * 10, // 10 minutes
    });

    // Follow/Unfollow mutation
    const followMutation = useMutation({
        mutationFn: ({ targetUserId, action }) =>
            action === 'follow'
                ? socialService.followUser(currentUser.uid, targetUserId)
                : socialService.unfollowUser(currentUser.uid, targetUserId),
        onSuccess: () => {
            queryClient.invalidateQueries(['followStatus', userId, currentUser?.uid]);
            queryClient.invalidateQueries(['followers', userId]);
            toast.success(followStatus?.isFollowing ? 'Unfollowed successfully' : 'Following successfully');
        },
        onError: () => {
            toast.error('Failed to update follow status');
        }
    });

    // Update profile mutation
    const updateProfileMutation = useMutation({
        mutationFn: (profileData) => socialService.updateUserProfile(currentUser.uid, profileData),
        onSuccess: () => {
            queryClient.invalidateQueries(['userProfile', userId]);
            setIsEditing(false);
            toast.success('Profile updated successfully');
        },
        onError: () => {
            toast.error('Failed to update profile');
        }
    });

    // Initialize edit form when profile loads
    useEffect(() => {
        if (userProfile && isOwnProfile) {
            setEditForm({
                displayName: userProfile.displayName || '',
                bio: userProfile.bio || '',
                location: userProfile.location || '',
                website: userProfile.website || '',
                instagram: userProfile.social?.instagram || '',
                twitter: userProfile.social?.twitter || ''
            });
        }
    }, [userProfile, isOwnProfile]);

    const handleFollow = () => {
        if (!currentUser) {
            toast.error('Please sign in to follow users');
            return;
        }

        followMutation.mutate({
            targetUserId: userId,
            action: followStatus?.isFollowing ? 'unfollow' : 'follow'
        });
    };

    const handleUpdateProfile = (e) => {
        e.preventDefault();
        updateProfileMutation.mutate(editForm);
    };

    const formatJoinDate = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return `Joined ${formatDistanceToNow(date, { addSuffix: true })}`;
    };

    const calculateStats = () => {
        const totalLikes = userStories.reduce((sum, story) => sum + (story.stats?.likeCount || 0), 0);
        const totalViews = userStories.reduce((sum, story) => sum + (story.stats?.viewsCount || 0), 0);
        const uniqueLocations = new Set(
            userStories
                .map(story => story.location?.name)
                .filter(Boolean)
        ).size;

        return {
            stories: userStories.length,
            likes: totalLikes,
            views: totalViews,
            locations: uniqueLocations,
            followers: followers.length,
            following: following.length
        };
    };

    const stats = calculateStats();

    if (profileLoading) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded mb-6 w-32"></div>
                        <div className="h-32 bg-neutral-200 dark:bg-neutral-700 rounded mb-6"></div>
                        <div className="space-y-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-24 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!userProfile) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                        User Not Found
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                        The user you're looking for doesn't exist.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="btn-primary"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const leftNavItems = [
        { id: 'stories', label: 'Stories', icon: FiCompass, count: stats.stories },
        { id: 'followers', label: 'Followers', icon: FiUsers, count: stats.followers },
        { id: 'following', label: 'Following', icon: FiUserPlus, count: stats.following },
        { id: 'map', label: 'Travel Map', icon: FiMap, count: stats.locations }
    ];

    const rightNavItems = [
        { id: 'map', label: 'Details', icon: FiMapPin },
        { id: 'trending', label: 'Trending', icon: FiTrendingUp },
        { id: 'activity', label: 'Activity', icon: FiActivity }
    ];

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
                            >
                                <FiArrowLeft className="text-xl" />
                            </button>
                            <Link
                                to="/dashboard"
                                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                            >
                                <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
                                    <FiGlobe className="text-white text-lg" />
                                </div>
                                <span className="text-xl font-display font-bold gradient-text">
                                    Wanderlust Stories
                                </span>
                            </Link>
                        </div>

                        <div className="flex items-center space-x-4">
                            <ThemeToggle />
                            <div className="flex items-center space-x-3">
                                <img
                                    src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.displayName || 'User')}&background=0ea5e9&color=fff`}
                                    alt="Profile"
                                    className="w-8 h-8 rounded-full"
                                />
                                <span className="hidden sm:inline text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    {currentUser?.displayName || 'User'}
                                </span>
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            >
                                <FiLogOut />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-12 gap-6 py-6">
                    {/* Left Sidebar - Profile Info & Navigation */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Profile Card */}
                        <div className="card">
                            <div className="text-center mb-6">
                                <div className="relative inline-block">
                                    <img
                                        src={userProfile.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.displayName || 'User')}&background=0ea5e9&color=fff&size=128`}
                                        alt={userProfile.displayName}
                                        className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
                                    />
                                    {isOwnProfile && (
                                        <button className="absolute bottom-3 right-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors">
                                            <FiCamera className="text-sm" />
                                        </button>
                                    )}
                                </div>
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                                    {userProfile.displayName || 'Anonymous User'}
                                </h3>
                                {userProfile.bio && (
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                                        {userProfile.bio}
                                    </p>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg"
                                >
                                    <FiBookmark className="text-xl text-primary-600 mx-auto mb-1" />
                                    <div className="text-lg font-bold text-neutral-900 dark:text-white">
                                        {stats.stories}
                                    </div>
                                    <div className="text-xs text-neutral-600 dark:text-neutral-400">
                                        Stories
                                    </div>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-center p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg"
                                >
                                    <FiUsers className="text-xl text-secondary-600 mx-auto mb-1" />
                                    <div className="text-lg font-bold text-neutral-900 dark:text-white">
                                        {stats.followers}
                                    </div>
                                    <div className="text-xs text-neutral-600 dark:text-neutral-400">
                                        Followers
                                    </div>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-center p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg"
                                >
                                    <FiUserPlus className="text-xl text-accent-600 mx-auto mb-1" />
                                    <div className="text-lg font-bold text-neutral-900 dark:text-white">
                                        {stats.following}
                                    </div>
                                    <div className="text-xs text-neutral-600 dark:text-neutral-400">
                                        Following
                                    </div>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-center p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg"
                                >
                                    <FiMap className="text-xl text-green-600 mx-auto mb-1" />
                                    <div className="text-lg font-bold text-neutral-900 dark:text-white">
                                        {stats.locations}
                                    </div>
                                    <div className="text-xs text-neutral-600 dark:text-neutral-400">
                                        Places
                                    </div>
                                </motion.div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mb-6">
                                {isOwnProfile ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                    >
                                        <FiEdit3 />
                                        <span>Edit Profile</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleFollow}
                                        disabled={followMutation.isLoading}
                                        className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${followStatus?.isFollowing
                                            ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400'
                                            : 'bg-primary-600 text-white hover:bg-primary-700'
                                            }`}
                                    >
                                        {followStatus?.isFollowing ? <FiUserMinus /> : <FiUserPlus />}
                                        <span>
                                            {followMutation.isLoading
                                                ? 'Loading...'
                                                : followStatus?.isFollowing
                                                    ? 'Unfollow'
                                                    : 'Follow'
                                            }
                                        </span>
                                    </button>
                                )}
                            </div>

                            {/* Navigation */}
                            <nav className="space-y-2">
                                {leftNavItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveLeftTab(item.id)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${activeLeftTab === item.id
                                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <item.icon className="text-lg" />
                                            <span className="font-medium">{item.label}</span>
                                        </div>
                                        <span className="text-xs bg-neutral-200 dark:bg-neutral-600 px-2 py-1 rounded-full">
                                            {item.count}
                                        </span>
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Center Content */}
                    <div className="lg:col-span-6">
                        {/* Edit Profile Modal */}
                        {isEditing && (
                            <div className="card mb-6">
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                                    Edit Profile
                                </h3>
                                <form onSubmit={handleUpdateProfile} className="space-y-4">
                                    <input
                                        type="text"
                                        value={editForm.displayName}
                                        onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                                        className="input-field"
                                        placeholder="Display Name"
                                    />
                                    <textarea
                                        value={editForm.bio}
                                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                        className="input-field"
                                        rows={3}
                                        placeholder="Bio"
                                    />
                                    <input
                                        type="text"
                                        value={editForm.location}
                                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                        className="input-field"
                                        placeholder="Location"
                                    />
                                    <input
                                        type="url"
                                        value={editForm.website}
                                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                                        className="input-field"
                                        placeholder="Website"
                                    />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            value={editForm.instagram}
                                            onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                                            className="input-field"
                                            placeholder="Instagram username"
                                        />
                                        <input
                                            type="text"
                                            value={editForm.twitter}
                                            onChange={(e) => setEditForm({ ...editForm, twitter: e.target.value })}
                                            className="input-field"
                                            placeholder="Twitter username"
                                        />
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                                        <button type="submit" className="btn-primary flex-1 sm:flex-none">
                                            Save Changes
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className="btn-outline flex-1 sm:flex-none"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Main Content */}
                        <div className="space-y-6">
                            {/* Tab Content Based on Active Left Tab */}
                            {activeLeftTab === 'stories' && (
                                <div>
                                    {storiesLoading ? (
                                        <div className="space-y-6">
                                            {Array.from({ length: 3 }).map((_, index) => (
                                                <StoryCardSkeleton key={index} />
                                            ))}
                                        </div>
                                    ) : userStories.length > 0 ? (
                                        <div className="space-y-6">
                                            {userStories.map((story) => (
                                                <StoryCard key={story.id} story={story} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <FiBookmark className="text-4xl text-neutral-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                                                No Stories Yet
                                            </h3>
                                            <p className="text-neutral-600 dark:text-neutral-400">
                                                {isOwnProfile
                                                    ? "You haven't shared any travel stories yet."
                                                    : "This user hasn't shared any stories yet."
                                                }
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeLeftTab === 'map' && (
                                <div className="card">
                                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                                        Travel Map
                                    </h3>
                                    <TravelMap
                                        stories={userStories.filter(story => story.location)}
                                        height="400px"
                                        showControls={true}
                                        interactive={true}
                                    />
                                </div>
                            )}

                            {activeLeftTab === 'followers' && (
                                <div className="grid gap-4">
                                    {followers.length > 0 ? (
                                        followers.map((follower) => (
                                            <div key={follower.id} className="card">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <img
                                                            src={follower.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(follower.displayName || 'User')}&background=0ea5e9&color=fff&size=48`}
                                                            alt={follower.displayName}
                                                            className="w-12 h-12 rounded-full object-cover cursor-pointer"
                                                            onClick={() => navigate(`/profile/${follower.id}`)}
                                                        />
                                                        <div>
                                                            <h4 className="font-medium text-neutral-900 dark:text-white cursor-pointer hover:text-primary-600 dark:hover:text-primary-400"
                                                                onClick={() => navigate(`/profile/${follower.id}`)}>
                                                                {follower.displayName || 'Anonymous User'}
                                                            </h4>
                                                            {follower.bio && (
                                                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                                                    {follower.bio.substring(0, 60)}...
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {currentUser && follower.id !== currentUser.uid && (
                                                        <button className="btn-outline text-sm">
                                                            Follow
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12">
                                            <FiUsers className="text-4xl text-neutral-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                                                No Followers Yet
                                            </h3>
                                            <p className="text-neutral-600 dark:text-neutral-400">
                                                {isOwnProfile
                                                    ? "You don't have any followers yet."
                                                    : "This user doesn't have any followers yet."
                                                }
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeLeftTab === 'following' && (
                                <div className="grid gap-4">
                                    {following.length > 0 ? (
                                        following.map((followedUser) => (
                                            <div key={followedUser.id} className="card">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <img
                                                            src={followedUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(followedUser.displayName || 'User')}&background=0ea5e9&color=fff&size=48`}
                                                            alt={followedUser.displayName}
                                                            className="w-12 h-12 rounded-full object-cover cursor-pointer"
                                                            onClick={() => navigate(`/profile/${followedUser.id}`)}
                                                        />
                                                        <div>
                                                            <h4 className="font-medium text-neutral-900 dark:text-white cursor-pointer hover:text-primary-600 dark:hover:text-primary-400"
                                                                onClick={() => navigate(`/profile/${followedUser.id}`)}>
                                                                {followedUser.displayName || 'Anonymous User'}
                                                            </h4>
                                                            {followedUser.bio && (
                                                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                                                    {followedUser.bio.substring(0, 60)}...
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {isOwnProfile && (
                                                        <button className="btn-outline text-sm">
                                                            Unfollow
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12">
                                            <FiUsers className="text-4xl text-neutral-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                                                Not Following Anyone
                                            </h3>
                                            <p className="text-neutral-600 dark:text-neutral-400">
                                                {isOwnProfile
                                                    ? "You're not following anyone yet."
                                                    : "This user isn't following anyone yet."
                                                }
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Right Navigation */}
                        <div className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
                            {rightNavItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveRightTab(item.id)}
                                        className={`flex items-center justify-center lg:justify-start space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1 lg:flex-none ${activeRightTab === item.id
                                            ? 'bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                                            }`}
                                    >
                                        <Icon className="text-lg" />
                                        <span className="hidden lg:inline">{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Right Content */}
                        {activeRightTab === 'map' && (
                            <div className="card">
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                                    Profile Details
                                </h3>
                                <div className="space-y-3">
                                    {userProfile.location && (
                                        <div className="flex items-center space-x-2">
                                            <FiMapPin className="text-neutral-500" />
                                            <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                                {userProfile.location}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center space-x-2">
                                        <FiCalendar className="text-neutral-500" />
                                        <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                            {formatJoinDate(userProfile.createdAt)}
                                        </span>
                                    </div>
                                    {userProfile.website && (
                                        <div className="flex items-center space-x-2">
                                            <FiGlobe className="text-neutral-500" />
                                            <a
                                                href={userProfile.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                                            >
                                                Website
                                            </a>
                                        </div>
                                    )}
                                    {/* Social Links */}
                                    {(userProfile.social?.instagram || userProfile.social?.twitter) && (
                                        <div className="flex items-center space-x-4 pt-2">
                                            {userProfile.social?.instagram && (
                                                <a
                                                    href={`https://instagram.com/${userProfile.social.instagram}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-neutral-600 dark:text-neutral-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                                                >
                                                    <FiInstagram />
                                                </a>
                                            )}
                                            {userProfile.social?.twitter && (
                                                <a
                                                    href={`https://twitter.com/${userProfile.social.twitter}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                >
                                                    <FiTwitter />
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeRightTab === 'trending' && (
                            <div className="card">
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                                    Trending Tags
                                </h3>
                                <div className="space-y-3">
                                    {trendingTags.map((tag, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="flex items-center justify-between p-2 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <FiHash className="text-primary-600 dark:text-primary-400" />
                                                <span className="font-medium text-neutral-900 dark:text-white">
                                                    {tag}
                                                </span>
                                            </div>
                                            <span className="text-sm text-neutral-500 dark:text-neutral-400">
                                                #{index + 1}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeRightTab === 'activity' && (
                            <div className="card">
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                                    Recent Activity
                                </h3>
                                <div className="space-y-4">
                                    <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                                        <FiActivity className="text-3xl mx-auto mb-2" />
                                        <p className="text-sm">Activity feed coming soon!</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Navigation for Mobile */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 z-20">
                    <div className="grid grid-cols-4 gap-1 p-2">
                        {leftNavItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveLeftTab(item.id)}
                                className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${activeLeftTab === item.id
                                    ? 'text-primary-600 dark:text-primary-400'
                                    : 'text-neutral-600 dark:text-neutral-400'
                                    }`}
                            >
                                <item.icon className="text-lg" />
                                <span className="text-xs font-medium">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfilePage;