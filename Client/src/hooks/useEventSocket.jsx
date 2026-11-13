import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { SOCKET_URL } from '../config/Api'

/**
 * useEventSocket — join the server's `event:<eventId>` room and hand each push
 * to the matching key of `events` (e.g. `{ 'ticket.sold': fn }`).
 */
export const useEventSocket = ({ eventId, events, enabled = true }) => {
  const handlers = useRef(events)

  // Latest-ref pattern: the socket effect subscribes once, so handlers must be
  // read at dispatch time rather than captured at mount.
  useEffect(() => {
    handlers.current = events
  })

  useEffect(() => {
    if (!enabled || !eventId) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined

    const socket = io(SOCKET_URL, { withCredentials: true })
    const join = () => socket.emit('joinEvent', eventId)
    const onConnect = () => join()
    const pairs = Object.keys(handlers.current || {}).map((name) => [
      name,
      (payload) => handlers.current?.[name]?.(payload),
    ])

    socket.on('connect', onConnect)
    pairs.forEach(([name, fn]) => socket.on(name, fn))

    const onVisibility = () => (document.hidden ? socket.disconnect() : socket.connect())
    document.addEventListener('visibilitychange', onVisibility)
    if (document.hidden) socket.disconnect()

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      socket.off('connect', onConnect)
      pairs.forEach(([name, fn]) => socket.off(name, fn))
      socket.disconnect()
    }
  }, [eventId, enabled])
}
