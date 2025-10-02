# FoodReel — Business Model (India)

This document expands the commercial plan for FoodReel tailored for India. It focuses on ad revenue from food partners (restaurants/kitchens) and a small platform fee on customer orders. It includes suggested pricing, Go‑to‑Market, operations, financial assumptions in INR, and product requirements.

---

## 1) One-line thesis
Monetize FoodReel by selling promoted placements and ad campaigns to restaurants and charging a small platform fee on orders — combine predictable recurring ad revenue with transaction fees to grow sustainably in Indian markets.

## 2) Market rationale (India)
- India has massive mobile-first user base and rapid adoption of short-form video content (Reels/Shorts).
- Local restaurants and cloud kitchens constantly seek low-cost channels for discovery and immediate conversion (orders).
- UPI and Indian payment rails substantially reduce checkout friction; average order values (AOV) vary by city but are often INR 200–700.

## 3) Revenue streams (India)
1. Ads & promotions (B2B)
   - Featured feed spots, promoted posts, banner slots, local discovery banners.
   - Pricing models: flat campaign, CPM, or CPC. Offer small entry-level campaigns (INR 1,500–5,000) to attract small restaurants.
2. Platform / transaction fee (B2C)
   - Small fee per order: INR 5–20 fixed, or 1.5%–3% percentage fee on order value.
3. Optional subscriptions & services
   - Monthly partner subscriptions with ad credits and analytics (INR 499 / INR 1,999 tiers).
   - Value-added services: menu photography, premium placement, delivery partner integrations.

## 4) Pricing suggestions (INR)
- Entry campaign: INR 1,500 per week for small towns (limited impressions)
- Metro campaign: INR 4,500 per week for premium slots in metro feeds
- CPM range: INR 50–INR 300 (depends on targeting)
- CPC test: INR 2–INR 20 depending on conversion likelihood
- Platform fee: INR 5 fixed OR 2% of order value (choose hybrid)
- Subscription tiers:
  - Basic: Free – listing + order receiving
  - Starter: INR 12/month – 3 campaign credits
  - Growth: INR 99/month – 1 featured campaign credit (7 days), basic analytics
  - Pro: INR 199/month – priority placement, 5 campaign credits, advanced analytics

## 5) Example unit economics (illustrative)
Assumptions used for subscriptions:
- Total partners: 200
- Distribution (example — adjust as you prefer):
   - Basic (free): 100 partners (50%)
   - Starter (₹12/mo): 60 partners (30%)
   - Growth (₹99/mo): 30 partners (15%)
   - Pro (₹199/mo): 10 partners (5%)

Subscription revenue calculation:
- Starter: 60 * ₹12 = ₹720 / month
- Growth: 30 * ₹99 = ₹2,970 / month
- Pro: 10 * ₹199 = ₹1,990 / month
- Total subscription revenue ≈ ₹5,680 / month

Combined monthly example (same ad & order assumptions as above):
- Ads revenue: ₹240,000 / month (40 advertisers * ₹6,000 avg)
- Transaction revenue (2% of GMV): ₹18,000 / month
- Subscription revenue: ₹5,680 / month

Total monthly revenue (example) ≈ ₹263,680

Notes:
- Subscriptions add a small but recurring revenue stream. If you increase conversion to paid tiers (or raise Starter pricing), subscription revenue scales linearly.
- If you want a conservative or aggressive projection I can re-run this with other distributions (for example 60% Basic / 25% Starter / 10% Growth / 5% Pro) or with different ad buyer percentages.

## 6) Payment & tax considerations (India)
- Support UPI and major card/netbanking via a payment gateway (Razorpay).
- GST: collect and remit GST where applicable. Platform fees and commissions may be taxable — consult local tax counsel.
- Payouts to partners: consider using payouts via bank transfer or partner integration with PSPs (e.g., Stripe Connect, Razorpay Route).

## 7) Product changes required
- `ad.model` and `ad.controller` — store campaigns, targeting, spend, status
- Ad placement layer in feed rendering — prioritize ad posts and track impressions/clicks
- `product.model` and `order.model` — product catalog and orders with platform fee calculation
- Payment integration module (`services/payment.service.js`) with UPI and gateway support
- Billing & invoices for partners (monthly statement, GST info)
- Dashboard for partners to manage campaigns, view analytics and invoices

## 8) Go-to-market strategy (India)
1. Pilot small city or 2 metro neighbourhoods
2. Direct sales to cloud kitchens and local restaurants (offer free/discounted pilot campaigns)
3. Partner with local delivery aggregators or 3PL for logistics
4. Run influencer-driven content seeding to drive user discovery
5. Expand to adjacent cities once conversion metrics and LTV/CAC are validated

## 9) KPIs to track (India)
- Ads: Impressions, clicks, CTR, CPC, conversions (click → order), campaign ROI
- Orders: GMV, number of orders, AOV, platform fee revenue
- Unit metrics: CAC (partner & user), LTV (partner), churn rate, active partners
- Compliance: timely GST invoicing and payout accuracy

## 10) Sales & Support playbook (short)
- Offer 14-day pilot ad credits for new partners
- Provide onboarding checklist: menu upload, product photos, business verification for payouts
- Support SLA for ad approvals and billing queries

## 11) Risks & mitigation (India)
- Low partner adoption: mitigate with low-cost pilots, local sales, case studies
- Payment disputes & chargebacks: use reliable PSP and enforce verification
- Tax & legal complexity: onboard tax advisor early
- Logistics & fulfilment: partner rather than build initially


---

