import storageService from '../services/storage.service.js'
import UserPost from '../models/userPost.model.js'
import foodModel from '../models/food.model.js'
import FoodPartner from '../models/foodPartner.Model.js'
import mongoose from 'mongoose'
import { v4 as uuid } from 'uuid'

const createUserPost = async (req, res) => {
  try {
    const { name, description, type, tags, duration, partnerId, foodId } = req.body

    if (!req.user?._id) return res.status(401).json({ error: 'User not authenticated' })
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })
    if (!type || !['video', 'image'].includes(type))
      return res.status(400).json({ error: 'Valid type (video/image) is required' })
    if (!req.file)
      return res.status(400).json({ error: `${type} file is required` })

    const mimeIsVideo = req.file.mimetype.startsWith('video/')
    const mimeIsImage = req.file.mimetype.startsWith('image/')
    if (type === 'video' && !mimeIsVideo) return res.status(400).json({ error: 'Please upload a valid video file' })
    if (type === 'image' && !mimeIsImage) return res.status(400).json({ error: 'Please upload a valid image file' })

    // ── FIXED UPLOAD ─────────────────────────────────────────────
    const { url: fileUrl, isVideo: uploadedAsVideo } = await storageService.uploadFile(
      req.file.buffer,
      req.file.originalname,   // preserves extension for ImageKit
      req.file.mimetype        // enables /ik-thumbnail.jpg for video posts
    )
    // ─────────────────────────────────────────────────────────────

    const parsedTags = tags
      ? (Array.isArray(tags)
        ? tags
        : (() => { try { return JSON.parse(tags) } catch { return tags.split(',').map(t => t.trim()).filter(Boolean) } })()
      )
      : []

    const postData = {
      title: name.trim(),
      description: description?.trim() || '',
      // Use actual mimetype result — not client's declared type
      type: uploadedAsVideo ? 'video' : 'image',
      postType: 'food',
      postedBy: req.user._id,
      tags: parsedTags,
    }

    if (uploadedAsVideo) {
      postData.video = fileUrl
      if (duration) postData.duration = duration
    } else {
      postData.image = fileUrl
    }

    if (partnerId) {
      const partner = await FoodPartner.findById(partnerId).select('_id companyName')
      if (partner) postData.taggedPartner = partner._id
    }
    if (foodId) {
      const f = await foodModel.findById(foodId).select('_id name')
      if (f) postData.taggedFood = f._id
    }

    const newPost = await UserPost.create(postData)
    await newPost.populate('postedBy', 'firstName lastName email')

    try {
      const userModel = (await import('../models/user.Model.js')).default
      await userModel.findByIdAndUpdate(req.user._id, { $push: { posts: newPost._id } })
    } catch (e) {
      console.warn('Failed to add post to user.posts:', e.message)
    }

    res.status(201).json({ message: 'Post created successfully', post: newPost })
  } catch (error) {
    console.error('Error creating user post:', error)
    res.status(500).json({ error: 'Failed to create post', details: error.message })
  }
}

const getAllUserPosts = async (req, res) => {
  try {
    const { limit = 50, page = 1, sortBy = 'createdAt', sortOrder = 'desc' } = req.query
    const validLimit = Math.min(parseInt(limit), 100)
    const skip = (parseInt(page) - 1) * validLimit
    const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 }

    const posts = await UserPost
      .find({ isActive: true })
      .populate('postedBy', 'firstName lastName email')
      .populate('taggedPartner', 'companyName email')
      .populate('taggedFood', 'name price preparationTime isAvailable description')
      .populate('likes', '_id')
      .sort(sortObj)
      .skip(skip)
      .limit(validLimit)
      .lean()

    const totalCount = await UserPost.countDocuments({ isActive: true })

    res.status(200).json({
      message: 'User posts retrieved successfully',
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / validLimit),
        totalCount,
        hasNextPage: parseInt(page) < Math.ceil(totalCount / validLimit),
        hasPrevPage: parseInt(page) > 1
      },
      data: posts
    })
  } catch (error) {
    console.error('Error getting user posts:', error)
    res.status(500).json({ error: error.message })
  }
}

