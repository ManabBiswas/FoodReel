import Advertisement from '../models/advertisement.model.js'
import { serverError } from '../utils/apiError.js'
import storageService from '../services/storage.service.js'
import couponService from '../services/coupon.service.js'
import { v4 as uuid } from 'uuid'

export const createAdvertisement = async (req, res) => {
  try {
    const {
      name, description, type, postType,
      tags, promotionType, prices, validUntil, promoCode
    } = req.body

    if (!name?.trim()) return res.status(400).json({ error: "Name is required" })
    if (!description?.trim()) return res.status(400).json({ error: "Description is required" })
    if (!type || !['video', 'image'].includes(type))
      return res.status(400).json({ error: "Valid type (video/image) is required" })
    if (!promotionType || !['discount', 'bogo', 'combo', 'seasonal', 'announcement'].includes(promotionType))
      return res.status(400).json({ error: "Valid promotion type is required" })
    if (!req.file)
      return res.status(400).json({ error: `${type} file is required` })

    const mimeIsVideo = req.file.mimetype.startsWith('video/')
    const mimeIsImage = req.file.mimetype.startsWith('image/')
    if (type === 'video' && !mimeIsVideo) return res.status(400).json({ error: "Please upload a valid video file" })
    if (type === 'image' && !mimeIsImage) return res.status(400).json({ error: "Please upload a valid image file" })
    if (validUntil && new Date(validUntil) < new Date())
      return res.status(400).json({ error: "Valid until date must be in the future" })

    // A code belongs to exactly one restaurant
    const normalizedPromoCode = couponService.normalizeCode(promoCode)
    if (normalizedPromoCode && !couponService.isValidCode(normalizedPromoCode)) {
      return res.status(400).json({
        error: "Promo code must be 5-32 characters using letters, numbers, hyphens or underscores"
      })
    }
    if (normalizedPromoCode) {
      const conflict = await couponService.findCodeConflict(normalizedPromoCode, req.foodPartner._id)
      if (conflict) {
        return res.status(409).json({
          error: `Promo code ${normalizedPromoCode} is already used by another restaurant`
        })
      }
    }

    // ── FIXED UPLOAD ─────────────────────────────────────────────
    const { url: fileUrl, isVideo: uploadedAsVideo } = await storageService.uploadFile(
      req.file.buffer,
      req.file.originalname,   // preserves extension for ImageKit classification
      req.file.mimetype        // critical: enables /ik-thumbnail.jpg for videos
    )
    // ─────────────────────────────────────────────────────────────

    let parsedTags = []
    if (tags) {
      try { parsedTags = JSON.parse(tags) }
      catch { parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean) }
    }

    let parsedPrices = null
    if (prices) {
      try {
        parsedPrices = JSON.parse(prices)
        if (parsedPrices.original && (isNaN(parsedPrices.original) || parsedPrices.original < 0))
          return res.status(400).json({ error: "Original price must be a valid positive number" })
        if (parsedPrices.discounted && (isNaN(parsedPrices.discounted) || parsedPrices.discounted < 0))
          return res.status(400).json({ error: "Discounted price must be a valid positive number" })
        if (parsedPrices.original && parsedPrices.discounted && parsedPrices.discounted >= parsedPrices.original)
          return res.status(400).json({ error: "Discounted price must be less than original price" })
      } catch {
        parsedPrices = null
      }
    }

    const advertisement = new Advertisement({
      name,
      description,
      // Use actual upload result — not the client's declared type
      type: uploadedAsVideo ? 'video' : 'image',
      postType: 'advertisement',
      tags: parsedTags,
      promotionType,
      prices: parsedPrices,
      validUntil: validUntil ? new Date(validUntil) : null,
      promoCode: normalizedPromoCode || null,
      // ── Store in the correct field so FoodMedia/getFoodMedia works ──
      ...(uploadedAsVideo ? { video: fileUrl } : { image: fileUrl }),
      // Legacy `file` field kept for backward compatibility
      file: fileUrl,
      partnerId: req.foodPartner.id
    })

    await advertisement.save()

    // Turn the displayed code into a redeemable coupon
    let couponWarning = null
    if (advertisement.promoCode) {
      const synced = await couponService.syncCouponForPromotion({
        code: advertisement.promoCode,
        partnerId: req.foodPartner._id,
        prices: parsedPrices,
        validUntil: advertisement.validUntil,
        description: `${advertisement.name} offer`,
        createdBy: 'partner'
      })

      if (synced.ok && synced.coupon) {
        advertisement.couponId = synced.coupon._id
        await advertisement.save()
      } else if (!synced.ok) {
        couponWarning = synced.message
      }
    }

    res.status(201).json({
      message: 'Advertisement created successfully',
      advertisement,
      ...(couponWarning ? { couponWarning } : {})
    })
  } catch (error) {
    console.error('Create advertisement error:', error)
    serverError(res, error, 'Failed to create advertisement')
  }
}

export const getAdvertisementsAll = async (req, res) => {
  try {
    const { limit = 20, skip = 0, sortBy = 'trending' } = req.query
    const validLimit = Math.min(parseInt(limit), 100)
    const validSkip = Math.max(parseInt(skip), 0)

    const sortMap = {
      engagement: { engagement: -1, createdAt: -1 },
      trending: { createdAt: -1 },
      popular: { likeCount: -1, commentCount: -1 },
    }
    const sortObj = sortMap[sortBy] ?? sortMap.trending

    const advertisements = await Advertisement
      .find({ isActive: true })
      .populate('partnerId', 'companyName email verified profileImage')
      .sort(sortObj)
      .skip(validSkip)
      .limit(validLimit)
      .lean()

    const totalCount = await Advertisement.countDocuments({ isActive: true })

    res.status(200).json({
      message: "Advertisements retrieved successfully",
      count: advertisements.length,
      total: totalCount,
      hasMore: validSkip + validLimit < totalCount,
      data: advertisements
    })
  } catch (error) {
    console.error('Get all advertisements error:', error)
    serverError(res, error, 'Failed to fetch advertisements')
  }
}

