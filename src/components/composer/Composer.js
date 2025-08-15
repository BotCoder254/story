import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import {
  FiX,
  FiImage,
  FiMapPin,
  FiTag,
  FiEye,
  FiEyeOff,
  FiUsers,
  FiLock,
  FiGlobe,
  FiCalendar,
  FiSave,
  FiSend,
  FiCamera,
  FiUpload,
  FiTrash2,
  FiRotateCcw,
  FiZap,
  FiLoader
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import storyService from '../../services/storyService';
import aiService from '../../services/aiService';
import toast from 'react-hot-toast';

const Composer = ({ isOpen, onClose, editStory = null }) => {
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(true);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [aiSuggestions, setAiSuggestions] = useState({});
  const [isLoadingAI, setIsLoadingAI] = useState({});
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  
  const fileInputRef = useRef();
  const cameraInputRef = useRef();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      title: editStory?.title || '',
      content: editStory?.content || '',
      privacy: editStory?.privacy || 'public',
      scheduledAt: null,
      mood: editStory?.mood || '',
      tripType: editStory?.tripType || ''
    }
  });

  const watchedContent = watch('content');
  const watchedTitle = watch('title');

  // Initialize form with edit data
  useEffect(() => {
    if (editStory) {
      reset({
        title: editStory.title,
        content: editStory.content,
        privacy: editStory.privacy || 'public',
        mood: editStory.mood || '',
        tripType: editStory.tripType || ''
      });
      setTags(editStory.tags || []);
      setSelectedLocation(editStory.location);
      setMediaFiles(editStory.media || []);
      setIsDraft(editStory.isDraft);
    }
  }, [editStory, reset]);

  // Auto-save draft
  useEffect(() => {
    if (!isOpen || !watchedContent) return;

    const timer = setTimeout(() => {
      saveDraft();
    }, 5000); // Auto-save every 5 seconds

    return () => clearTimeout(timer);
  }, [watchedContent, watchedTitle, tags, selectedLocation, isOpen]);

  const saveDraft = async () => {
    if (!currentUser || (!watchedTitle && !watchedContent)) return;

    try {
      const draftData = {
        title: watchedTitle,
        content: watchedContent,
        tags,
        location: selectedLocation,
        media: mediaFiles,
        isDraft: true,
        privacy: 'private'
      };

      if (editStory) {
        await storyService.updateStory(editStory.id, draftData, currentUser.uid);
      } else {
        await storyService.createStory(draftData, currentUser.uid);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  // AI Suggestions
  const generateTitleSuggestions = async () => {
    if (!watchedContent) {
      toast.error('Please write some content first');
      return;
    }

    setIsLoadingAI(prev => ({ ...prev, title: true }));
    try {
      const suggestions = await aiService.suggestTitle(watchedContent, selectedLocation?.name);
      setAiSuggestions(prev => ({ ...prev, titles: suggestions }));
      setShowAIPanel(true);
    } catch (error) {
      toast.error('Failed to generate title suggestions');
    } finally {
      setIsLoadingAI(prev => ({ ...prev, title: false }));
    }
  };

  const generateTags = async () => {
    if (!watchedContent) {
      toast.error('Please write some content first');
      return;
    }

    setIsLoadingAI(prev => ({ ...prev, tags: true }));
    try {
      const suggestedTags = await aiService.autoTag(watchedContent, selectedLocation?.name);
      setAiSuggestions(prev => ({ ...prev, tags: suggestedTags }));
      setShowAIPanel(true);
    } catch (error) {
      toast.error('Failed to generate tag suggestions');
    } finally {
      setIsLoadingAI(prev => ({ ...prev, tags: false }));
    }
  };

  const summarizeContent = async () => {
    if (!watchedContent) {
      toast.error('Please write some content first');
      return;
    }

    setIsLoadingAI(prev => ({ ...prev, summary: true }));
    try {
      const summary = await aiService.summarizeContent(watchedContent, 100);
      setAiSuggestions(prev => ({ ...prev, summary }));
      setShowAIPanel(true);
    } catch (error) {
      toast.error('Failed to generate summary');
    } finally {
      setIsLoadingAI(prev => ({ ...prev, summary: false }));
    }
  };

  const generateInstagramCaption = async () => {
    if (!watchedTitle || !watchedContent) {
      toast.error('Please add a title and content first');
      return;
    }

    setIsLoadingAI(prev => ({ ...prev, instagram: true }));
    try {
      const caption = await aiService.generateInstagramCaption(
        watchedTitle,
        watchedContent,
        selectedLocation?.name,
        tags
      );
      setAiSuggestions(prev => ({ ...prev, instagram: caption }));
      setShowAIPanel(true);
    } catch (error) {
      toast.error('Failed to generate Instagram caption');
    } finally {
      setIsLoadingAI(prev => ({ ...prev, instagram: false }));
    }
  };

  // Media handling
  const handleFileSelect = async (files, source = 'upload') => {
    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    for (const file of validFiles) {
      const fileId = Date.now() + Math.random();
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      try {
        // Create preview
        const preview = URL.createObjectURL(file);
        
        // Add to media files with preview
        setMediaFiles(prev => [...prev, {
          id: fileId,
          file,
          preview,
          uploading: true,
          source
        }]);

        // Upload to Firebase Storage
        const uploadedMedia = await storyService.uploadMedia(
          file,
          currentUser.uid,
          editStory?.id || 'temp'
        );

        // Update media file with upload result
        setMediaFiles(prev => prev.map(media => 
          media.id === fileId 
            ? { ...media, ...uploadedMedia, uploading: false }
            : media
        ));

        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });

      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
        setMediaFiles(prev => prev.filter(media => media.id !== fileId));
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
      }
    }
  };

  const removeMedia = (mediaId) => {
    setMediaFiles(prev => prev.filter(media => media.id !== mediaId));
  };

  // Tag handling
  const addTag = (tag) => {
    const cleanTag = tag.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanTag && !tags.includes(cleanTag) && tags.length < 10) {
      setTags(prev => [...prev, cleanTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  // Form submission
  const onSubmit = async (data) => {
    if (!currentUser) {
      toast.error('Please sign in to publish your story');
      return;
    }

    if (!data.title.trim()) {
      toast.error('Please add a title to your story');
      return;
    }

    if (!data.content.trim()) {
      toast.error('Please add content to your story');
      return;
    }

    setIsSubmitting(true);

    try {
      const storyData = {
        ...data,
        tags,
        location: selectedLocation,
        media: mediaFiles.filter(media => !media.uploading),
        isDraft,
        authorName: currentUser.displayName,
        authorAvatar: currentUser.photoURL
      };

      if (editStory) {
        await storyService.updateStory(editStory.id, storyData, currentUser.uid);
        toast.success(isDraft ? 'Draft saved' : 'Story updated');
      } else {
        await storyService.createStory(storyData, currentUser.uid);
        toast.success(isDraft ? 'Draft saved' : 'Story published');
      }

      onClose();
      reset();
      setTags([]);
      setMediaFiles([]);
      setSelectedLocation(null);
    } catch (error) {
      toast.error('Failed to save story');
    } finally {
      setIsSubmitting(false);
    }
  };

  const privacyOptions = [
    { value: 'public', label: 'Public', icon: FiGlobe, description: 'Anyone can see this story' },
    { value: 'followers', label: 'Followers', icon: FiUsers, description: 'Only your followers can see this' },
    { value: 'private', label: 'Private', icon: FiLock, description: 'Only you can see this story' }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-neutral-800 rounded-2xl shadow-strong overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-display font-bold text-neutral-900 dark:text-white">
                {editStory ? 'Edit Story' : 'Create New Story'}
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowAIPanel(!showAIPanel)}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    showAIPanel
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400'
                  }`}
                >
                  <FiZap className="text-sm" />
                  <span>AI Assistant</span>
                </button>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
            >
              <FiX className="text-xl" />
            </button>
          </div>

          <div className="flex h-[calc(90vh-80px)]">
            {/* Main Editor */}
            <div className="flex-1 flex flex-col">
              <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col">
                <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
                  {/* Title */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Title
                      </label>
                      <button
                        type="button"
                        onClick={generateTitleSuggestions}
                        disabled={isLoadingAI.title}
                        className="flex items-center space-x-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                      >
                        {isLoadingAI.title ? (
                          <FiLoader className="animate-spin" />
                        ) : (
                          <FiZap />
                        )}
                        <span>Suggest titles</span>
                      </button>
                    </div>
                    <input
                      {...register('title', { required: 'Title is required' })}
                      className="input-field"
                      placeholder="Give your story a compelling title..."
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Your Story
                    </label>
                    <textarea
                      {...register('content', { required: 'Content is required' })}
                      rows={12}
                      className="input-field resize-none"
                      placeholder="Share your travel adventure... What did you see? How did it make you feel? What would you tell a friend about this experience?"
                    />
                    {errors.content && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.content.message}
                      </p>
                    )}
                    <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                      {watchedContent?.length || 0} characters • ~{Math.ceil((watchedContent?.length || 0) / 200)} min read
                    </div>
                  </div>

                  {/* Media Upload */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Photos
                    </label>
                    <div className="space-y-4">
                      {/* Upload Buttons */}
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center space-x-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                        >
                          <FiUpload />
                          <span>Upload Photos</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="flex items-center space-x-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                        >
                          <FiCamera />
                          <span>Take Photo</span>
                        </button>
                      </div>

                      {/* Hidden File Inputs */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e.target.files, 'upload')}
                        className="hidden"
                      />
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handleFileSelect(e.target.files, 'camera')}
                        className="hidden"
                      />

                      {/* Media Preview */}
                      {mediaFiles.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {mediaFiles.map((media) => (
                            <div key={media.id} className="relative group">
                              <img
                                src={media.preview || media.url}
                                alt="Upload preview"
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              {media.uploading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                                  <div className="text-white text-sm">Uploading...</div>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => removeMedia(media.id)}
                                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <FiX className="text-sm" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Location
                    </label>
                    <div className="flex items-center space-x-2">
                      <FiMapPin className="text-neutral-400" />
                      <input
                        type="text"
                        value={selectedLocation?.name || ''}
                        onChange={(e) => setSelectedLocation({ name: e.target.value })}
                        className="input-field"
                        placeholder="Where was this photo taken?"
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Tags
                      </label>
                      <button
                        type="button"
                        onClick={generateTags}
                        disabled={isLoadingAI.tags}
                        className="flex items-center space-x-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                      >
                        {isLoadingAI.tags ? (
                          <FiLoader className="animate-spin" />
                        ) : (
                          <FiZap />
                        )}
                        <span>Auto-tag</span>
                      </button>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <FiTag className="text-neutral-400" />
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={handleTagInputKeyPress}
                        className="input-field"
                        placeholder="Add tags (press Enter or comma to add)"
                      />
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="flex items-center space-x-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm rounded-lg"
                          >
                            <span>#{tag}</span>
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="text-primary-500 hover:text-primary-700"
                            >
                              <FiX className="text-xs" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Privacy Settings */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                      Privacy
                    </label>
                    <Controller
                      name="privacy"
                      control={control}
                      render={({ field }) => (
                        <div className="space-y-2">
                          {privacyOptions.map((option) => {
                            const Icon = option.icon;
                            return (
                              <label
                                key={option.value}
                                className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                  field.value === option.value
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                    : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                                }`}
                              >
                                <input
                                  type="radio"
                                  {...field}
                                  value={option.value}
                                  checked={field.value === option.value}
                                  className="sr-only"
                                />
                                <Icon className={`text-lg ${
                                  field.value === option.value
                                    ? 'text-primary-600 dark:text-primary-400'
                                    : 'text-neutral-400'
                                }`} />
                                <div>
                                  <div className="font-medium text-neutral-900 dark:text-white">
                                    {option.label}
                                  </div>
                                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                    {option.description}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        type="button"
                        onClick={summarizeContent}
                        disabled={isLoadingAI.summary}
                        className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400"
                      >
                        {isLoadingAI.summary ? (
                          <FiLoader className="animate-spin" />
                        ) : (
                          <FiZap />
                        )}
                        <span>Summarize</span>
                      </button>
                      <button
                        type="button"
                        onClick={generateInstagramCaption}
                        disabled={isLoadingAI.instagram}
                        className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400"
                      >
                        {isLoadingAI.instagram ? (
                          <FiLoader className="animate-spin" />
                        ) : (
                          <FiZap />
                        )}
                        <span>Instagram Caption</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsDraft(true);
                          handleSubmit(onSubmit)();
                        }}
                        disabled={isSubmitting}
                        className="flex items-center space-x-2 px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
                      >
                        <FiSave />
                        <span>Save Draft</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsDraft(false);
                          handleSubmit(onSubmit)();
                        }}
                        disabled={isSubmitting}
                        className="btn-primary"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Publishing...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <FiSend />
                            <span>Publish Story</span>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* AI Assistant Panel */}
            <AnimatePresence>
              {showAIPanel && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 320, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="border-l border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 overflow-hidden"
                >
                  <div className="p-4 h-full overflow-y-auto custom-scrollbar">
                    <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
                      AI Suggestions
                    </h3>

                    <div className="space-y-6">
                      {/* Title Suggestions */}
                      {aiSuggestions.titles && (
                        <div>
                          <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Title Ideas
                          </h4>
                          <div className="space-y-2">
                            {aiSuggestions.titles.map((title, index) => (
                              <button
                                key={index}
                                onClick={() => setValue('title', title)}
                                className="w-full text-left p-2 text-sm bg-white dark:bg-neutral-800 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                              >
                                {title}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tag Suggestions */}
                      {aiSuggestions.tags && (
                        <div>
                          <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Suggested Tags
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {aiSuggestions.tags.map((tag, index) => (
                              <button
                                key={index}
                                onClick={() => addTag(tag)}
                                className="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Summary */}
                      {aiSuggestions.summary && (
                        <div>
                          <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Summary
                          </h4>
                          <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg text-sm">
                            {aiSuggestions.summary}
                          </div>
                          <button
                            onClick={() => setValue('content', aiSuggestions.summary)}
                            className="mt-2 text-xs text-primary-600 dark:text-primary-400 hover:underline"
                          >
                            Use as content
                          </button>
                        </div>
                      )}

                      {/* Instagram Caption */}
                      {aiSuggestions.instagram && (
                        <div>
                          <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Instagram Caption
                          </h4>
                          <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg text-sm whitespace-pre-line">
                            {aiSuggestions.instagram}
                          </div>
                          <button
                            onClick={() => navigator.clipboard.writeText(aiSuggestions.instagram)}
                            className="mt-2 text-xs text-primary-600 dark:text-primary-400 hover:underline"
                          >
                            Copy to clipboard
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Composer;