import Advertisement from '../models/advertisement.model.js'
import storageService from '../services/storage.service.js'
import { v4 as uuid } from 'uuid'

// Create new advertisement
export const createAdvertisement = async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      postType,
      tags,
      promotionType,
      prices,
      validUntil,
      promoCode
    } = req.body

    // Basic validation
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ error: "Description is required" });
    }
    
    if (!type || !['video', 'image'].includes(type)) {
      return res.status(400).json({ error: "Valid type (video/image) is required" });
    }

    if (!promotionType || !['discount', 'bogo', 'combo', 'seasonal', 'announcement'].includes(promotionType)) {
      return res.status(400).json({ error: "Valid promotion type is required" });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: `${type} file is required` });
    }

    // Validate file type based on selected type
    const isVideo = req.file.mimetype.startsWith('video/');
    const isImage = req.file.mimetype.startsWith('image/');
    
    if (type === 'video' && !isVideo) {
      return res.status(400).json({ error: "Please upload a valid video file" });
    }
    
    if (type === 'image' && !isImage) {
      return res.status(400).json({ error: "Please upload a valid image file" });
    }

    // Validate dates
    if (validUntil && new Date(validUntil) < new Date()) {
      return res.status(400).json({ error: "Valid until date must be in the future" });
    }

    console.log("Food Partner:", req.foodPartner);
    console.log("Request Body:", req.body);
    console.log("File Info:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Upload file to storage
    const fileUploadResult = await storageService.uploadImage(req.file.buffer, uuid());
    console.log("File upload result:", fileUploadResult);

    // Parse tags if it's a string
    let parsedTags = []
    if (tags) {
      try {
        parsedTags = JSON.parse(tags)
      } catch (e) {
        // If parsing fails, treat as comma-separated string
        parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      }
    }

    // Parse prices if it's a string
    let parsedPrices = null
    if (prices) {
      try {
        parsedPrices = JSON.parse(prices)
        // Validate prices object
        if (parsedPrices.original && (isNaN(parsedPrices.original) || parsedPrices.original < 0)) {
          return res.status(400).json({ error: "Original price must be a valid positive number" });
        }
        if (parsedPrices.discounted && (isNaN(parsedPrices.discounted) || parsedPrices.discounted < 0)) {
          return res.status(400).json({ error: "Discounted price must be a valid positive number" });
        }
        if (parsedPrices.original && parsedPrices.discounted && parsedPrices.discounted >= parsedPrices.original) {
          return res.status(400).json({ error: "Discounted price must be less than original price" });
        }
      } catch (e) {
        parsedPrices = null
      }
    }

    const advertisement = new Advertisement({
      name,
      description,
      type,
      postType: 'advertisement',
      tags: parsedTags,
      promotionType,
      prices: parsedPrices,
      validUntil: validUntil ? new Date(validUntil) : null,
      promoCode: promoCode ? promoCode.toUpperCase() : null,
      file: fileUploadResult,
      partnerId: req.foodPartner.id
    })

    await advertisement.save()
    
    res.status(201).json({ 
      message: 'Advertisement created successfully', 
      advertisement 
    })
  } catch (error) {
    console.error('Create advertisement error:', error)
    res.status(500).json({ 
      error: error.message || 'Failed to create advertisement' 
    })
  }
}

// Get all advertisements
export const getAllAdvertisements = async (req, res) => {
  try {
    const advertisements = await Advertisement.find()
      .populate('partnerId', 'name email')
      .sort({ createdAt: -1 })
    
    res.status(200).json(advertisements)
  } catch (error) {
    console.error('Get advertisements error:', error)
    res.status(500).json({ 
      error: error.message || 'Failed to fetch advertisements' 
    })
  }
}

// Get advertisement by ID
export const getAdvertisementById = async (req, res) => {
  try {
    const advertisement = await Advertisement.findById(req.params.id)
      .populate('partnerId', 'name email')
    
    if (!advertisement) {
      return res.status(404).json({ error: 'Advertisement not found' })
    }
    
    res.status(200).json(advertisement)
  } catch (error) {
    console.error('Get advertisement error:', error)
    res.status(500).json({ 
      error: error.message || 'Failed to fetch advertisement' 
    })
  }
}

// Update advertisement
export const updateAdvertisement = async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      tags,
      promotionType,
      prices,
      validUntil,
      promoCode
    } = req.body

    const updateData = {
      name,
      description,
      type,
      promotionType,
      validUntil: validUntil ? new Date(validUntil) : null,
      promoCode
    }

    // Parse tags if provided
    if (tags) {
      try {
        updateData.tags = JSON.parse(tags)
      } catch (e) {
        updateData.tags = Array.isArray(tags) ? tags : [tags]
      }
    }

    // Parse prices if provided
    if (prices) {
      try {
        updateData.prices = JSON.parse(prices)
      } catch (e) {
        updateData.prices = null
      }
    }

    // Update file if new one is uploaded
    if (req.file) {
      updateData.file = req.file.filename
    }

    const advertisement = await Advertisement.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('partnerId', 'name email')

    if (!advertisement) {
      return res.status(404).json({ error: 'Advertisement not found' })
    }

    res.status(200).json({ 
      message: 'Advertisement updated successfully', 
      advertisement 
    })
  } catch (error) {
    console.error('Update advertisement error:', error)
    res.status(500).json({ 
      error: error.message || 'Failed to update advertisement' 
    })
  }
}

// Delete advertisement
export const deleteAdvertisement = async (req, res) => {
  try {
    const advertisement = await Advertisement.findByIdAndDelete(req.params.id)
    
    if (!advertisement) {
      return res.status(404).json({ error: 'Advertisement not found' })
    }
    
    res.status(200).json({ message: 'Advertisement deleted successfully' })
  } catch (error) {
    console.error('Delete advertisement error:', error)
    res.status(500).json({ 
      error: error.message || 'Failed to delete advertisement' 
    })
  }
}