export const getAllAdvertisements = async (req, res) => {
  try {
    const advertisements = await Advertisement
      .find({ partnerId: req.foodPartner._id })
      .populate('partnerId', 'companyName email')
      .sort({ createdAt: -1 })

    res.status(200).json({
      message: "Advertisements retrieved successfully",
      count: advertisements.length,
      data: advertisements
    })
  } catch (error) {
    console.error('Get advertisements error:', error)
    serverError(res, error, 'Failed to fetch advertisements')
  }
}

export const getAdvertisementById = async (req, res) => {
  try {
    const advertisement = await Advertisement
      .findById(req.params.id)
      .populate('partnerId', 'companyName email')

    if (!advertisement) return res.status(404).json({ error: 'Advertisement not found' })

    res.status(200).json({ message: "Advertisement retrieved successfully", data: advertisement })
  } catch (error) {
    console.error('Get advertisement error:', error)
    serverError(res, error, 'Failed to fetch advertisement')
  }
}

export const updateAdvertisement = async (req, res) => {
  try {
    // Ownership check first: a partner may only update their own advertisement
    // (also avoids re-uploading a file before we know the request is allowed)
    const existing = await Advertisement.findById(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Advertisement not found' })
    if (String(existing.partnerId) !== String(req.foodPartner._id))
      return res.status(403).json({ error: 'You can only update your own advertisement' })

    const { name, description, type, tags, promotionType, prices, validUntil, promoCode } = req.body

    const normalizedPromoCode = couponService.normalizeCode(promoCode)
    if (normalizedPromoCode && !couponService.isValidCode(normalizedPromoCode)) {
      return res.status(400).json({
        error: "Promo code must be 5-32 characters using letters, numbers, hyphens or underscores"
      })
    }
    if (normalizedPromoCode) {
      const conflict = await couponService.findCodeConflict(normalizedPromoCode, req.foodPartner._id)
      if (conflict) {
        return res.status(409).json({
          error: `Promo code ${normalizedPromoCode} is already used by another restaurant`
        })
      }
    }

    const updateData = {
      name, description, type, promotionType,
      validUntil: validUntil ? new Date(validUntil) : null
    }
    // Normalise on write; an explicit empty string clears the code.
    if (promoCode !== undefined) updateData.promoCode = normalizedPromoCode || null

    if (tags) {
      try { updateData.tags = JSON.parse(tags) }
      catch { updateData.tags = Array.isArray(tags) ? tags : [tags] }
    }

    if (prices) {
      try { updateData.prices = JSON.parse(prices) }
      catch { updateData.prices = null }
    }

    // ── FIXED: re-upload with mimetype if a new file was provided ──
    if (req.file) {
      const { url: fileUrl, isVideo: uploadedAsVideo } = await storageService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      )
      updateData.file = fileUrl
      updateData.type = uploadedAsVideo ? 'video' : 'image'
      if (uploadedAsVideo) { updateData.video = fileUrl; updateData.image = undefined }
      else { updateData.image = fileUrl; updateData.video = undefined }
    }

    const advertisement = await Advertisement
      .findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('partnerId', 'companyName email')

    if (!advertisement) return res.status(404).json({ error: 'Advertisement not found' })

    // Keep the redeemable coupon in step with the edited ad
    let couponWarning = null
    if (advertisement.promoCode) {
      const synced = await couponService.syncCouponForPromotion({
        existingCouponId: existing.couponId,
        code: advertisement.promoCode,
        partnerId: req.foodPartner._id,
        prices: advertisement.prices,
        validUntil: advertisement.validUntil,
        description: `${advertisement.name} offer`,
        createdBy: 'partner'
      })

      if (synced.ok && synced.coupon) {
        if (String(advertisement.couponId || '') !== String(synced.coupon._id)) {
          advertisement.couponId = synced.coupon._id
          await advertisement.save()
        }
      } else if (!synced.ok) {
        couponWarning = synced.message
      }
    } else if (existing.couponId) {
      // The code was cleared, so the redeemable version must stop working too.
      await couponService.syncCouponForPromotion({
        existingCouponId: existing.couponId,
        code: '',
        partnerId: req.foodPartner._id
      })
    }

    res.status(200).json({
      message: 'Advertisement updated successfully',
      advertisement,
      ...(couponWarning ? { couponWarning } : {})
    })
  } catch (error) {
    console.error('Update advertisement error:', error)
    serverError(res, error, 'Failed to update advertisement')
  }
}

export const deleteAdvertisement = async (req, res) => {
  try {
    // Ownership check: a partner may only delete their own advertisement
    const existing = await Advertisement.findById(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Advertisement not found' })
    if (String(existing.partnerId) !== String(req.foodPartner._id))
      return res.status(403).json({ error: 'You can only delete your own advertisement' })

    const advertisement = await Advertisement.findByIdAndDelete(req.params.id)
    if (!advertisement) return res.status(404).json({ error: 'Advertisement not found' })

    // Deleting the ad must also stop its code from being redeemable.
    if (existing.couponId) {
      await couponService.syncCouponForPromotion({
        existingCouponId: existing.couponId,
        code: '',
        partnerId: req.foodPartner._id
      })
    }

    res.status(200).json({ message: 'Advertisement deleted successfully' })
  } catch (error) {
    console.error('Delete advertisement error:', error)
    serverError(res, error, 'Failed to delete advertisement')
  }
}