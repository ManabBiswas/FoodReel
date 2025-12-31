import storageService from '../services/storage.service.js';
import UserPost from '../models/userPost.model.js';
import foodModel from '../models/food.model.js';
import FoodPartner from '../models/foodPartner.Model.js';
import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';

const createUserPost = async (req, res) => {
  try {
  const { name, description, type, tags, duration, partnerId, foodId } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!type || !['video', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Valid type (video/image) is required' });
    }
    if (!req.file) {
      return res.status(400).json({ error: `${type} file is required` });
    }

    // Validate file mime
    const isVideo = req.file.mimetype.startsWith('video/');
    const isImage = req.file.mimetype.startsWith('image/');
    if (type === 'video' && !isVideo) return res.status(400).json({ error: 'Please upload a valid video file' });
    if (type === 'image' && !isImage) return res.status(400).json({ error: 'Please upload a valid image file' });

    // Upload to storage
    const uploaded = await storageService.uploadImage(req.file.buffer, uuid());

    const parsedTags = tags ? (Array.isArray(tags) ? tags : (typeof tags === 'string' ? (function(){ try { return JSON.parse(tags) } catch(e){ return tags.split(',').map(t=>t.trim()).filter(Boolean) } })() : []) ) : [];

    const postData = {
      title: name.trim(),
      description: description?.trim() || '',
      type,
      postType: 'food',
      postedBy: req.user._id,
      tags: parsedTags,
    };

    if (type === 'video') {
      postData.video = uploaded;
      if (duration) postData.duration = duration;
    } else {
      postData.image = uploaded;
    }

    // Optionally, validate and attach tagged partner/food references
    if (partnerId) {
      const partner = await FoodPartner.findById(partnerId).select('_id companyName');
      if (partner) postData.taggedPartner = partner._id;
    }
    if (foodId) {
      const f = await foodModel.findById(foodId).select('_id name');
      if (f) postData.taggedFood = f._id;
    }

    const newPost = await UserPost.create(postData);
    await newPost.populate('postedBy', 'firstName lastName email');

    // Optionally, add the post to user's posts array
    try {
      await import('../models/user.Model.js').then(m => m.default.findByIdAndUpdate(req.user._id, { $push: { posts: newPost._id } }));
    } catch (e) {
      // non-fatal
      console.warn('Failed to add post to user.posts:', e.message);
    }

    res.status(201).json({ message: 'Post created successfully', post: newPost });
  } catch (error) {
    console.error('Error creating user post:', error);
    res.status(500).json({ error: 'Failed to create post', details: error.message });
  }
};

// Get all user posts (for feed/reels)
const getAllUserPosts = async (req, res) => {
  try {
    const { limit = 50, page = 1, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const filter = { isActive: true };
    const validLimit = Math.min(parseInt(limit), 100);
    const skip = (parseInt(page) - 1) * validLimit;
    
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const posts = await UserPost
      .find(filter)
      .populate('postedBy', 'firstName lastName email')
      .populate('taggedPartner', 'companyName email')
      .populate('taggedFood', 'name price preparationTime isAvailable description')
      .populate('likes', '_id') // Populate likes to check if user liked
      .sort(sortObj)
      .skip(skip)
      .limit(validLimit)
      .lean();
    
    const totalCount = await UserPost.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / validLimit);
    
    res.status(200).json({
      message: 'User posts retrieved successfully',
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      data: posts
    });
  } catch (error) {
    console.error('Error getting user posts:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get posts by specific user (for profile)
const getUserPostsByUserId = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?._id;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const posts = await UserPost
      .find({ postedBy: userId, isActive: true })
      .populate('taggedPartner', 'companyName email')
      .populate('taggedFood', 'name price preparationTime isAvailable description')
      .sort({ createdAt: -1 })
      .lean();
    
    res.status(200).json({
      message: 'User posts retrieved successfully',
      count: posts.length,
      data: posts
    });
  } catch (error) {
    console.error('Error getting user posts by ID:', error);
    res.status(500).json({ error: error.message });
  }
};

// Toggle like on a user post
const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const userId = req.user._id;
    const post = await UserPost.findById(id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const likeIndex = post.likes.indexOf(userId);
    
    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
      post.likeCount = Math.max(0, post.likeCount - 1);
    } else {
      post.likes.push(userId);
      post.likeCount += 1;
    }
    
    await post.save();
    
    res.status(200).json({
      message: likeIndex > -1 ? 'Post unliked' : 'Post liked',
      isLiked: likeIndex === -1,
      likeCount: post.likeCount
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: error.message });
  }
};

// Add comment to user post
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    
    const post = await UserPost.findById(id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const comment = {
      user: req.user._id,
      text: text.trim(),
      createdAt: new Date()
    };
    
    post.comments.push(comment);
    post.commentCount += 1;
    await post.save();
    
    await post.populate('comments.user', 'firstName lastName email');
    
    res.status(201).json({
      message: 'Comment added successfully',
      comment: post.comments[post.comments.length - 1],
      commentCount: post.commentCount
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get comments for a user post
const getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20, page = 1 } = req.query;
    
    const validLimit = Math.min(parseInt(limit), 50);
    const skip = (parseInt(page) - 1) * validLimit;
    
    const post = await UserPost.findById(id)
      .populate({
        path: 'comments.user',
        select: 'firstName lastName email'
      })
      .lean();
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const totalComments = post.comments.length;
    const paginatedComments = post.comments
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + validLimit);
    
    res.status(200).json({
      message: 'Comments retrieved successfully',
      comments: paginatedComments,
      totalCount: totalComments,
      page: parseInt(page),
      totalPages: Math.ceil(totalComments / validLimit)
    });
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({ error: error.message });
  }
};

export default { 
  createUserPost, 
  getAllUserPosts, 
  getUserPostsByUserId,
  toggleLike,
  addComment,
  getComments
};
