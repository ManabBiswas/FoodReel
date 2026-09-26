// Shared auth-cookie options.

// Frontend (Netlify, https) and backend (Render, https) are cross-site, so browsers only send the auth cookie back if it is SameSite=None; Secure.
// Base this on the FRONTEND_URL scheme instead of NODE_ENV: NODE_ENV is not validated on the host and may be unset, which previously produced SameSite=Lax cookies that browsers silently dropped in production.

export const isCrossSiteDeployment = () =>
    (process.env.FRONTEND_URL || '').startsWith('https://');

export const authCookieOptions = (maxAgeMs = 7 * 24 * 60 * 60 * 1000) => { // 7 days
    const crossSite = isCrossSiteDeployment();
    return {
        httpOnly: true,
        sameSite: crossSite ? 'none' : 'lax', 
        // Ensures cookies are only sent over HTTPS when cross-site.
//  'lax' (default if not cross-site) → Safer, prevents most CSRF attacks but still allows navigation-based requests.

// 'none' (if cross-site deployment) → Required for cookies to be sent in cross-site contexts, but must be paired with secure: true.
        secure: crossSite,
        maxAge: maxAgeMs, // 7 days
        path: '/'   //Makes the cookie available across the entire site
    };
};
