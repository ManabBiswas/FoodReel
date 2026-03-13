import { useState, useEffect, useRef } from 'react'
import { X, Send, Heart, Reply, MessageCircle, User } from 'lucide-react'
import { toast } from 'react-toastify'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../config/Api'
import { useAuth } from '../hooks/useAuth'

const CommentModal = ({ isOpen, post, onClose, onCommentAdded }) => {
  const { user, isAuthenticated } = useAuth()
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [likedComments, setLikedComments] = useState({})
  // replyingTo stores { id, username } so the banner can show who you're replying to
  const [replyingTo, setReplyingTo] = useState(null)
  const modalRef = useRef(null)

  useEffect(() => {
    if (isOpen && post?._id) {
      fetchComments()
      fetchCommentLikes()
    }
  }, [isOpen, post?._id])

  // ── Fetch comments ──────────────────────────────────────────────────────────
  const fetchComments = async () => {
    try {
      setLoading(true)
      // FIX: use API_ENDPOINTS.comments.byPost — was `${API_ENDPOINTS}/api/comments/post/...`
      // FIX: merge axiosConfig properly — was axios.get(url, axiosConfig, {...}) (3-arg, 3rd ignored)
      const response = await axios.get(
        API_ENDPOINTS.comments.byPost(post._id),
        axiosConfig
      )
      setComments(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setLoading(false)
    }
  }

  // ── Fetch which comments the current user has liked ─────────────────────────
  const fetchCommentLikes = async () => {
    if (!isAuthenticated) return
    try {
      // FIX: was /api/comment-likes/my-likes/:id — route lives at /api/comments/my-likes/:id
      const response = await axios.get(
        API_ENDPOINTS.comments.myLikes(post._id),
        axiosConfig
      )
      const likes = {}
      response.data.data?.forEach(like => {
        likes[like.commentId] = true
      })
      setLikedComments(likes)
    } catch (error) {
      console.error('Failed to fetch comment likes:', error)
    }
  }

  // ── Submit new comment / reply ───────────────────────────────────────────────
  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) {
      toast.warning('Comment cannot be empty')
      return
    }
    if (!isAuthenticated) {
      toast.warning('Please login to comment')
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        postId: post._id,
        text: newComment.trim(),
        parentCommentId: replyingTo?.id || null
      }

      // FIX: was `${API_ENDPOINTS}/api/comments/create`
      const response = await axios.post(
        API_ENDPOINTS.comments.create,
        payload,
        axiosConfig
      )

      const createdComment = response.data.data
      setComments(prev => [createdComment, ...prev])
      setNewComment('')
      setReplyingTo(null)
      toast.success('Comment posted!')
      onCommentAdded?.(post._id)
    } catch (error) {
      console.error('Failed to submit comment:', error)
      toast.error(error.response?.data?.message || 'Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Like / Unlike a comment ──────────────────────────────────────────────────
  const handleLikeComment = async (commentId) => {
    if (!isAuthenticated) {
      toast.warning('Please login to like comments')
      return
    }

    try {
      const isLiked = likedComments[commentId]

      if (isLiked) {
        await axios.delete(
          API_ENDPOINTS.comments.unlike(commentId),
          axiosConfig
        )
        setLikedComments(prev => {
          const updated = { ...prev }
          delete updated[commentId]
          return updated
        })
      } else {
        await axios.post(
          API_ENDPOINTS.comments.like,
          { commentId },
          axiosConfig
        )
        setLikedComments(prev => ({ ...prev, [commentId]: true }))
      }

      // Refresh to get accurate like counts
      fetchComments()
    } catch (error) {
      console.error('Failed to like comment:', error)
      toast.error('Failed to process like')
    }
  }

  // ── Delete a comment ─────────────────────────────────────────────────────────
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return

    try {
      await axios.delete(
        API_ENDPOINTS.comments.delete(commentId),
        axiosConfig
      )
      setComments(prev => prev.filter(c => c._id !== commentId))
      toast.success('Comment deleted')
    } catch (error) {
      console.error('Failed to delete comment:', error)
      toast.error('Failed to delete comment')
    }
  }

const getProfileImageUrl = (user) => {
    if (!user || !user.profileImage) return null
    
    const profileImage = user.profileImage
    
    // If it's already a string URL, return it
    if (typeof profileImage === 'string') {
      return profileImage.startsWith('data:') ? profileImage : profileImage
    }
    
    // Handle Buffer/Uint8Array converted to JSON format
    if (profileImage.data && Array.isArray(profileImage.data)) {
      const binaryString = String.fromCharCode.apply(null, profileImage.data)
      const base64 = btoa(binaryString)
      return `data:image/jpeg;base64,${base64}`
    }
    
    // Handle Uint8Array
    if (profileImage instanceof Uint8Array) {
      const base64 = btoa(String.fromCharCode.apply(null, profileImage))
      return `data:image/jpeg;base64,${base64}`
    }
    
    // Handle ArrayBuffer
    if (profileImage instanceof ArrayBuffer) {
      const base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(profileImage)))
      return `data:image/jpeg;base64,${base64}`
    }
    
    return null
  }

  if (!isOpen || !post) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
              Comments on {post.title}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              {post.comments || 0} comments
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : comments.length > 0 ? (
            comments.map(comment => (
              <div key={comment._id} className="border-l-2 border-gray-200 pl-4 space-y-2">
                {/* Author row */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                    {getProfileImageUrl(comment.postedBy) ? (
                      <img
                        src={getProfileImageUrl(comment.postedBy)}
                        alt={`${comment.postedBy?.firstName} ${comment.postedBy?.lastName}`}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">
                      {comment.postedBy?.firstName
                        ? `${comment.postedBy.firstName} ${comment.postedBy.lastName || ''}`.trim()
                        : 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {user?._id === comment.postedBy?._id && (
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
                  )}
                </div>

                {/* Comment text */}
                <p className="text-sm text-gray-700 break-words">{comment.text}</p>

                {/* Actions */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <button
                    onClick={() => handleLikeComment(comment._id)}
                    className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
                      likedComments[comment._id] ? 'text-red-500' : ''
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${likedComments[comment._id] ? 'fill-red-500' : ''}`}
                    />
                    <span>{comment.likeCount || 0}</span>
                  </button>

                  {/* FIX: pass { id, username } so the reply banner can show context */}
                  <button
                    onClick={() =>
                      setReplyingTo({
                        id: comment._id,
                        username: comment.postedBy?.firstName
                          ? `${comment.postedBy.firstName} ${comment.postedBy.lastName || ''}`.trim()
                          : 'Anonymous'
                      })
                    }
                    className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                  >
                    <Reply className="w-4 h-4" />
                    Reply
                  </button>
                </div>

                {/* Nested replies */}
                {comment.replies?.length > 0 && (
                  <div className="ml-4 space-y-2 border-l border-gray-100 pl-3">
                    {comment.replies.map(reply => (
                      <div key={reply._id} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
                            {getProfileImageUrl(reply.postedBy) ? (
                              <img
                                src={getProfileImageUrl(reply.postedBy)}
                                alt={`${reply.postedBy?.firstName} ${reply.postedBy?.lastName}`}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <User className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className="text-xs font-semibold text-gray-800">
                            {reply.postedBy?.firstName
                              ? `${reply.postedBy.firstName} ${reply.postedBy.lastName || ''}`.trim()
                              : 'Anonymous'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(reply.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 break-words">{reply.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle className="w-12 h-12 text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm">No comments yet. Be the first!</p>
            </div>
          )}
        </div>

        {/* Comment Form */}
        <div className="border-t border-gray-200 p-4 sm:p-6 space-y-2">
          {/* FIX: show who you're replying to, not just "Replying to comment" */}
          {replyingTo && (
            <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
              <Reply className="w-3 h-3" />
              <span>Replying to <strong>{replyingTo.username}</strong></span>
              <button
                onClick={() => setReplyingTo(null)}
                className="ml-auto text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handleSubmitComment} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={
                replyingTo
                  ? `Reply to ${replyingTo.username}...`
                  : 'Write a comment...'
              }
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              disabled={submitting || !isAuthenticated}
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim() || !isAuthenticated}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Post</span>
            </button>
          </form>

          {!isAuthenticated && (
            <p className="text-xs text-amber-600">Sign in to comment</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default CommentModal