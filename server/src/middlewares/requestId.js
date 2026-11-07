import { randomUUID } from 'node:crypto'

/**
 * Attaches a correlation id to every request and logs one structured line when
 * the response finishes.
 *
 * Implemented with Node built-ins only (no logger dependency) so the change
 * stays small. Every later `console.error` in a controller can include
 * `req.id` to tie a failure back to a single request in the logs.
 */
const requestId = (req, res, next) => {
    // Honour an upstream id so a Render/ingress request can be traced across hops
    const incoming = req.get('x-request-id')
    req.id = incoming && /^[\w-]{1,64}$/.test(incoming) ? incoming : randomUUID()
    res.setHeader('X-Request-Id', req.id)
    next()
}

const accessLog = (req, res, next) => {
    const startedAt = process.hrtime.bigint()

    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6   // in ms `1e6` means 10^6
        if (!shouldLogAccess(res.statusCode, durationMs)) return    // Only log faults and slow requests
        const line = {
            id: req.id,
            method: req.method,
            path: req.originalUrl?.split('?')[0],
            status: res.statusCode,
            ms: Math.round(durationMs * 10) / 10,
        }
        // 5xx is a server fault worth alerting on; everything else is noise
        if (res.statusCode >= 500) console.error('request', JSON.stringify(line))
        else console.log('request', JSON.stringify(line))
    })

    next()
}

// Sampling keeps the per-request console.log off the hot path
// Faults and slow requests are always logged, whatever the rate
const sampleRate = () => {
    const configured = Number(process.env.ACCESS_LOG_SAMPLE_RATE)
    if (Number.isFinite(configured) && configured >= 0 && configured <= 1) return configured
    if (process.env.NODE_ENV === 'production') return 0.1
    // `npm test` does not set NODE_ENV, but the test runner marks its children.
    if (process.env.NODE_ENV === 'test' || process.env.NODE_TEST_CONTEXT) return 0
    return 1
}

const shouldLogAccess = (status, durationMs, { sample = Math.random(), rate = sampleRate() } = {}) =>
    status >= 500 || durationMs >= 1000 || sample < rate

export { requestId, accessLog, shouldLogAccess }
