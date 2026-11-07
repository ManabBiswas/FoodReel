/**
 * READ-ONLY data consistency sweep.
 *
 * Reports states that the payment/inventory fixes in Phase 1+ need to know
 * about, WITHOUT changing anything. Every query here is a read; there is no
 * update/delete/insert path in this file by design.
 *
 * Run:  node scripts/data-sweep.mjs
 * Env:  MONGODB_URL (defaults to mongodb://localhost:27017/FoodReel)
 *
 * Exit code is always 0 — this reports, it does not gate.
 */

import mongoose from 'mongoose'

const url =
    process.env.MONGODB_URL ||
    'mongodb://localhost:27017/FoodReel'

// Belt and braces: make any accidental write throw instead of silently
// mutating data during a "read-only" run.
mongoose.set('strictQuery', true)

const findings = []

const report = (severity, area, message, count, examples = []) => {
    findings.push({ severity, area, message, count, examples })
}

const ids = (docs, pick = (d) => d._id) =>
    docs.map(pick).map((id) => String(id)).slice(0, 5)

const section = (title) => console.log(`\n${'='.repeat(64)}\n${title}\n${'='.repeat(64)}`)

const line = (label, value) => console.log(`  ${String(label).padEnd(46)} ${value}`)

async function run() {
    const conn = await mongoose.connect(url, { serverSelectionTimeoutMS: 8000 })
    const db = conn.connection.db
    line('connected to', `${db.databaseName} @ ${conn.connection.host}`)

    const col = (name) => db.collection(name)

    // ---------------------------------------------------------------- orders
    section('ORDERS')
    const orders = col('orders')
    const orderTotal = await orders.countDocuments()
    line('total orders', orderTotal)

    if (orderTotal) {
        const byStatus = await orders
            .aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }, { $sort: { n: -1 } }])
            .toArray()
        // JSON.stringify so an unexpected value (stray whitespace, typo) is visible
        line('by status', byStatus.map((s) => `${JSON.stringify(s._id ?? null)}=${s.n}`).join('  '))

        // A status outside the schema enum means it was written without validation
        // (raw update, migration, or an older code path) and no query using the
        // enum will ever match it.
        const VALID_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']
        const offEnum = byStatus.filter((s) => !VALID_STATUSES.includes(s._id))
        if (offEnum.length) {
            report('CRITICAL', 'orders', 'status value not in the schema enum (invisible to enum queries)', offEnum.length, offEnum.map((s) => `${JSON.stringify(s._id)} x${s.n}`))
            const sample = await orders.find({ status: { $in: offEnum.map((s) => s._id) } }).project({ status: 1, 'cancellation.isCancelled': 1 }).limit(10).toArray()
            offEnum.forEach((s) => {
                sample.filter((d) => d.status === s._id).forEach((d) => {
                    console.log(`        doc ${d._id} status=${JSON.stringify(d.status)} isCancelled=${d.cancellation?.isCancelled}`)
                })
            })
        }

        // Payment left in 'processing' for a long time = abandoned checkout
        const staleProcessing = await orders.countDocuments({
            'paymentDetails.status': 'processing',
            createdAt: { $lt: new Date(Date.now() - 60 * 60 * 1000) },
        })
        if (staleProcessing) {
            report('LOW', 'orders', 'payment stuck in "processing" for over an hour', staleProcessing, [])
        }

        const byPay = await orders
            .aggregate([
                { $group: { _id: '$paymentDetails.status', n: { $sum: 1 } } },
                { $sort: { n: -1 } },
            ])
            .toArray()
        line('by payment status', byPay.map((s) => `${s._id ?? 'null'}=${s.n}`).join('  '))

        // Fulfilled but never paid — the audit's "unpaid fulfilment" finding
        const unpaidFulfilled = await orders
            .find({
                status: { $in: ['confirmed', 'preparing', 'ready', 'delivered'] },
                'paymentDetails.status': { $nin: ['completed', 'refunded'] },
            })
            .project({ status: 1, 'paymentDetails.status': 1, 'paymentDetails.method': 1, 'pricing.totalAmount': 1 })
            .limit(200)
            .toArray()
        if (unpaidFulfilled.length) {
            report(
                'CRITICAL',
                'orders',
                'fulfilling (confirmed+) without a completed payment',
                unpaidFulfilled.length,
                unpaidFulfilled.map((o) => `${o._id} ${o.status}/${o.paymentDetails?.status ?? 'none'}`),
            )
        }

        // Payment marked completed but no razorpay ids at all
        const completedNoIds = await orders
            .find({
                'paymentDetails.status': 'completed',
                $or: [
                    { 'paymentDetails.razorpayPaymentId': { $exists: false } },
                    { 'paymentDetails.razorpayOrderId': { $exists: false } },
                ],
            })
            .project({ 'paymentDetails': 1 })
            .limit(200)
            .toArray()
        if (completedNoIds.length) {
            report('CRITICAL', 'orders', 'payment completed but a razorpay id is missing', completedNoIds.length, ids(completedNoIds))
        }

        // razorpay method but no razorpayOrderId -> verification cannot be bound later
        const razorpayNoOrderId = await orders
            .find({ 'paymentDetails.method': 'razorpay' })
            .project({ 'paymentDetails': 1, status: 1 })
            .limit(200)
            .toArray()
            .then((rows) => rows.filter((o) => !o.paymentDetails?.razorpayOrderId))
        if (razorpayNoOrderId.length) {
            report('CRITICAL', 'orders', 'razorpay order with no razorpayOrderId stored', razorpayNoOrderId.length, ids(razorpayNoOrderId))
        }

        // Duplicate razorpayOrderId would break the unique sparse index
        const dupRzp = await orders
            .aggregate([
                { $match: { 'paymentDetails.razorpayOrderId': { $exists: true, $ne: null } } },
                { $group: { _id: '$paymentDetails.razorpayOrderId', n: { $sum: 1 } } },
                { $match: { n: { $gt: 1 } } },
            ])
            .toArray()
        if (dupRzp.length) {
            report('CRITICAL', 'orders', 'duplicate razorpayOrderId (blocks unique index)', dupRzp.length, dupRzp.map((d) => `${d._id} x${d.n}`))
        }

        // Cancelled but still marked paid / not refunded
        const cancelledNotRefunded = await orders
            .find({ 'cancellation.isCancelled': true })
            .project({ 'cancellation': 1, 'paymentDetails.status': 1, 'pricing.totalAmount': 1 })
            .limit(200)
            .toArray()
            .then((rows) =>
                rows.filter(
                    (o) =>
                        o.paymentDetails?.status === 'completed' &&
                        !['completed', 'processing', 'pending'].includes(o.cancellation?.refundStatus ?? ''),
                ),
            )
        if (cancelledNotRefunded.length) {
            report('HIGH', 'orders', 'cancelled + paid but refund never initiated', cancelledNotRefunded.length, ids(cancelledNotRefunded))
        }

        // status cancelled without the cancellation block set
        const cancelledNoFlag = await orders
            .find({ status: 'cancelled', 'cancellation.isCancelled': { $ne: true } })
            .project({ status: 1, cancellation: 1 })
            .limit(200)
            .toArray()
        if (cancelledNoFlag.length) {
            report('MEDIUM', 'orders', "status 'cancelled' but cancellation.isCancelled is not true", cancelledNoFlag.length, ids(cancelledNoFlag))
        }

        // pricing arithmetic that does not add up
        const badMath = await orders
            .find({})
            .project({ pricing: 1, _id: 1 })
            .limit(500)
            .toArray()
            .then((rows) =>
                rows.filter((o) => {
                    const p = o.pricing
                    if (!p) return true
                    const expected = Math.max(
                        (p.itemPrice ?? 0) + (p.deliveryFee ?? 0) + (p.platformFee ?? 0) + (p.taxes?.total ?? 0) - (p.discount ?? 0),
                        0,
                    )
                    return Math.abs(expected - (p.totalAmount ?? 0)) > 0.01
                }),
            )
        if (badMath.length) {
            report('MEDIUM', 'orders', 'pricing components do not sum to totalAmount', badMath.length, ids(badMath))
        }

        // items with bad quantity or price
        const badItems = await orders
            .find({ $or: [{ 'items.quantity': { $lt: 1 } }, { 'items.priceAtOrder': { $lt: 0 } }] })
            .project({ items: 1 })
            .limit(200)
            .toArray()
        if (badItems.length) {
            report('MEDIUM', 'orders', 'item with quantity < 1 or negative priceAtOrder', badItems.length, ids(badItems))
        }

        // missing required blocks entirely
        const missingBlocks = await orders
            .find({ $or: [{ pricing: { $exists: false } }, { deliveryAddress: { $exists: false } }, { 'paymentDetails': { $exists: false } }] })
            .project({ _id: 1 })
            .limit(200)
            .toArray()
        if (missingBlocks.length) {
            report('MEDIUM', 'orders', 'order missing pricing/address/paymentDetails', missingBlocks.length, ids(missingBlocks))
        }
    }

    // ---------------------------------------------------------------- tickets
    section('FOODFEST TICKETS')
    const tickets = col('foodfesttickets')
    const ticketTotal = await tickets.countDocuments()
    line('total tickets', ticketTotal)

    if (ticketTotal) {
        const byStatus = await tickets
            .aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }, { $sort: { n: -1 } }])
            .toArray()
        line('by status', byStatus.map((s) => `${s._id ?? 'null'}=${s.n}`).join('  '))

        // The P0: a valid ticket with no razorpayOrderId means it can never be
        // reconciled, and the verify step has nothing to bind against.
        const validNoOrderId = await tickets
            .find({ status: { $in: ['valid', 'used'] } })
            .project({ status: 1, 'paymentDetails.razorpayOrderId': 1, 'paymentDetails.razorpayPaymentId': 1 })
            .limit(200)
            .toArray()
            .then((rows) => rows.filter((t) => !t.paymentDetails?.razorpayOrderId))
        if (validNoOrderId.length) {
            report('CRITICAL', 'foodfest', 'valid/used ticket with no razorpayOrderId (unreconcilable)', validNoOrderId.length, ids(validNoOrderId))
        }

        const pendingWithPayment = await tickets
            .find({ status: 'pending_payment' })
            .project({ status: 1, 'paymentDetails': 1 })
            .limit(200)
            .toArray()
            .then((rows) => rows.filter((t) => t.paymentDetails?.razorpayPaymentId))
        if (pendingWithPayment.length) {
            report('HIGH', 'foodfest', "still pending_payment but has a razorpayPaymentId", pendingWithPayment.length, ids(pendingWithPayment))
        }
    }

    // ---------------------------------------------------------------- tiers
    section('FOODFEST INVENTORY (tier reserved/sold vs tickets)')
    const tiers = col('foodfesttiers')
    const tierTotal = await tiers.countDocuments()
    line('total tiers', tierTotal)

    if (tierTotal) {
        const badTiers = await tiers
            .find({})
            .project({ quantity: 1, sold: 1, reserved: 1, _id: 1 })
            .limit(500)
            .toArray()
            .then((rows) =>
                rows
                    .map((t) => ({
                        id: t._id,
                        bad: [
                            (t.reserved ?? 0) < 0 && 'negative reserved',
                            (t.sold ?? 0) < 0 && 'negative sold',
                            (t.sold ?? 0) + (t.reserved ?? 0) > (t.quantity ?? 0) && 'sold+reserved > quantity',
                        ].filter(Boolean),
                    }))
                    .filter((t) => t.bad.length),
            )
        if (badTiers.length) {
            report('CRITICAL', 'foodfest', 'tier inventory is over-committed or negative', badTiers.length, badTiers.map((t) => `${t.id}: ${t.bad.join('+')}`))
        }

        // Compare tier.reserved against real ticket counts
        const ticketCounts = await tickets
            .aggregate([
                { $match: { status: { $in: ['valid', 'used', 'pending_payment'] } } },
                { $group: { _id: '$tierId', n: { $sum: 1 } } },
            ])
            .toArray()
        const countMap = new Map(ticketCounts.map((t) => [String(t._id), t.n]))
        const drift = []
        for (const t of await tiers.find({}).project({ quantity: 1, sold: 1, reserved: 1, _id: 1 }).limit(500).toArray()) {
            const real = countMap.get(String(t._id))
            if (real === undefined) continue
            const expected = (t.sold ?? 0) + (t.reserved ?? 0)
            if (expected !== real) {
                drift.push(`${t._id}: counters=${expected} actualTickets=${real}`)
            }
        }
        if (drift.length) {
            report('HIGH', 'foodfest', 'tier sold+reserved disagrees with actual ticket count', drift.length, drift)
        }
    }

    // ---------------------------------------------------------------- events
    section('FOODFEST EVENTS')
    const events = col('foodfestevents')
    const eventTotal = await events.countDocuments()
    line('total events', eventTotal)
    if (eventTotal) {
        const soldDrift = await events
            .find({})
            .project({ ticketsSold: 1, _id: 1 })
            .limit(200)
            .toArray()
        if (soldDrift.length) {
            const totalTickets = await tickets.countDocuments({ status: { $in: ['valid', 'used'] } })
            const sumSold = soldDrift.reduce((a, e) => a + (e.ticketsSold ?? 0), 0)
            line('event ticketsSold sum', sumSold)
            line('valid+used tickets', totalTickets)
            if (sumSold !== totalTickets) {
                report('MEDIUM', 'foodfest', 'event.ticketsSold does not match valid+used ticket count', Math.abs(sumSold - totalTickets), [
                    `sumTicketsSold=${sumSold} validUsedTickets=${totalTickets}`,
                ])
            }
        }
    }

    // ---------------------------------------------------------------- carts
    section('CARTS')
    const carts = col('carts')
    const cartTotal = await carts.countDocuments()
    line('total carts', cartTotal)
    if (cartTotal) {
        const badCarts = await carts
            .find({})
            .project({ items: 1, _id: 1 })
            .limit(500)
            .toArray()
            .then((rows) =>
                rows.filter(
                    (c) =>
                        (c.items ?? []).some((i) => (i.quantity ?? 0) < 1) ||
                        (c.items ?? []).length !== new Set((c.items ?? []).map((i) => String(i.foodItem))).size,
                ),
            )
        if (badCarts.length) {
            report('MEDIUM', 'carts', 'cart with quantity < 1 or duplicate foodItem rows', badCarts.length, ids(badCarts))
        }
    }

    // ---------------------------------------------------------------- users
    section('USERS / COUNTERS')
    const users = col('users')
    const userTotal = await users.countDocuments()
    line('total users', userTotal)
    if (userTotal) {
        const totalFollows = await col('follows').countDocuments()
        const sumFollowers = await users
            .find({})
            .project({ followersCount: 1 })
            .limit(2000)
            .toArray()
            .then((rows) => rows.reduce((a, u) => a + (u.followersCount ?? 0), 0))
        line('follow docs', totalFollows)
        line('sum(followersCount)', sumFollowers)
        if (totalFollows && sumFollowers !== totalFollows) {
            report('MEDIUM', 'users', 'followersCount total does not match follow documents', Math.abs(sumFollowers - totalFollows), [
                `follows=${totalFollows} sumFollowersCount=${sumFollowers}`,
            ])
        }
    }

    // ---------------------------------------------------------------- indexes
    section('INDEX COVERAGE (fields the hot queries sort/filter on)')
    const indexReport = []
    // listCollections returns a cursor, not an array — must be drained first.
    const existing = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name))
    for (const name of ['orders', 'users', 'foods', 'reviews', 'carts', 'foodpartners', 'foodfesttickets', 'foodfesttiers']) {
        if (!existing.has(name)) continue
        const idx = await col(name).indexes()
        const names = idx.map((i) => (i.key && Object.keys(i.key).length === 1 && i.key[Object.keys(i.key)[0]] === 1 ? i.name : i.name))
        indexReport.push(`  ${name.padEnd(17)} ${String(idx.length).padStart(2)}: ${names.join(', ')}`)
    }
    if (!indexReport.length) indexReport.push('  (no matching collections found)')
    indexReport.forEach((l) => console.log(l))

    // The schema declares razorpayOrderId unique+sparse, but MongoDB cannot
    // change an existing index's options in place — so a non-unique index that
    // was created earlier silently persists. Verify it is actually enforced.
    const orderIdx = await orders.indexes()
    const rzIdx = orderIdx.find((i) => i.name === 'paymentDetails.razorpayOrderId_1')
    if (rzIdx && rzIdx.unique !== true) {
        report('HIGH', 'indexes', 'orders.razorpayOrderId index is NOT unique in the DB although the schema declares unique', 1, [
            `unique=${rzIdx.unique} sparse=${rzIdx.sparse === true}  (duplicate values would be accepted)`,
        ])
    }

    // A collection with only the _id index means every query on it is a full scan
    for (const name of ['foods', 'users']) {
        if (!existing.has(name)) continue
        const idx = await col(name).indexes()
        if (idx.length <= 1) {
            report('HIGH', 'indexes', `${name} has only the _id index — every query is a collection scan`, 1, [
                `${name}: ${idx.map((i) => i.name).join(', ')}`,
            ])
        }
    }

    // ---------------------------------------------------------------- summary
    section('SUMMARY')
    if (!findings.length) {
        console.log('  No inconsistencies found.')
    } else {
        const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 }
        findings
            .slice()
            .sort((a, b) => order[a.severity] - order[b.severity])
            .forEach((f) => {
                console.log(`  [${f.severity}] ${f.area}: ${f.message}  (${f.count})`)
                f.examples.slice(0, 3).forEach((e) => console.log(`        ${e}`))
            })
        const critical = findings.filter((f) => f.severity === 'CRITICAL').length
        console.log(`\n  ${findings.length} finding(s), ${critical} critical.`)
    }

    console.log('\n  This sweep made no writes.')
}

run()
    .then(async () => {
        await mongoose.disconnect()
    })
    .catch(async (err) => {
        console.error('\nSWEEP FAILED:', err.message)
        await mongoose.disconnect()
        process.exit(1)
    })
