import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { FixedSizeList as List } from 'react-window';
import {
  FiMessageCircle,
  FiHeart,
  FiMoreHorizontal,
  FiEdit3,
  FiTrash2,
  FiSend,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiAlertCircle,
  FiRefreshCw,
  FiEye,
  FiEyeOff,
  FiCornerDownRight
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import socialService from '../../services/socialService';
import toast from 'react-hot-toast';

// Thread collapse threshold
const THREAD_COLLAPSE_THRESHOLD = 5;
const MAX_THREAD_DEPTH = 6;

const DeletedComment = ({ level = 0 }) => (
  <div className={`flex space-x-3 ${level > 0 ? `ml-${Math.min(level * 3, 12)}` : ''} opacity-60`}>
    <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
      <FiAlertCircle className="w-4 h-4 text-neutral-400" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-sm text-neutral-500 dark:text-neutral-400 italic py-2">
        This comment has been deleted
      </div>
    </div>
  </div>
);

const CommentThread = ({ 
  comments, 
  storyId, 
  onReply, 
  onEdit, 
  onDelete, 
  level = 0,
  parentId = null,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [showAll, setShowAll] = useState(false);
  
  if (!comments || comments.length === 0) return null;

  const shouldCollapse = comments.length > THREAD_COLLAPSE_THRESHOLD && !showAll;
  const visibleComments = shouldCollapse ? comments.slice(0, 3) : comments;
  const hiddenCount = comments.length - visibleComments.length;

  return (
    <div className="space-y-4">
      {visibleComments.map((comment, index) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          storyId={storyId}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
          level={level}
          isLast={index === visibleComments.length - 1}
        />
      ))}
      
      {hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className={`flex items-center space-x-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors ${level > 0 ? `ml-${Math.min(level * 3, 12)}` : ''}`}
        >
          <FiChevronDown />
          <span>Show {hiddenCount} more replies</span>
        </button>
      )}
      
      {showAll && hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(false)}
          className={`flex items-center space-x-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors ${level > 0 ? `ml-${Math.min(level * 3, 12)}` : ''}`}
        >
          <FiChevronUp />
          <span>Show less</span>
        </button>
      )}
    </div>
  );
};

