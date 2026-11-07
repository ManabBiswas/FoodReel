/**
 * Respond 500 without leaking internals.
 */

const safeMessage = (error, fallback) =>
  process.env.NODE_ENV !== 'production' && error?.message
    ? error.message
    : fallback;

/** 500 with the classic `{ error }` shape. */
export function serverError(res, error, fallback = 'Internal server error') {
  console.error(`[500] ${fallback}:`, error?.stack || error);
  res.status(500).json({ error: safeMessage(error, fallback) });
}

/** 500 with the `{ success: false, message }` shape used by foodfest/payment. */
export function serverFail(res, error, fallback = 'Internal server error') {
  console.error(`[500] ${fallback}:`, error?.stack || error);
  res.status(500).json({ success: false, message: safeMessage(error, fallback) });
}
