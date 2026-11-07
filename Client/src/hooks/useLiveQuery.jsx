import { useCallback, useEffect, useRef, useState } from 'react'
import axios from 'axios'

/**
 * useLiveQuery — polling that behaves under real-world conditions.
 *
 * - single in-flight request (a slow response never queues a second poll)
 * - aborts on unmount, so no state updates after teardown
 * - pauses while the tab is hidden, so a forgotten dashboard stops hammering
 * - exponential backoff after failures instead of hammering a dead backend
 * - returns `lastUpdated` so the UI can show data freshness
 */
export const useLiveQuery = ({
    fetcher,
    intervalMs = 15000,
    enabled = true,
    pauseWhenHidden = true,
    maxBackoffMs = 120000,
}) => {
    const [data, setData] = useState(null)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(Boolean(enabled))
    const [lastUpdated, setLastUpdated] = useState(null)

    const inFlight = useRef(false)
    const timer = useRef(null)
    const backoff = useRef(intervalMs)
    const mounted = useRef(true)
    const fetcherRef = useRef(fetcher)
    fetcherRef.current = fetcher

    const clear = () => {
        if (timer.current) {
            clearTimeout(timer.current)
            timer.current = null
        }
    }

    const run = useCallback(async ({ isManual = false } = {}) => {
        if (inFlight.current) return
        inFlight.current = true
        if (isManual) setLoading(true)

        try {
            const result = await fetcherRef.current()
            if (!mounted.current) return
            setData(result)
            setError(null)
            setLastUpdated(new Date())
            backoff.current = intervalMs
        } catch (err) {
            if (!mounted.current) return
            setError(err)
            backoff.current = Math.min(backoff.current * 2, maxBackoffMs)
        } finally {
            inFlight.current = false
            if (mounted.current && isManual) setLoading(false)
        }
    }, [intervalMs, maxBackoffMs])

    /* Manual refresh always runs, even while the tab is hidden or paused. */
    const refresh = useCallback(() => run({ isManual: true }), [run])

    /* Schedule the next poll. */
    const schedule = useCallback(() => {
        clear()
        if (!enabled) return
        const delay = error ? backoff.current : intervalMs
        timer.current = setTimeout(async () => {
            await run()
            schedule()
        }, delay)
    }, [enabled, error, intervalMs, run])

    /* Initial load + rescheduling whenever inputs change. */
    useEffect(() => {
        mounted.current = true
        run()
        schedule()
        return () => {
            mounted.current = false
            clear()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, intervalMs])

    /* Pause while the tab is hidden — a background tab should cost nothing. */
    useEffect(() => {
        if (!pauseWhenHidden || typeof document === 'undefined') return

        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                run()
                schedule()
            } else {
                clear()
            }
        }

        document.addEventListener('visibilitychange', onVisibility)
        return () => document.removeEventListener('visibilitychange', onVisibility)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, intervalMs])

    return {
        data,
        error,
        loading,
        lastUpdated,
        refresh,
        isStale: Boolean(error),
    }
}

/** Convenience fetcher for a GET with axiosConfig. */
export const axiosFetcher = (url) => async () => {
    const { axiosConfig } = await import('../config/Api')
    const res = await axios.get(url, axiosConfig)
    return res.data
}