const CommentItem = ({ 
  comment, 
  storyId, 
  onReply, 
  onEdit, 
  onDelete, 
  level = 0,
  isLast = false 
}) => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [showReplies, setShowReplies] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isLiked, setIsLiked] = useState(comment.isLiked || false);
  const [likesCount, setLikesCount] = useState(comment.likesCount || 0);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Fetch replies when expanded
  const { data: repliesData, isLoading: repliesLoading } = useQuery({
    queryKey: ['commentReplies', storyId, comment.id],
    queryFn: () => socialService.getCommentReplies(storyId, comment.id),
    enabled: showReplies && comment.repliesCount > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const handleLike = async () => {
    if (!currentUser) {
      toast.error('Please sign in to like comments');
      return;
    }

    try {
      // Optimistic update
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
      
      await socialService.toggleCommentLike(storyId, comment.id, currentUser.uid);
    } catch (error) {
      // Revert optimistic update
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
      toast.error('Failed to update like');
    }
  };

  const handleToggleReplies = () => {
    setShowReplies(!showReplies);
  };

  const canEdit = currentUser?.uid === comment.userId && !comment.isDeleted;
  const canDelete = currentUser?.uid === comment.userId && !comment.isDeleted;

  // If comment is deleted, show deleted placeholder
  if (comment.isDeleted) {
    return <DeletedComment level={level} />;
  }

  const maxDepth = level >= MAX_THREAD_DEPTH;
  const indentClass = level > 0 ? `ml-${Math.min(level * 3, 12)}` : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${indentClass}`}
    >
      <div className="flex space-x-3">
        {/* Thread line for nested comments */}
        {level > 0 && (
          <div className="absolute left-0 top-0 bottom-0 w-px bg-neutral-200 dark:bg-neutral-700 ml-4" />
        )}
        
        {/* Avatar */}
        <img
          src={comment.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.userName || 'User')}&background=0ea5e9&color=fff`}
          alt={comment.userName}
          className="w-8 h-8 rounded-full flex-shrink-0 relative z-10 bg-white dark:bg-neutral-800"
        />

        <div className="flex-1 min-w-0">
          {/* Comment Header */}
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-neutral-900 dark:text-white text-sm">
              {comment.userName || 'Anonymous'}
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {formatDate(comment.createdAt)}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-neutral-400 dark:text-neutral-500">
                (edited)
              </span>
            )}
            {level > 0 && (
              <FiCornerDownRight className="w-3 h-3 text-neutral-400" />
            )}
          </div>

          {/* Comment Content */}
          <div className="text-sm text-neutral-700 dark:text-neutral-300 mb-2 leading-relaxed">
            {isCollapsed ? (
              <div className="flex items-center space-x-2">
                <span className="text-neutral-500 dark:text-neutral-400 italic">
                  Comment collapsed
                </span>
                <button
                  onClick={() => setIsCollapsed(false)}
                  className="text-primary-600 dark:text-primary-400 hover:underline text-xs"
                >
                  Show
                </button>
              </div>
            ) : (
              <>
                {comment.content}
                {comment.content.length > 200 && (
                  <button
                    onClick={() => setIsCollapsed(true)}
                    className="ml-2 text-primary-600 dark:text-primary-400 hover:underline text-xs"
                  >
                    Collapse
                  </button>
                )}
              </>
            )}
          </div>

          {/* Comment Actions */}
          {!isCollapsed && (
            <div className="flex items-center space-x-4 text-xs">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-1 transition-colors ${
                  isLiked
                    ? 'text-red-500'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-red-500'
                }`}
              >
                <FiHeart className={isLiked ? 'fill-current' : ''} />
                <span>{likesCount}</span>
              </button>

              {!maxDepth && (
                <button
                  onClick={() => onReply(comment)}
                  className="flex items-center space-x-1 text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <FiCornerDownRight />
                  <span>Reply</span>
                </button>
              )}

              {comment.repliesCount > 0 && (
                <button
                  onClick={handleToggleReplies}
                  className="flex items-center space-x-1 text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {showReplies ? <FiEyeOff /> : <FiEye />}
                  <span>
                    {showReplies ? 'Hide' : 'Show'} {comment.repliesCount} replies
                  </span>
                </button>
              )}

              {(canEdit || canDelete) && (
                <div className="relative">
                  <button
                    onClick={() => setShowActions(!showActions)}
                    className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                  >
                    <FiMoreHorizontal />
                  </button>

                  <AnimatePresence>
                    {showActions && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 top-full mt-1 bg-white dark:bg-neutral-800 rounded-lg shadow-strong border border-neutral-200 dark:border-neutral-700 py-1 z-20"
                      >
                        {canEdit && !comment.isEdited && (
                          <button
                            onClick={() => {
                              onEdit(comment);
                              setShowActions(false);
                            }}
                            className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                          >
                            <FiEdit3 />
                            <span>Edit</span>
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => {
                              onDelete(comment);
                              setShowActions(false);
                            }}
                            className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <FiTrash2 />
                            <span>Delete</span>
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {/* Replies */}
          <AnimatePresence>
            {showReplies && comment.repliesCount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                {repliesLoading ? (
                  <div className="flex items-center space-x-2 text-sm text-neutral-500 dark:text-neutral-400">
                    <div className="w-4 h-4 border-2 border-neutral-300 border-t-transparent rounded-full animate-spin" />
                    <span>Loading replies...</span>
                  </div>
                ) : repliesData?.replies ? (
                  <CommentThread
                    comments={repliesData.replies}
                    storyId={storyId}
                    onReply={onReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    level={level + 1}
                    parentId={comment.id}
                  />
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

const CommentComposer = ({ 
  storyId, 
  parentComment = null, 
  onSubmit, 
  onCancel,
  placeholder = "Write a comment...",
  initialValue = ""
}) => {
  const { currentUser } = useAuth();
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) return;
    if (!currentUser) {
      toast.error('Please sign in to comment');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(content, parentComment?.id);
      setContent('');
    } catch (error) {
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center py-4 text-neutral-500 dark:text-neutral-400">
        <p>Please sign in to join the conversation</p>
      </div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="flex space-x-3"
    >
      <img
        src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || 'User')}&background=0ea5e9&color=fff`}
        alt="Your avatar"
        className="w-8 h-8 rounded-full flex-shrink-0"
      />
      
      <div className="flex-1">
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
          
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              {content.length}/500
            </div>
            
            <div className="flex items-center space-x-2">
              {parentComment && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-3 py-1 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                >
                  Cancel
                </button>
              )}
              
              <button
                type="submit"
                disabled={!content.trim() || isSubmitting || content.length > 500}
                className="flex items-center space-x-1 px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiSend />
                )}
                <span>{parentComment ? 'Reply' : 'Comment'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.form>
  );
};

