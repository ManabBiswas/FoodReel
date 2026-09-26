import adminModel from "../models/admin.model.js";
import userModel from "../models/user.Model.js";
import foodPartnerModel from "../models/foodPartner.Model.js";
import foodModel from "../models/food.model.js";
import orderModel from "../models/order.model.js";
import reviewModel from "../models/review.model.js";
import advertisementModel from "../models/advertisement.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import emailService from "../services/email.service.js";
import { authCookieOptions } from "../utils/cookies.js";
import { createCache } from "../utils/cache.js";

// AUTH CONTROLLERS
async function login(req, res) {
    try {
        const { email, code } = req.body;

        // Validate input
        if (!email || !code) {
            return res.status(400).json({
                error: "Email and code are required"
            });
        }

        const admin = await adminModel.findOne({ email });
        if (!admin) {
            return res.status(400).json({
                error: "Invalid email or code"
            });
        }

        // Compare code
        if (admin.code !== code) {
            return res.status(400).json({
                error: "Invalid email or code"
            });
        }

        const token = jwt.sign({ id: admin._id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.cookie('token', token, authCookieOptions());
        res.status(200).json({ 
            message: "Login successful",
            admin: {
                id: admin._id,
                email: admin.email,
                name: admin.name
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            error: "Internal server error"
        });
    }
}

async function logout(req, res) {
    try {
        res.clearCookie('token', { path: '/' });
        res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        console.error('Admin logout error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
}

async function verifyAdmin(req, res) {
    try {
        const admin = await adminModel.findById(req.admin._id).select('-code');
        if (!admin) {
            return res.status(404).json({ error: "Admin not found" });
        }
        res.status(200).json({
            isAuthenticated: true,
            admin: {
                id: admin._id,
                email: admin.email,
                name: admin.name
            }
        });
    } catch (error) {
        console.error('Verify admin error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
}

async function getAdminProfile(req, res) {
    try {
        const admin = await adminModel.findById(req.admin._id).select('-code');
        if (!admin) {
            return res.status(404).json({ error: "Admin not found" });
        }
        res.status(200).json({
            admin: {
                id: admin._id,
                email: admin.email,
                name: admin.name,
                createdAt: admin.createdAt
            }
        });
    } catch (error) {
        console.error('Get admin profile error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
}

// DASHBOARD CONTROLLERS
const DAY_MS = 24 * 60 * 60 * 1000

// Different TTLs per endpoint: the live counter can change constantly and stays
// cheap, the lifetime aggregates scan a lot of documents and change slowly.
const liveCache = createCache(3000)
const overviewCache = createCache(15000)
// One cache per range — a single shared cache would serve 7d data for 30d.
const seriesCaches = new Map()

const getSeriesCache = (rangeKey) => {
    if (!seriesCaches.has(rangeKey)) seriesCaches.set(rangeKey, createCache(60000))
    return seriesCaches.get(rangeKey)
}

const SERIES_RANGES = { '7d': 7, '30d': 30, '90d': 90 }

const invalidateDashboardCaches = () => {
    liveCache.invalidate()
    overviewCache.invalidate()
    for (const cache of seriesCaches.values()) cache.invalidate()
}

const startOfDay = (d) => {
    const copy = new Date(d)
    copy.setHours(0, 0, 0, 0)
    return copy
}

/**
 * One pass over the orders collection returns every dashboard aggregate.
 * Previously this was 5 countDocuments plus a separate full-collection
 * $group, so the cost grew with traffic instead of staying flat.
 */
const buildOverview = async () => {
    const now = Date.now()
    const since24h = new Date(now - DAY_MS)
    const since7d = new Date(now - 7 * DAY_MS)

    const [users, partners, foodItems, ads, orderAgg] = await Promise.all([
        // estimatedDocumentCount reads collection metadata — no collection scan
        userModel.estimatedDocumentCount(),
        foodPartnerModel.estimatedDocumentCount(),
        foodModel.estimatedDocumentCount({ postType: 'food' }),
        foodModel.estimatedDocumentCount({ postType: 'advertisement' }),
        orderModel.aggregate([
            {
                $facet: {
                    byStatus: [
                        { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$pricing.totalAmount' } } },
                    ],
                    lifetime: [
                        {
                            $group: {
                                _id: null,
                                totalOrders: { $sum: 1 },
                                totalRevenue: { $sum: '$pricing.totalAmount' },
                                paidRevenue: {
                                    $sum: {
                                        $cond: [{ $eq: ['$paymentDetails.status', 'completed'] }, '$pricing.totalAmount', 0]
                                    }
                                }
                            }
                        },
                    ],
                    last24h: [
                        { $match: { createdAt: { $gte: since24h } } },
                        {
                            $group: {
                                _id: null,
                                orders: { $sum: 1 },
                                revenue: { $sum: '$pricing.totalAmount' }
                            }
                        },
                    ],
                    last7d: [
                        { $match: { createdAt: { $gte: since7d } } },
                        {
                            $group: {
                                _id: null,
                                orders: { $sum: 1 },
                                revenue: { $sum: '$pricing.totalAmount' }
                            }
                        },
                    ],
                },
            },
        ]),
    ])

    const facet = orderAgg[0] || {}
    const lifetime = facet.lifetime?.[0] || {}
    const last24h = facet.last24h?.[0] || {}
    const last7d = facet.last7d?.[0] || {}

    const byStatus = {}
    for (const row of facet.byStatus || []) {
        byStatus[row._id] = { count: row.count, revenue: row.revenue || 0 }
    }

    return {
        totalUsers: users,
        totalPartners: partners,
        totalFoodItems: foodItems,
        totalAds: ads,
        totalOrders: lifetime.totalOrders || 0,
        totalRevenue: lifetime.totalRevenue || 0,
        paidRevenue: lifetime.paidRevenue || 0,
        orders24h: last24h.orders || 0,
        revenue24h: last24h.revenue || 0,
        orders7d: last7d.orders || 0,
        revenue7d: last7d.revenue || 0,
        byStatus,
        serverTime: new Date().toISOString(),
    }
}

async function getDashboardStats(req, res) {
    try {
        const stats = await overviewCache.resolve(buildOverview)
        res.status(200).json({ stats })
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
}

/**
 * Cheap poll target for the live indicator: metadata counters plus the newest
 * order. No aggregation, so a 5s poll from many admins stays flat-cost.
 */
async function getDashboardLive(req, res) {
    try {
        const live = await liveCache.resolve(async () => {
            const [users, partners, orders, foodItems, latest] = await Promise.all([
                userModel.estimatedDocumentCount(),
                foodPartnerModel.estimatedDocumentCount(),
                orderModel.estimatedDocumentCount(),
                foodModel.estimatedDocumentCount({ postType: 'food' }),
                orderModel.findOne().sort({ createdAt: -1 }).select('_id status createdAt pricing.totalAmount').lean(),
            ])

            return {
                counts: { users, partners, orders, foodItems },
                latestOrder: latest
                    ? {
                        id: latest._id,
                        status: latest.status,
                        createdAt: latest.createdAt,
                        totalAmount: latest.pricing?.totalAmount || 0,
                    }
                    : null,
                serverTime: new Date().toISOString(),
            }
        })

        res.status(200).json({ live })
    } catch (error) {
        console.error('Dashboard live error:', error);
        res.status(500).json({ error: "Failed to fetch live counters" });
    }
}

/**
 * Daily buckets for the trend chart. Range-limited and matched on an indexed
 * `createdAt`, so cost scales with the window, not with table size.
 */
async function getDashboardTimeseries(req, res) {
    try {
        const rangeKey = SERIES_RANGES[req.query.range] ? req.query.range : '7d'
        const days = SERIES_RANGES[rangeKey]

        const series = await getSeriesCache(rangeKey).resolve(async () => {
            const from = startOfDay(new Date(Date.now() - (days - 1) * DAY_MS))

            const rows = await orderModel.aggregate([
                { $match: { createdAt: { $gte: from } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } },
                        orders: { $sum: 1 },
                        revenue: { $sum: '$pricing.totalAmount' },
                    },
                },
                { $sort: { _id: 1 } },
            ])

            const byDate = new Map(rows.map((r) => [r._id, r]))
            const series = []
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date(Date.now() - i * DAY_MS)
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                const row = byDate.get(key)
                series.push({
                    date: key,
                    label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                    orders: row?.orders || 0,
                    revenue: row?.revenue || 0,
                })
            }
            return series
        })

        res.status(200).json({ range: rangeKey, series })
    } catch (error) {
        console.error('Dashboard timeseries error:', error);
        res.status(500).json({ error: "Failed to fetch trend data" });
    }
}

// USER MANAGEMENT CONTROLLERS
async function getAllUsers(req, res) {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const skip = (page - 1) * limit;
        
        const query = search ? {
            $or: [
                { email: new RegExp(search, 'i') },
                { firstName: new RegExp(search, 'i') },
                { lastName: new RegExp(search, 'i') },
                { username: new RegExp(search, 'i') }
            ]
        } : {};
        
        const users = await userModel.find(query)
            .select('-password')
            .limit(limit)
            .skip(skip)
            .sort({ createdAt: -1 });
        
        const total = await userModel.countDocuments(query);
        
        res.status(200).json({
            users,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
}

async function getUserDetails(req, res) {
    try {
        const user = await userModel.findById(req.params.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({ user });
    } catch (error) {
        console.error('Get user details error:', error);
        res.status(500).json({ error: "Failed to fetch user details" });
    }
}

async function toggleUserBlock(req, res) {
    try {
        const { userId } = req.params;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        user.isBlocked = !user.isBlocked;
        await user.save();
        invalidateDashboardCaches();
        
        res.status(200).json({
            message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`,
            user: {
                id: user._id,
                email: user.email,
                isBlocked: user.isBlocked
            }
        });
    } catch (error) {
        console.error('Toggle user block error:', error);
        res.status(500).json({ error: "Failed to update user status" });
    }
}

async function deleteUser(req, res) {
    try {
        const user = await userModel.findByIdAndDelete(req.params.userId);
        invalidateDashboardCaches();
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        res.status(200).json({
            message: "User deleted successfully",
            deletedUser: user._id
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: "Failed to delete user" });
    }
}

// PARTNER MANAGEMENT CONTROLLERS
async function getAllPartners(req, res) {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const skip = (page - 1) * limit;
        
        const query = search ? { companyName: new RegExp(search, 'i') } : {};
        
        const partners = await foodPartnerModel.find(query)
            .select('-password')
            .limit(limit)
            .skip(skip)
            .sort({ createdAt: -1 });
        
        const total = await foodPartnerModel.countDocuments(query);
        
        res.status(200).json({
            partners,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all partners error:', error);
        res.status(500).json({ error: "Failed to fetch partners" });
    }
}

async function getPartnerDetails(req, res) {
    try {
        const partner = await foodPartnerModel.findById(req.params.partnerId).select('-password');
        if (!partner) {
            return res.status(404).json({ error: "Partner not found" });
        }
        
        const foodCount = await foodModel.countDocuments({ foodPartner: partner._id });
        
        res.status(200).json({
            partner: {
                ...partner.toObject(),
                foodItemsCount: foodCount
            }
        });
    } catch (error) {
        console.error('Get partner details error:', error);
        res.status(500).json({ error: "Failed to fetch partner details" });
    }
}

async function togglePartnerVerification(req, res) {
    try {
        const { partnerId } = req.params;
        const partner = await foodPartnerModel.findById(partnerId);
        if (!partner) {
            return res.status(404).json({ error: "Partner not found" });
        }
        
        partner.verified = !partner.verified;
        await partner.save();
        invalidateDashboardCaches();
        
        res.status(200).json({
            message: `Partner ${partner.verified ? 'verified' : 'unverified'} successfully`,
            partner: {
                id: partner._id,
                companyName: partner.companyName,
                verified: partner.verified
            }
        });

        // Send partner approved/rejected email (fire-and-forget)
        if (partner.verified) {
            emailService.sendPartnerApprovedEmail(
                partner.email,
                partner.companyName,
                partner.companyName
            ).catch(err => console.error('Failed to send partner approved email:', err.message));
        } else {
            emailService.sendPartnerRejectedEmail(
                partner.email,
                partner.companyName,
                partner.companyName,
                'Your verification has been revoked by admin'
            ).catch(err => console.error('Failed to send partner rejected email:', err.message));
        }
    } catch (error) {
        console.error('Toggle partner verification error:', error);
        res.status(500).json({ error: "Failed to update partner verification" });
    }
}

async function togglePartnerBlock(req, res) {
    try {
        const { partnerId } = req.params;
        const partner = await foodPartnerModel.findById(partnerId);
        if (!partner) {
            return res.status(404).json({ error: "Partner not found" });
        }
        
        partner.isBlocked = !partner.isBlocked;
        await partner.save();
        invalidateDashboardCaches();
        
        res.status(200).json({
            message: `Partner ${partner.isBlocked ? 'blocked' : 'unblocked'} successfully`,
            partner: {
                id: partner._id,
                companyName: partner.companyName,
                isBlocked: partner.isBlocked
            }
        });
    } catch (error) {
        console.error('Toggle partner block error:', error);
        res.status(500).json({ error: "Failed to update partner status" });
    }
}

async function deletePartner(req, res) {
    try {
        const partner = await foodPartnerModel.findByIdAndDelete(req.params.partnerId);
        invalidateDashboardCaches();
        if (!partner) {
            return res.status(404).json({ error: "Partner not found" });
        }
        
        res.status(200).json({
            message: "Partner deleted successfully",
            deletedPartner: partner._id
        });
    } catch (error) {
        console.error('Delete partner error:', error);
        res.status(500).json({ error: "Failed to delete partner" });
    }
}

// CONTENT MODERATION CONTROLLERS
async function getAllFoodItems(req, res) {
    try {
        const { page = 1, limit = 10, status = 'all' } = req.query;
        const skip = (page - 1) * limit;
        
        const query = { postType: 'food' };
        if (status !== 'all') {
            query.isActive = status === 'active';
        }
        
        const foodItems = await foodModel.find(query)
            .populate('foodPartner', 'companyName email')
            .limit(limit)
            .skip(skip)
            .sort({ createdAt: -1 });
        
        const total = await foodModel.countDocuments(query);
        
        res.status(200).json({
            foodItems,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all food items error:', error);
        res.status(500).json({ error: "Failed to fetch food items" });
    }
}

async function getFoodItemDetails(req, res) {
    try {
        const foodItem = await foodModel.findById(req.params.foodId)
            .populate('foodPartner', 'companyName email');
        
        if (!foodItem) {
            return res.status(404).json({ error: "Food item not found" });
        }
        
        res.status(200).json({ foodItem });
    } catch (error) {
        console.error('Get food item details error:', error);
        res.status(500).json({ error: "Failed to fetch food item details" });
    }
}

async function approveFoodItem(req, res) {
    try {
        const { foodId } = req.params;
        const { approve } = req.body;
        
        const foodItem = await foodModel.findById(foodId);
        if (!foodItem) {
            return res.status(404).json({ error: "Food item not found" });
        }
        
        foodItem.isActive = approve;
        await foodItem.save();
        invalidateDashboardCaches();
        
        res.status(200).json({
            message: `Food item ${approve ? 'approved' : 'rejected'} successfully`,
            foodItem: {
                id: foodItem._id,
                name: foodItem.name,
                isActive: foodItem.isActive
            }
        });
    } catch (error) {
        console.error('Approve food item error:', error);
        res.status(500).json({ error: "Failed to update food item status" });
    }
}

async function deleteFoodItem(req, res) {
    try {
        const foodItem = await foodModel.findByIdAndDelete(req.params.foodId);
        invalidateDashboardCaches();
        if (!foodItem) {
            return res.status(404).json({ error: "Food item not found" });
        }
        
        res.status(200).json({
            message: "Food item deleted successfully",
            deletedItem: foodItem._id
        });
    } catch (error) {
        console.error('Delete food item error:', error);
        res.status(500).json({ error: "Failed to delete food item" });
    }
}

async function getAllAdvertisements(req, res) {
    try {
        const { page = 1, limit = 10, status = 'all' } = req.query;
        const skip = (page - 1) * limit;
        
        const query = {};
        if (status !== 'all') {
            query.isActive = status === 'active';
        }
        
        const advertisements = await advertisementModel.find(query)
            .populate('partnerId', 'companyName email')
            .limit(limit)
            .skip(skip)
            .sort({ createdAt: -1 });
        
        const total = await advertisementModel.countDocuments(query);
        
        res.status(200).json({
            advertisements,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all advertisements error:', error);
        res.status(500).json({ error: "Failed to fetch advertisements" });
    }
}

async function approveAdvertisement(req, res) {
    try {
        const { adId } = req.params;
        const { approve } = req.body;
        
        const ad = await advertisementModel.findById(adId);
        if (!ad) {
            return res.status(404).json({ error: "Advertisement not found" });
        }
        
        ad.isActive = approve;
        await ad.save();
        invalidateDashboardCaches();
        
        res.status(200).json({
            message: `Advertisement ${approve ? 'approved' : 'rejected'} successfully`,
            ad: {
                id: ad._id,
                name: ad.name,
                isActive: ad.isActive
            }
        });
    } catch (error) {
        console.error('Approve advertisement error:', error);
        res.status(500).json({ error: "Failed to update advertisement status" });
    }
}

async function deleteAdvertisement(req, res) {
    try {
        const ad = await advertisementModel.findByIdAndDelete(req.params.adId);
        invalidateDashboardCaches();
        if (!ad) {
            return res.status(404).json({ error: "Advertisement not found" });
        }
        
        res.status(200).json({
            message: "Advertisement deleted successfully",
            deletedAd: ad._id
        });
    } catch (error) {
        console.error('Delete advertisement error:', error);
        res.status(500).json({ error: "Failed to delete advertisement" });
    }
}

// REVIEW & REPORT MANAGEMENT CONTROLLERS
async function getAllReviews(req, res) {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;
        
        const reviews = await reviewModel.find()
            .populate('user', 'name email')
            .limit(limit)
            .skip(skip)
            .sort({ createdAt: -1 });
        
        const total = await reviewModel.countDocuments();
        
        res.status(200).json({
            reviews,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all reviews error:', error);
        res.status(500).json({ error: "Failed to fetch reviews" });
    }
}

async function deleteReview(req, res) {
    try {
        const review = await reviewModel.findByIdAndDelete(req.params.reviewId);
        invalidateDashboardCaches();
        if (!review) {
            return res.status(404).json({ error: "Review not found" });
        }
        
        res.status(200).json({
            message: "Review deleted successfully",
            deletedReview: review._id
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ error: "Failed to delete review" });
    }
}

// ORDERS MANAGEMENT CONTROLLERS
async function getAllOrders(req, res) {
    try {
        const { page = 1, limit = 10, status = 'all' } = req.query;
        const skip = (page - 1) * limit;
        
        const query = {};
        if (status !== 'all') {
            query.status = status;
        }
        
        const orders = await orderModel.find(query)
            .populate('user', 'name email')
            .populate('items.foodPartner', 'companyName')
            .limit(parseInt(limit))
            .skip(skip)
            .sort({ createdAt: -1 });
        
        const total = await orderModel.countDocuments(query);
        
        res.status(200).json({
            orders,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
}

async function getOrderDetails(req, res) {
    try {
        const order = await orderModel.findById(req.params.orderId)
            .populate('user', 'name email phone')
            .populate('items.foodPartner', 'companyName email');
        
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }
        
        res.status(200).json({ order });
    } catch (error) {
        console.error('Get order details error:', error);
        res.status(500).json({ error: "Failed to fetch order details" });
    }
}

// ANALYTICS CONTROLLERS
async function getRevenueAnalytics(req, res) {
    try {
        const revenueByMonth = await orderModel.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    revenue: { $sum: "$pricing.totalAmount" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        
        res.status(200).json({
            revenueByMonth
        });
    } catch (error) {
        console.error('Revenue analytics error:', error);
        res.status(500).json({ error: "Failed to fetch revenue analytics" });
    }
}

async function getUserAnalytics(req, res) {
    try {
        const totalUsers = await userModel.countDocuments();
        const newUsersThisMonth = await userModel.countDocuments({
            createdAt: { $gte: new Date(new Date().setDate(1)) }
        });
        
        const blockedUsers = await userModel.countDocuments({ isBlocked: true });
        
        res.status(200).json({
            analytics: {
                totalUsers,
                newUsersThisMonth,
                blockedUsers,
                activeUsers: totalUsers - blockedUsers
            }
        });
    } catch (error) {
        console.error('User analytics error:', error);
        res.status(500).json({ error: "Failed to fetch user analytics" });
    }
}

async function getPartnerAnalytics(req, res) {
    try {
        const totalPartners = await foodPartnerModel.countDocuments();
        const verifiedPartners = await foodPartnerModel.countDocuments({ verified: true });
        const blockedPartners = await foodPartnerModel.countDocuments({ isBlocked: true });
        
        res.status(200).json({
            analytics: {
                totalPartners,
                verifiedPartners,
                blockedPartners,
                unverifiedPartners: totalPartners - verifiedPartners
            }
        });
    } catch (error) {
        console.error('Partner analytics error:', error);
        res.status(500).json({ error: "Failed to fetch partner analytics" });
    }
}

// SUPPORT CONTROLLERS
async function getSupportTickets(req, res) {
    try {
        res.status(200).json({
            tickets: [],
            message: "Support tickets feature coming soon"
        });
    } catch (error) {
        console.error('Get support tickets error:', error);
        res.status(500).json({ error: "Failed to fetch support tickets" });
    }
}

async function updateSupportTicket(req, res) {
    try {
        res.status(200).json({
            message: "Support ticket update feature coming soon"
        });
    } catch (error) {
        console.error('Update support ticket error:', error);
        res.status(500).json({ error: "Failed to update support ticket" });
    }
}

export default {
    // Auth
    login,
    logout,
    verifyAdmin,
    getAdminProfile,
    // Dashboard
    getDashboardStats,
    // Users
    getAllUsers,
    getUserDetails,
    toggleUserBlock,
    deleteUser,
    // Partners
    getAllPartners,
    getPartnerDetails,
    togglePartnerVerification,
    togglePartnerBlock,
    deletePartner,
    // Content
    getAllFoodItems,
    getFoodItemDetails,
    approveFoodItem,
    deleteFoodItem,
    getAllAdvertisements,
    approveAdvertisement,
    deleteAdvertisement,
    // Reviews
    getAllReviews,
    deleteReview,
    // Orders
    getAllOrders,
    getOrderDetails,
    // Analytics
    getRevenueAnalytics,
    getUserAnalytics,
    getPartnerAnalytics,
    // Support
    getSupportTickets,
    updateSupportTicket,
    // Live dashboard
    getDashboardLive,
    getDashboardTimeseries
};
