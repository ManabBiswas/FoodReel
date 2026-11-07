import { useEffect, useState } from 'react'

/**
 * One shared clock per page. Components that need "time remaining" read this
 * value instead of starting a timer each, so a ticket list with ten pending
 * holds still runs a single interval.
 */
export const useNow = (intervalMs = 30000) => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
