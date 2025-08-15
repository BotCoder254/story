import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  FiMessageCircle,
  FiHeart,
  FiReply,
  FiMoreHorizontal,
  FiEdit3,
  FiTrash2,
  FiSend,
  FiX,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import socialService from '../../services/socialService';
import toast from 'react-hot-toast';

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
  const [showReplies, setShowReplies] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(comment.likesCount || 0);

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
      
      // TODO: Implement comment likes in socialService
      // await socialService.toggleCommentLike(storyId, comment.id, currentUser.uid);
    } catch (error) {
      // Revert optimistic update
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
      toast.error('Failed to update like');
    }
  };

  const canEdit = currentUser?.uid === comment.userId;
  const canDelete = currentUser?.uid === comment.userId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex space-x-3 ${level > 0 ? 'ml-12' : ''}`}
    >
      {/* Avatar */}
      <img
        src={comment.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.userName || 'User')}&background=0ea5e9&color=fff`}
        alt={comment.userName}
        className="w-8 h-8 rounded-full flex-shrink-0"
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
        </div>

        {/* Comment Content */}
        <div className="text-sm text-neutral-700 dark:text-neutral-300 mb-2 leading-relaxed">
          {comment.content}
        </div>

        {/* Comment Actions */}
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

          <button
            onClick={() => onReply(comment)}
            className="flex items-center space-x-1 text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <FiReply />
            <span>Reply</span>
          </button>

          {comment.repliesCount > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center space-x-1 text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {showReplies ? <FiChevronUp /> : <FiChevronDown />}
              <span>{comment.repliesCount} replies</span>
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
                    className="absolute right-0 top-full mt-1 bg-white dark:bg-neutral-800 rounded-lg shadow-strong border border-neutral-200 dark:border-neutral-700 py-1 z-10"
                  >
                    {canEdit && (
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

        {/* Replies */}
        <AnimatePresence>
          {showReplies && comment.repliesCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-4"
            >
              {/* TODO: Load and display replies */}
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Replies loading...
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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

const Comments = ({ storyId, className = '' }) => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);

  // Fetch comments
  const {
    data: commentsData,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['comments', storyId],
    queryFn: () => socialService.getComments(storyId, 20),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: ({ content, parentCommentId }) => 
      socialService.addComment(storyId, currentUser.uid, content, parentCommentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', storyId]);
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
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', storyId]);
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
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', storyId]);
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
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await deleteCommentMutation.mutateAsync(comment.id);
    }
  };

  const handleReply = (comment) => {
    setReplyingTo(comment);
    setEditingComment(null);
  };

  const comments = commentsData?.comments || [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Comments Header */}
      <div className="flex items-center space-x-2">
        <FiMessageCircle className="text-neutral-600 dark:text-neutral-400" />
        <h3 className="font-semibold text-neutral-900 dark:text-white">
          Comments ({comments.length})
        </h3>
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
            <p>Failed to load comments</p>
            <button
              onClick={() => queryClient.invalidateQueries(['comments', storyId])}
              className="mt-2 text-primary-600 dark:text-primary-400 hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {comments.length === 0 && !isLoading && (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
            <FiMessageCircle className="text-4xl mx-auto mb-2 opacity-50" />
            <p>No comments yet</p>
            <p className="text-sm">Be the first to share your thoughts!</p>
          </div>
        )}

        {comments.map((comment, index) => (
          <div key={comment.id}>
            <CommentItem
              comment={comment}
              storyId={storyId}
              onReply={handleReply}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
              isLast={index === comments.length - 1}
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

      {/* Load More Comments */}
      {commentsData?.hasMore && (
        <div className="text-center">
          <button className="btn-ghost">
            Load More Comments
          </button>
        </div>
      )}
    </div>
  );
};

export default Comments;