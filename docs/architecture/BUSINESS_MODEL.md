# FoodReel Business Model (India)

This document describes the commercial plan for FoodReel in India: ad revenue from food partners (restaurants and kitchens), a small platform fee on customer orders, suggested pricing, go-to-market, operations, financial assumptions in INR, and product requirements.

> **Status note (updated 2026-11):** Parts of this plan are now live. The platform already implements the order flow with a platform fee and GST, a coupon/promo-code system (partner-created, one restaurant per code, eligible-item scoping, minimum order value, per-user and total usage limits), the Razorpay and COD payment rails, advertisements with promo codes synced into the coupon system, and food fest ticket booking. Prices and revenue assumptions below remain a model, not audited results.

---

## 1) Thesis
FoodReel sells promoted placements and ad campaigns to restaurants and charges a small platform fee on orders. Recurring ad revenue and transaction fees fund growth in Indian markets.

## 2) Market rationale
- India has a large mobile-first user base and fast adoption of short-form video such as Reels and Shorts.
- Local restaurants and cloud kitchens look for low-cost channels that turn discovery into orders.
- UPI and other Indian payment rails reduce checkout friction. Average order values (AOV) vary by city, often INR 200 to 700.

## 3) Revenue streams
1. Ads and promotions (B2B)
   - Featured feed spots, promoted posts, banner slots, and local discovery banners.
   - Pricing models: flat campaign, CPM, or CPC. Small entry-level campaigns (INR 1,500 to 5,000) attract small restaurants.
2. Platform and transaction fee (B2C)
   - Small fee per order: INR 5 to 20 fixed, or 1.5% to 3% of order value.
3. Optional subscriptions and services
   - Monthly partner subscriptions with ad credits and analytics (INR 499 and INR 1,999 tiers).
   - Value-added services: menu photography, premium placement, and delivery partner integrations.

## 4) Pricing suggestions
- Entry campaign: INR 1,500 per week for small towns (limited impressions)
- Metro campaign: INR 4,500 per week for premium slots in metro feeds
- CPM range: INR 50 to 300, depending on targeting
- CPC test: INR 2 to 20, depending on conversion likelihood
- Platform fee: INR 5 fixed or 2% of order value (choose a hybrid)
- Subscription tiers:
  - Basic: Free. Listing and order receiving.
  - Starter: INR 12/month. Three campaign credits.
  - Growth: INR 99/month. One featured campaign credit for 7 days and basic analytics.
  - Pro: INR 199/month. Priority placement, five campaign credits, and advanced analytics.

## 5) Example unit economics
Subscription assumptions:
- Total partners: 200
- Distribution (example; adjust as needed):
   - Basic (free): 100 partners (50%)
   - Starter (₹12/mo): 60 partners (30%)
   - Growth (₹99/mo): 30 partners (15%)
   - Pro (₹199/mo): 10 partners (5%)

Subscription revenue calculation:
- Starter: 60 * ₹12 = ₹720 / month
- Growth: 30 * ₹99 = ₹2,970 / month
- Pro: 10 * ₹199 = ₹1,990 / month
- Total subscription revenue ≈ ₹5,680 / month

Combined monthly example (same ad and order assumptions as above):
- Ads revenue: ₹240,000 / month (40 advertisers * ₹6,000 avg)
- Transaction revenue (2% of GMV): ₹18,000 / month
- Subscription revenue: ₹5,680 / month

Total monthly revenue (example) ≈ ₹263,680

Notes:
- Subscriptions add a small recurring stream. More paid conversions or a higher Starter price increase subscription revenue in a straight line.
- For a conservative or aggressive projection, rerun the model with another distribution, such as 60% Basic, 25% Starter, 10% Growth, and 5% Pro, or with different ad buyer percentages.

## 6) Payment and tax considerations
- Support UPI and major cards and netbanking through a payment gateway such as Razorpay.
- GST: collect and remit GST where applicable. Platform fees and commissions may be taxable, so consult local tax counsel.
- Payouts to partners: use bank transfers or a PSP integration such as Stripe Connect or Razorpay Route.

## 7) Product changes required
- Feed posts are a single `food.model` / `food.controller` pair with a `postType` enum (`food` | `advertisement`) and a matching advertisement route module. The separate `ad.model` / `product.model` from earlier drafts were not built — advertisements live in the food post model.
- `order.model` / `order.controller`: orders now carry a 3% platform fee, 5% GST, a distance-based delivery fee, and an immutable coupon snapshot when a code is used.
- `coupon.model` / `coupon.service`: promo codes (5–32 chars, one restaurant per code, eligible-item scoping via `applicableItemIds`, minimum order value, minimum quantity, per-user and total usage limits) applied in cart checkout and in the reel quick checkout; advertised promo codes sync into the same collection.
- Payment integration module (`services/payment.service.js`): Razorpay with auto-capture and COD. COD coupons are consumed at order creation; Razorpay coupons are consumed on payment verification.
- Partner dashboard manages posts, advertisements, promo codes, orders and payments. Email service is wired for order and refund notifications.
- Billing and GST invoices for partners remain to be built.
- Delivery fee is distance-based (0/20/40/60 INR bands) — see `calculatePricing` in `services/payment.service.js`.

## 8) Go-to-market strategy
1. Pilot in a small city or two metro neighbourhoods.
2. Sell directly to cloud kitchens and local restaurants. Offer free or discounted pilot campaigns.
3. Partner with local delivery aggregators or third-party logistics providers.
4. Use influencers to seed content and drive user discovery.
5. Expand to nearby cities once conversion, LTV, and CAC are validated.

## 9) KPIs to track
- Ads: impressions, clicks, CTR, CPC, conversions from click to order, and campaign ROI.
- Orders: GMV, number of orders, AOV, and platform fee revenue.
- Unit metrics: CAC for partners and users, partner LTV, churn rate, and active partners.
- Compliance: timely GST invoicing and payout accuracy.

## 10) Sales and support playbook
- Offer 14-day pilot ad credits to new partners.
- Provide an onboarding checklist: menu upload, product photos, and business verification for payouts.
- Set a support SLA for ad approvals and billing queries.

## 11) Risks and mitigation
- Low partner adoption: run low-cost pilots, local sales, and case studies.
- Payment disputes and chargebacks: use a reliable PSP and enforce verification.
- Tax and legal complexity: bring in a tax advisor early.
- Logistics and fulfilment: partner instead of building initially.

---