const VirtualizedCommentList = ({ comments, storyId, onReply, onEdit, onDelete }) => {
  const itemHeight = 120; // Approximate height per comment
  const maxHeight = Math.min(comments.length * itemHeight, 600); // Max 600px height

  const Row = ({ index, style }) => {
    const comment = comments[index];
    return (
      <div style={style}>
        <CommentItem
          comment={comment}
          storyId={storyId}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
          isLast={index === comments.length - 1}
        />
      </div>
    );
  };

  if (comments.length < 10) {
    // Don't virtualize for small lists
    return (
      <div className="space-y-6">
        {comments.map((comment, index) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            storyId={storyId}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            isLast={index === comments.length - 1}
          />
        ))}
      </div>
    );
  }

  return (
    <List
      height={maxHeight}
      itemCount={comments.length}
      itemSize={itemHeight}
      className="scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-600"
    >
      {Row}
    </List>
  );
};

const Comments = ({ storyId, className = '', initialCount = 0 }) => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, popular
  const [showVirtualized, setShowVirtualized] = useState(false);

  // Infinite query for comments with pagination
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch
  } = useInfiniteQuery({
    queryKey: ['comments', storyId, sortBy],
    queryFn: ({ pageParam = null }) => 
      socialService.getComments(storyId, 20, pageParam, sortBy),
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes
    // Disabled refetchInterval to prevent Firestore errors
    // refetchInterval: 30000, // Real-time updates every 30 seconds
  });

  // Disable real-time listener temporarily to fix Firestore errors
  // Real-time updates will be handled through manual refresh
  useEffect(() => {
    // Disabled to prevent Firestore internal errors
    // TODO: Re-enable after fixing Firestore listener issues
  }, [storyId, sortBy, queryClient]);

  // Flatten all comments from pages
  const allComments = useMemo(() => {
    return data?.pages?.flatMap(page => page.comments) || [];
  }, [data]);

  const totalComments = data?.pages?.[0]?.total || initialCount;

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: ({ content, parentCommentId }) => 
      socialService.addComment(storyId, currentUser.uid, content, parentCommentId),
    onSuccess: (newComment) => {
      // Optimistically add comment
      queryClient.setQueryData(['comments', storyId, sortBy], (oldData) => {
        if (!oldData) return oldData;
        
        const firstPage = oldData.pages[0];
        if (!firstPage) return oldData;

        const updatedFirstPage = {
          ...firstPage,
          comments: [newComment, ...firstPage.comments],
          total: firstPage.total + 1
        };

        return {
          ...oldData,
          pages: [updatedFirstPage, ...oldData.pages.slice(1)]
        };
      });
      
      setReplyingTo(null);
      toast.success('Comment posted!');
    },
    onError: (error) => {
      toast.error('Failed to post comment');
    }
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, content }) => 
      socialService.updateComment(storyId, commentId, content, currentUser.uid),
    onSuccess: (updatedComment) => {
      // Update comment in cache
      queryClient.setQueryData(['comments', storyId, sortBy], (oldData) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            comments: page.comments.map(comment => 
              comment.id === updatedComment.id ? updatedComment : comment
            )
          }))
        };
      });
      
      setEditingComment(null);
      toast.success('Comment updated!');
    },
    onError: (error) => {
      toast.error('Failed to update comment');
    }
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => 
      socialService.deleteComment(storyId, commentId, currentUser.uid),
    onSuccess: (deletedCommentId) => {
      // Mark comment as deleted in cache
      queryClient.setQueryData(['comments', storyId, sortBy], (oldData) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            comments: page.comments.map(comment => 
              comment.id === deletedCommentId 
                ? { ...comment, isDeleted: true, content: '[deleted]' }
                : comment
            ),
            total: page.total - 1
          }))
        };
      });
      
      toast.success('Comment deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete comment');
    }
  });

  const handleAddComment = async (content, parentCommentId = null) => {
    await addCommentMutation.mutateAsync({ content, parentCommentId });
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setReplyingTo(null);
  };

  const handleUpdateComment = async (content) => {
    if (editingComment) {
      await updateCommentMutation.mutateAsync({
        commentId: editingComment.id,
        content
      });
    }
  };

  const handleDeleteComment = async (comment) => {
    if (window.confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      await deleteCommentMutation.mutateAsync(comment.id);
    }
  };

  const handleReply = (comment) => {
    setReplyingTo(comment);
    setEditingComment(null);
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Comments Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FiMessageCircle className="text-neutral-600 dark:text-neutral-400" />
          <h3 className="font-semibold text-neutral-900 dark:text-white">
            Comments ({totalComments})
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Sort Options */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg px-2 py-1 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="popular">Most Popular</option>
          </select>
          
          {/* Virtualization Toggle */}
          {allComments.length > 10 && (
            <button
              onClick={() => setShowVirtualized(!showVirtualized)}
              className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
              title={showVirtualized ? 'Disable virtualization' : 'Enable virtualization'}
            >
              {showVirtualized ? <FiEyeOff /> : <FiEye />}
            </button>
          )}
          
          {/* Refresh */}
          <button
            onClick={() => refetch()}
            className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
            title="Refresh comments"
          >
            <FiRefreshCw />
          </button>
        </div>
      </div>

      {/* Comment Composer */}
      {editingComment ? (
        <CommentComposer
          storyId={storyId}
          onSubmit={handleUpdateComment}
          onCancel={() => setEditingComment(null)}
          placeholder="Edit your comment..."
          initialValue={editingComment.content}
        />
      ) : (
        <CommentComposer
          storyId={storyId}
          onSubmit={handleAddComment}
          placeholder="Share your thoughts about this story..."
        />
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse flex space-x-3">
                <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4"></div>
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
            <FiAlertCircle className="text-4xl mx-auto mb-2" />
            <p>Failed to load comments</p>
            <p className="text-sm mb-4">
              {error?.message?.includes('FIRESTORE') 
                ? 'Database connection issue. Please try again.' 
                : 'Something went wrong loading comments.'
              }
            </p>
            <button
              onClick={() => {
                console.log('Retrying comments fetch...');
                refetch();
              }}
              className="flex items-center space-x-2 mx-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <FiRefreshCw />
              <span>Try again</span>
            </button>
          </div>
        )}

        {allComments.length === 0 && !isLoading && (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
            <FiMessageCircle className="text-4xl mx-auto mb-2 opacity-50" />
            <p>No comments yet</p>
            <p className="text-sm">Be the first to share your thoughts!</p>
          </div>
        )}

        {allComments.length > 0 && (
          <>
            {showVirtualized ? (
              <VirtualizedCommentList
                comments={allComments}
                storyId={storyId}
                onReply={handleReply}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
              />
            ) : (
              <div className="space-y-6 relative">
                {allComments.map((comment, index) => (
                  <div key={comment.id}>
                    <CommentItem
                      comment={comment}
                      storyId={storyId}
                      onReply={handleReply}
                      onEdit={handleEditComment}
                      onDelete={handleDeleteComment}
                      isLast={index === allComments.length - 1}
                    />

                    {/* Reply Composer */}
                    {replyingTo?.id === comment.id && (
                      <div className="mt-4 ml-11">
                        <CommentComposer
                          storyId={storyId}
                          parentComment={replyingTo}
                          onSubmit={handleAddComment}
                          onCancel={() => setReplyingTo(null)}
                          placeholder={`Reply to ${replyingTo.userName}...`}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Load More Comments */}
      {hasNextPage && (
        <div className="text-center">
          <button
            onClick={handleLoadMore}
            disabled={isFetchingNextPage}
            className="btn-ghost flex items-center space-x-2"
          >
            {isFetchingNextPage ? (
              <>
                <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <FiChevronDown />
                <span>Load More Comments</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default Comments;