const getUserPostsByUserId = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?._id
    if (!userId) return res.status(400).json({ error: 'User ID is required' })

    const posts = await UserPost
      .find({ postedBy: userId, isActive: true })
      .populate('taggedPartner', 'companyName email')
      .populate('taggedFood', 'name price preparationTime isAvailable description')
      .sort({ createdAt: -1 })
      .lean()

    res.status(200).json({ message: 'User posts retrieved successfully', count: posts.length, data: posts })
  } catch (error) {
    console.error('Error getting user posts by ID:', error)
    res.status(500).json({ error: error.message })
  }
}

const toggleLike = async (req, res) => {
  try {
    const { id } = req.params
    if (!req.user?._id) return res.status(401).json({ error: 'User not authenticated' })

    const post = await UserPost.findById(id)
    if (!post) return res.status(404).json({ error: 'Post not found' })

    const likeIndex = post.likes.indexOf(req.user._id)
    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1)
      post.likeCount = Math.max(0, post.likeCount - 1)
    } else {
      post.likes.push(req.user._id)
      post.likeCount += 1
    }

    await post.save()
    res.status(200).json({
      message: likeIndex > -1 ? 'Post unliked' : 'Post liked',
      isLiked: likeIndex === -1,
      likeCount: post.likeCount
    })
  } catch (error) {
    console.error('Error toggling like:', error)
    res.status(500).json({ error: error.message })
  }
}

const addComment = async (req, res) => {
  try {
    const { id } = req.params
    const { text } = req.body
    if (!req.user?._id) return res.status(401).json({ error: 'User not authenticated' })
    if (!text?.trim()) return res.status(400).json({ error: 'Comment text is required' })

    const post = await UserPost.findById(id)
    if (!post) return res.status(404).json({ error: 'Post not found' })

    post.comments.push({ user: req.user._id, text: text.trim(), createdAt: new Date() })
    post.commentCount += 1
    await post.save()
    await post.populate('comments.user', 'firstName lastName email')

    res.status(201).json({
      message: 'Comment added successfully',
      comment: post.comments[post.comments.length - 1],
      commentCount: post.commentCount
    })
  } catch (error) {
    console.error('Error adding comment:', error)
    res.status(500).json({ error: error.message })
  }
}

const getComments = async (req, res) => {
  try {
    const { id } = req.params
    const { limit = 20, page = 1 } = req.query
    const validLimit = Math.min(parseInt(limit), 50)
    const skip = (parseInt(page) - 1) * validLimit

    const post = await UserPost.findById(id)
      .populate({ path: 'comments.user', select: 'firstName lastName email' })
      .lean()

    if (!post) return res.status(404).json({ error: 'Post not found' })

    const sorted = post.comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    const paginated = sorted.slice(skip, skip + validLimit)

    res.status(200).json({
      message: 'Comments retrieved successfully',
      comments: paginated,
      totalCount: post.comments.length,
      page: parseInt(page),
      totalPages: Math.ceil(post.comments.length / validLimit)
    })
  } catch (error) {
    console.error('Error getting comments:', error)
    res.status(500).json({ error: error.message })
  }
}

const toggleSave = async (req, res) => {
  try {
    const { id } = req.params
    if (!req.user?._id) return res.status(401).json({ error: 'User not authenticated' })

    const post = await UserPost.findById(id)
    if (!post) return res.status(404).json({ error: 'Post not found' })

    const userModel = (await import('../models/user.Model.js')).default
    const user = await userModel.findById(req.user._id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const isSaved = user.savedPosts.includes(id)
    user.savedPosts = isSaved
      ? user.savedPosts.filter(pId => pId.toString() !== id)
      : [...user.savedPosts, id]

    await user.save()
    res.status(200).json({ message: isSaved ? 'Post unsaved' : 'Post saved', isSaved: !isSaved })
  } catch (error) {
    console.error('Error toggling save:', error)
    res.status(500).json({ error: error.message })
  }
}

export default {
  createUserPost, getAllUserPosts, getUserPostsByUserId,
  toggleLike, addComment, getComments, toggleSave
}