import { useEffect } from 'react'

const AdminGlobalStyles = () => {
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
  // Warm editorial theme — mirrors src/index.css tokens (brand palette).
      :root {
        --bg: #f8f7f5;
        --surface: #ffffff;
        --surface2: #f3f1ed;
        --border: #e8e4de;
        --border-hover: #d4cfc7;
        --accent: #ff6a00;
        --accent2: #ffb800;
        --cyan: #ff8533;
        --green: #16a34a;
        --red: #dc2626;
        --amber: #ffb800;
        --text: #1a1208;
        --text2: #6b6460;
        --text3: #9e9890;
        --glow: 0 0 30px rgba(255,106,0,0.12);
        --font-display: 'Fraunces', Georgia, serif;
        --font-body: 'DM Sans', -apple-system, sans-serif;
        /* Motion — custom curves (built-in easings feel weak). All UI motion
           stays transform/opacity-only, under 300ms, ease-out for anything
           that responds to the user. */
        --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
        --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
      }
      .admin-root * { font-family: var(--font-body); box-sizing: border-box; }
      .admin-root h1, .admin-root h2, .admin-root h3, .admin-root .display { font-family: var(--font-display); }
      .admin-root { background: var(--bg); color: var(--text); min-height: 100vh; overflow-x: hidden; }

      .glass { background: rgba(255,255,255,0.85); backdrop-filter: blur(20px); border: 1px solid var(--border); }
      .glass-hover:hover { border-color: var(--border-hover); box-shadow: var(--glow); }

      .nav-item { cursor: pointer; position: relative; transition: background-color 180ms var(--ease-out), color 180ms var(--ease-out), transform 160ms var(--ease-out); }
      .nav-item.active::before {
        content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
        width: 3px; height: 60%; background: var(--accent); border-radius: 0 4px 4px 0;
      }
      .nav-item:active { transform: scale(0.98); }
      .nav-item.active { background: linear-gradient(135deg, rgba(255,106,0,0.11), rgba(255,184,0,0.06)); color: #e55a00; }
      @media (hover: hover) and (pointer: fine) {
        .nav-item:hover { background: rgba(255,106,0,0.05); }
      }

      .stat-card {
        background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
        padding: 20px; cursor: default; transition: transform 250ms var(--ease-out), box-shadow 250ms var(--ease-out), border-color 250ms var(--ease-out); position: relative; overflow: hidden;
      }
      .stat-card::after {
        content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255,106,0,0.5), transparent);
        opacity: 0; transition: opacity 250ms var(--ease-out);
      }
      @media (hover: hover) and (pointer: fine) {
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(26,18,8,0.12), var(--glow); border-color: var(--border-hover); }
      }
      .stat-card:hover::after { opacity: 1; }

      .btn-primary {
        cursor: pointer; background: linear-gradient(135deg, #ff6a00, #e55a00);
        color: white; border: none; border-radius: 10px; font-family: var(--font-body);
        font-weight: 600; transition: transform 160ms var(--ease-out), box-shadow 180ms var(--ease-out); box-shadow: 0 4px 15px rgba(255,106,0,0.3);
      }
      .btn-primary:active { transform: scale(0.97); }
      @media (hover: hover) and (pointer: fine) {
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(255,106,0,0.45); }
      }

      .btn-icon { cursor: pointer; border-radius: 8px; padding: 7px; transition: transform 160ms var(--ease-out), background-color 160ms var(--ease-out), border-color 160ms var(--ease-out); border: 1px solid transparent; }
      .btn-icon:active { transform: scale(0.95); }
      @media (hover: hover) and (pointer: fine) {
        .btn-icon:hover { transform: scale(1.05); }
      }
      .btn-block { background: rgba(255,106,0,0.1); color: #e55a00; }
      .btn-block:hover { background: rgba(255,106,0,0.18); border-color: rgba(255,106,0,0.3); }
      .btn-unblock { background: rgba(22,163,74,0.1); color: #16a34a; }
      .btn-unblock:hover { background: rgba(22,163,74,0.18); border-color: rgba(22,163,74,0.3); }
      .btn-verify { background: rgba(255,106,0,0.1); color: #e55a00; }
      .btn-verify:hover { background: rgba(255,106,0,0.18); border-color: rgba(255,106,0,0.3); }
      .btn-revoke { background: rgba(255,184,0,0.14); color: #b45309; }
      .btn-revoke:hover { background: rgba(255,184,0,0.24); border-color: rgba(255,184,0,0.35); }
      .btn-delete { background: rgba(220,38,38,0.08); color: #dc2626; }
      .btn-delete:hover { background: rgba(220,38,38,0.16); border-color: rgba(220,38,38,0.3); }

      .row-item { transition: background 0.15s ease; cursor: default; }
      .row-item:hover { background: rgba(255,106,0,0.04); }

      .card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; transition: all 0.3s ease; }
      .card:hover { border-color: var(--border-hover); }

      .pill {
        display: inline-flex; align-items: center; gap: 5px;
        font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px;
      }
      .search-box {
        background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
        display: flex; align-items: center; gap: 10px; padding: 10px 16px; transition: border-color 0.2s;
      }
      .search-box:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(255,106,0,0.12); }
      .search-box input {
        background: transparent; border: none; outline: none; color: var(--text);
        font-family: var(--font-body); font-size: 13px; flex: 1;
      }
      .search-box input::placeholder { color: var(--text3); }

      .tab-pill { cursor: pointer; padding: 6px 16px; border-radius: 8px; font-size: 12px; font-weight: 600; transition: background-color 180ms var(--ease-out), color 180ms var(--ease-out), box-shadow 180ms var(--ease-out), transform 160ms var(--ease-out); color: var(--text2); }
      .tab-pill:active { transform: scale(0.97); }
      .tab-pill.active { background: linear-gradient(135deg, #ff6a00, #e55a00); color: white; box-shadow: inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 14px rgba(255,106,0,0.35); }
      @media (hover: hover) and (pointer: fine) {
        .tab-pill:not(.active):hover { background: rgba(255,106,0,0.06); color: var(--text); }
      }

      .status-filter { cursor: pointer; padding: 5px 12px; border-radius: 7px; font-size: 11px; font-weight: 700; text-transform: capitalize; transition: background-color 180ms var(--ease-out), color 180ms var(--ease-out), box-shadow 180ms var(--ease-out), transform 160ms var(--ease-out); color: var(--text2); border: 1px solid transparent; }
      .status-filter:active { transform: scale(0.97); }
      .status-filter.active { background: linear-gradient(135deg, #ff6a00, #e55a00); color: white; border-color: transparent; box-shadow: inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 14px rgba(255,106,0,0.35); }
      @media (hover: hover) and (pointer: fine) {
        .status-filter:not(.active):hover { background: rgba(255,106,0,0.05); color: var(--text); }
      }

      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes pulse-glow { 0%,100% { box-shadow: 0 0 8px rgba(255,106,0,0.3); } 50% { box-shadow: 0 0 20px rgba(255,106,0,0.6); } }
      .anim-fade { animation: fadeIn 0.35s ease both; }
      .anim-pulse { animation: pulse-glow 2s infinite; }

      .sidebar-logo-ring {
        width: 44px; height: 44px; border-radius: 12px;
        background: linear-gradient(135deg, #ff6a00, #ffb800);
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 15px rgba(255,106,0,0.4);
        animation: pulse-glow 3s infinite;
      }
      .revenue-banner {
        background: linear-gradient(135deg, #1a1208 0%, #3a2a12 55%, #e55a00 100%);
        border: 1px solid rgba(255,184,0,0.35); border-radius: 20px;
        position: relative; overflow: hidden; padding: 28px 32px;
      }
      .revenue-banner::before {
        content: ''; position: absolute; top: -60px; right: -60px;
        width: 200px; height: 200px; border-radius: 50%;
        background: rgba(255,184,0,0.18); pointer-events: none;
      }
      .revenue-banner::after {
        content: ''; position: absolute; bottom: -40px; left: 30%;
        width: 120px; height: 120px; border-radius: 50%;
        background: rgba(255,106,0,0.15); pointer-events: none;
      }
      /* Diagonal shine — sweeps once, then rests. Decorative, slow, and
         transform-only so it never triggers layout. */
      .revenue-shine {
        position: absolute; top: -20%; bottom: -20%; left: 0; width: 38%;
        background: linear-gradient(100deg, transparent, rgba(255,255,255,0.14), transparent);
        transform: translateX(-160%) skewX(-18deg);
        animation: revenue-shine 5.5s var(--ease-in-out) infinite;
        pointer-events: none; will-change: transform;
      }
      @keyframes revenue-shine {
        0% { transform: translateX(-160%) skewX(-18deg); }
        32% { transform: translateX(420%) skewX(-18deg); }
        100% { transform: translateX(420%) skewX(-18deg); }
      }

      .chart-container { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 20px; }
      .chart-title { font-family: var(--font-display); font-size: 13px; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }

      .confirm-overlay { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; background: rgba(26,18,8,0.55); backdrop-filter: blur(8px); }
      .confirm-box { background: #ffffff; border: 1px solid rgba(220,38,38,0.25); border-radius: 20px; padding: 28px; max-width: 380px; width: 100%; margin: 16px; box-shadow: 0 24px 60px rgba(26,18,8,0.25); animation: fadeIn 0.2s ease; }

      .main-content { margin-left: 260px; min-height: 100vh; }
      @media (max-width: 1023px) { .main-content { margin-left: 0; } }

      .header-bar { background: rgba(255,255,255,0.85); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); padding: 14px 32px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 20; }

      .pagination-btn { cursor: pointer; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: var(--surface); border: 1px solid var(--border); color: var(--text2); transition: border-color 160ms var(--ease-out), color 160ms var(--ease-out), transform 160ms var(--ease-out); }
      .pagination-btn:active:not(:disabled) { transform: scale(0.95); }
      .pagination-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
      .pagination-btn:disabled { opacity: 0.3; cursor: not-allowed; }
      .pagination-num { cursor: pointer; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; transition: background-color 180ms var(--ease-out), color 180ms var(--ease-out), box-shadow 180ms var(--ease-out), transform 160ms var(--ease-out); color: var(--text2); }
      .pagination-num:active { transform: scale(0.95); }
      .pagination-num.active { background: linear-gradient(135deg, #ff6a00, #e55a00); color: white; box-shadow: inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 14px rgba(255,106,0,0.35); }
      .pagination-num:not(.active):hover { background: rgba(255,106,0,0.06); color: var(--text); }

      .admin-root ::-webkit-scrollbar { width: 6px; height: 6px; }
      .admin-root ::-webkit-scrollbar-track { background: transparent; }
      .admin-root ::-webkit-scrollbar-thumb { background: rgba(255,106,0,0.3); border-radius: 3px; }
      .admin-root ::-webkit-scrollbar-thumb:hover { background: rgba(255,106,0,0.5); }

      .food-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 16px; display: flex; gap: 14px; transition: all 0.25s; cursor: default; }
      .food-card:hover { border-color: var(--border-hover); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(26,18,8,0.12); }

      .review-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 18px; transition: all 0.25s; cursor: default; }
      .review-card:hover { border-color: var(--border-hover); }

      .quick-action { cursor: pointer; border-radius: 16px; padding: 18px; text-align: left; background: var(--surface); border: 1px solid var(--border); transition: transform 200ms var(--ease-out), box-shadow 200ms var(--ease-out), border-color 200ms var(--ease-out); animation: fadeIn 0.35s var(--ease-out) both; }
      .quick-action:active { transform: scale(0.98); }
      .quick-action .quick-action-arrow { transition: transform 180ms var(--ease-out); }
      .quick-action .quick-action-chip { transition: transform 200ms var(--ease-out), background-color 200ms var(--ease-out); }
      .quick-action:nth-child(1) { animation-delay: 0ms; }
      .quick-action:nth-child(2) { animation-delay: 50ms; }
      .quick-action:nth-child(3) { animation-delay: 100ms; }
      .quick-action:nth-child(4) { animation-delay: 150ms; }
      @media (hover: hover) and (pointer: fine) {
        .quick-action:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(26,18,8,0.12); border-color: var(--border-hover); }
        .quick-action:hover .quick-action-arrow { transform: translateX(3px); }
        .quick-action:hover .quick-action-chip { transform: scale(1.06); }
      }

      /* ══════════════════════════════════════════════════════
         LIVE DASHBOARD
      ══════════════════════════════════════════════════════ */
      @keyframes live-breathe { 0%,100% { opacity: 1; box-shadow: 0 0 0 0 currentColor; } 50% { opacity: 0.65; box-shadow: 0 0 0 4px rgba(22,163,74,0.12); } }
      @keyframes slide-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

      .live-toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
      .live-pill {
        display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
        padding: 5px 12px; border-radius: 999px; font-size: 11px; font-weight: 800;
        letter-spacing: 0.06em; text-transform: uppercase; transition: all 0.25s;
        border: 1px solid transparent; font-family: var(--font-body);
      }
      .live-pill.on { color: #16a34a; background: rgba(22,163,74,0.12); border-color: rgba(22,163,74,0.3); }
      .live-pill.on svg { animation: live-breathe 2s ease-in-out infinite; }
      .live-pill.off { color: var(--text3); background: rgba(26,18,8,0.04); border-color: var(--border); }
      .live-pill:hover { filter: brightness(0.97); }

      .live-icon-btn {
        width: 30px; height: 30px; border-radius: 9px; display: flex; align-items: center; justify-content: center;
        background: var(--surface); border: 1px solid var(--border); color: var(--text2);
        cursor: pointer; transition: all 0.2s; flex-shrink: 0;
      }
      .live-icon-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
      .live-icon-btn:disabled { opacity: 0.5; cursor: wait; }

      .live-updated { font-size: 11px; color: var(--text3); font-weight: 600; }

      .live-warn {
        display: flex; align-items: center; gap: 9px; padding: 11px 14px; border-radius: 12px;
        background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.28);
        color: #dc2626; font-size: 12px; font-weight: 600; animation: slide-in 0.3s ease both;
      }

      .live-stat {
        position: relative; overflow: hidden; padding: 16px 18px; border-radius: 16px;
        background: var(--surface); border: 1px solid var(--border);
        transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        animation: fadeIn 0.35s ease both;
      }
      .live-stat:hover { transform: translateY(-2px); border-color: var(--stat-color); box-shadow: 0 10px 30px rgba(26,18,8,0.12); }
      .live-stat-glow {
        position: absolute; top: -40px; right: -40px; width: 120px; height: 120px; border-radius: 50%;
        background: var(--stat-bg); filter: blur(28px); pointer-events: none; opacity: 0.85;
      }
      .live-stat-top { display: flex; align-items: center; justify-content: space-between; position: relative; }
      .live-stat-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text3); }
      .live-stat-icon { color: var(--stat-color); display: flex; }
      .live-stat-value {
        position: relative; font-family: var(--font-display); font-size: 30px; font-weight: 900;
        color: var(--text); margin: 8px 0 0; letter-spacing: -0.02em; line-height: 1.1;
      }
      .live-stat-sub { position: relative; font-size: 11px; color: var(--text3); margin: 5px 0 0; }

      .live-delta { font-weight: 700; font-size: 11px; }
      .live-delta.up { color: #16a34a; }
      .live-delta.down { color: #dc2626; }
      .live-delta.neutral { color: var(--text3); }

      .live-feed-item { display: flex; align-items: center; gap: 11px; padding: 11px 0; border-bottom: 1px solid rgba(26,18,8,0.06); animation: slide-in 0.3s ease both; }
      .live-feed-item:last-child { border-bottom: none; }
      .live-feed-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; animation: live-breathe 2.4s ease-in-out infinite; }

      .range-switch { display: inline-flex; gap: 3px; padding: 3px; border-radius: 10px; background: rgba(26,18,8,0.04); border: 1px solid var(--border); }
      .range-switch button {
        padding: 5px 12px; border-radius: 8px; border: none; background: transparent;
        color: var(--text3); font-size: 11px; font-weight: 700; cursor: pointer;
        font-family: var(--font-body); transition: background-color 180ms var(--ease-out), color 180ms var(--ease-out), box-shadow 180ms var(--ease-out), transform 160ms var(--ease-out);
      }
      .range-switch button:active { transform: scale(0.96); }
      .range-switch button:hover { color: var(--text); }
      .range-switch button.active { background: linear-gradient(135deg, #ff6a00, #e55a00); color: white; box-shadow: inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 14px rgba(255,106,0,0.35); }

      .pipeline { padding: 0 18px 16px; display: flex; flex-direction: column; gap: 11px; }
      .pipeline-row { display: grid; grid-template-columns: 120px 1fr 54px 88px; align-items: center; gap: 12px; }
      .pipeline-label { display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 600; color: var(--text2); }
      .pipeline-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
      .pipeline-track { height: 7px; border-radius: 999px; background: rgba(26,18,8,0.06); overflow: hidden; }
      .pipeline-fill { display: block; height: 100%; border-radius: 999px; transition: width 0.6s cubic-bezier(0.22,1,0.36,1); }
      .pipeline-count { font-size: 12px; font-weight: 800; color: var(--text); text-align: right; font-family: var(--font-display); }
      .pipeline-rev { font-size: 11px; font-weight: 600; color: var(--text3); text-align: right; }

      @media (max-width: 900px) {
        .live-split { grid-template-columns: 1fr !important; }
        .pipeline-row { grid-template-columns: 96px 1fr 46px; }
        .pipeline-rev { display: none; }
      }

      /* ══════════════════════════════════════════════════════
         RESPONSIVE — admin shell
         Mobile-first tightening. Sidebar hides below 1024px and
         slides in via the hamburger; content never overflows.
      ══════════════════════════════════════════════════════ */
      .admin-sidebar {
        position: fixed; left: 0; top: 0; height: 100%; width: 260px;
        background: var(--surface); border-right: 1px solid var(--border);
        z-index: 40; display: flex; flex-direction: column;
        transition: transform 250ms var(--ease-out);
      }
      .admin-content { padding: 28px 32px; max-width: 1400px; margin: 0 auto; }

      @media (max-width: 1023px) {
        .admin-sidebar { transform: translateX(-102%); }
        .admin-sidebar.open { transform: translateX(0); }
      }
      @media (max-width: 768px) {
        .header-bar { padding: 12px 16px; }
        .admin-content { padding: 16px; }
        .revenue-banner { padding: 20px 18px; }
        .stat-card { padding: 16px; }
        .quick-action { padding: 16px; }
        .chart-container { padding: 16px; }
        .range-switch { max-width: 100%; overflow-x: auto; }
        .status-filter { padding: 6px 10px; font-size: 10px; }
        .row-item { flex-wrap: wrap; }
        .live-stat-value { font-size: 26px; }
      }
      @media (max-width: 480px) {
        .admin-sidebar { width: 84vw; }
        .admin-content { padding: 14px; }
        .header-bar h2 { font-size: 16px !important; }
        .live-split { grid-template-columns: 1fr !important; }
      }
      /* Touch targets — filters/pills grow to comfortable tap size on coarse pointers */
      @media (pointer: coarse) {
        .status-filter { padding: 9px 13px; }
        .range-switch button { padding: 9px 14px; }
        .tab-pill { padding: 9px 16px; }
        .pagination-btn, .pagination-num { width: 40px; height: 40px; }
        .btn-icon { padding: 10px; }
      }

      /* ══════════════════════════════════════════════════════
         REDUCED MOTION — calm, not zero. Opacity/color stay for
         comprehension; travel/scale goes.
      ══════════════════════════════════════════════════════ */
      @media (prefers-reduced-motion: reduce) {
        .anim-fade, .anim-pulse, .sidebar-logo-ring, .live-pill.on svg,
        .live-feed-dot, .live-warn, .live-feed-item, .revenue-shine { animation: none !important; }
        .admin-root *, .admin-root *::before, .admin-root *::after {
          transition-duration: 0.01ms !important;
        }
        .btn-primary:active, .btn-icon:active, .tab-pill:active,
        .status-filter:active, .range-switch button:active,
        .nav-item:active, .pagination-btn:active, .pagination-num:active {
          transform: none;
        }
      }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])
  return null
}

export default AdminGlobalStyles
