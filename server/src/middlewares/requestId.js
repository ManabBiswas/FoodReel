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
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6
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

export { requestId, accessLog }
