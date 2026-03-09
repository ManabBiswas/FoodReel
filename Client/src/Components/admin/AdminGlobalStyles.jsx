import { useEffect } from 'react'

const AdminGlobalStyles = () => {
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      :root {
        --bg: #0A0D14;
        --surface: #111520;
        --surface2: #161B2C;
        --border: rgba(99,102,241,0.12);
        --border-hover: rgba(99,102,241,0.3);
        --accent: #6366F1;
        --accent2: #8B5CF6;
        --cyan: #22D3EE;
        --green: #34D399;
        --red: #F87171;
        --amber: #FCD34D;
        --text: #F1F5F9;
        --text2: #94A3B8;
        --text3: #475569;
        --glow: 0 0 30px rgba(99,102,241,0.15);
        --font-display: 'Plus Jakarta Sans', sans-serif;
        --font-body: 'Inter', sans-serif;
      }
      .admin-root * { font-family: var(--font-body); box-sizing: border-box; }
      .admin-root h1, .admin-root h2, .admin-root h3, .admin-root .display { font-family: var(--font-display); }
      .admin-root { background: var(--bg); color: var(--text); min-height: 100vh; }

      .glass { background: rgba(17,21,32,0.8); backdrop-filter: blur(20px); border: 1px solid var(--border); }
      .glass-hover:hover { border-color: var(--border-hover); box-shadow: var(--glow); }

      .nav-item { cursor: pointer; transition: all 0.2s ease; position: relative; }
      .nav-item.active::before {
        content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
        width: 3px; height: 60%; background: var(--accent); border-radius: 0 4px 4px 0;
      }
      .nav-item:hover { background: rgba(99,102,241,0.08); }
      .nav-item.active { background: rgba(99,102,241,0.12); color: #A5B4FC; }

      .stat-card {
        background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
        padding: 20px; cursor: default; transition: all 0.3s ease; position: relative; overflow: hidden;
      }
      .stat-card::after {
        content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
        background: linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent);
        opacity: 0; transition: opacity 0.3s;
      }
      .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.3), var(--glow); border-color: var(--border-hover); }
      .stat-card:hover::after { opacity: 1; }

      .btn-primary {
        cursor: pointer; background: linear-gradient(135deg, var(--accent), var(--accent2));
        color: white; border: none; border-radius: 10px; font-family: var(--font-body);
        font-weight: 600; transition: all 0.2s ease; box-shadow: 0 4px 15px rgba(99,102,241,0.3);
      }
      .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.45); }

      .btn-icon { cursor: pointer; border-radius: 8px; padding: 7px; transition: all 0.2s ease; border: 1px solid transparent; }
      .btn-icon:hover { transform: scale(1.05); }
      .btn-block { background: rgba(251,146,60,0.1); color: #FB923C; }
      .btn-block:hover { background: rgba(251,146,60,0.2); border-color: rgba(251,146,60,0.3); }
      .btn-unblock { background: rgba(52,211,153,0.1); color: #34D399; }
      .btn-unblock:hover { background: rgba(52,211,153,0.2); border-color: rgba(52,211,153,0.3); }
      .btn-verify { background: rgba(34,211,238,0.1); color: #22D3EE; }
      .btn-verify:hover { background: rgba(34,211,238,0.2); border-color: rgba(34,211,238,0.3); }
      .btn-revoke { background: rgba(251,191,36,0.1); color: #FBBF24; }
      .btn-revoke:hover { background: rgba(251,191,36,0.2); border-color: rgba(251,191,36,0.3); }
      .btn-delete { background: rgba(248,113,113,0.1); color: #F87171; }
      .btn-delete:hover { background: rgba(248,113,113,0.2); border-color: rgba(248,113,113,0.3); }

      .row-item { transition: background 0.15s ease; cursor: default; }
      .row-item:hover { background: rgba(99,102,241,0.04); }

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
      .search-box:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
      .search-box input {
        background: transparent; border: none; outline: none; color: var(--text);
        font-family: var(--font-body); font-size: 13px; flex: 1;
      }
      .search-box input::placeholder { color: var(--text3); }

      .tab-pill { cursor: pointer; padding: 6px 16px; border-radius: 8px; font-size: 12px; font-weight: 600; transition: all 0.2s; color: var(--text2); }
      .tab-pill.active { background: var(--accent); color: white; box-shadow: 0 4px 12px rgba(99,102,241,0.35); }
      .tab-pill:not(.active):hover { background: rgba(99,102,241,0.1); color: var(--text); }

      .status-filter { cursor: pointer; padding: 5px 12px; border-radius: 7px; font-size: 11px; font-weight: 700; text-transform: capitalize; transition: all 0.2s; color: var(--text2); border: 1px solid transparent; }
      .status-filter.active { background: var(--accent); color: white; border-color: rgba(99,102,241,0.4); }
      .status-filter:not(.active):hover { background: rgba(255,255,255,0.05); color: var(--text); }

      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes pulse-glow { 0%,100% { box-shadow: 0 0 8px rgba(99,102,241,0.3); } 50% { box-shadow: 0 0 20px rgba(99,102,241,0.6); } }
      .anim-fade { animation: fadeIn 0.35s ease both; }
      .anim-pulse { animation: pulse-glow 2s infinite; }

      .sidebar-logo-ring {
        width: 44px; height: 44px; border-radius: 12px;
        background: linear-gradient(135deg, #6366F1, #8B5CF6);
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 15px rgba(99,102,241,0.4);
        animation: pulse-glow 3s infinite;
      }
      .revenue-banner {
        background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%);
        border: 1px solid rgba(139,92,246,0.3); border-radius: 20px;
        position: relative; overflow: hidden; padding: 28px 32px;
      }
      .revenue-banner::before {
        content: ''; position: absolute; top: -60px; right: -60px;
        width: 200px; height: 200px; border-radius: 50%;
        background: rgba(139,92,246,0.2); pointer-events: none;
      }
      .revenue-banner::after {
        content: ''; position: absolute; bottom: -40px; left: 30%;
        width: 120px; height: 120px; border-radius: 50%;
        background: rgba(99,102,241,0.15); pointer-events: none;
      }

      .chart-container { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 20px; }
      .chart-title { font-family: var(--font-display); font-size: 13px; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }

      .confirm-overlay { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); }
      .confirm-box { background: #161B2C; border: 1px solid rgba(248,113,113,0.2); border-radius: 20px; padding: 28px; max-width: 380px; width: 100%; margin: 16px; box-shadow: 0 24px 60px rgba(0,0,0,0.6); animation: fadeIn 0.2s ease; }

      .main-content { margin-left: 260px; min-height: 100vh; }
      @media (max-width: 1023px) { .main-content { margin-left: 0; } }

      .header-bar { background: rgba(10,13,20,0.85); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); padding: 14px 32px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 20; }

      .pagination-btn { cursor: pointer; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: var(--surface); border: 1px solid var(--border); color: var(--text2); transition: all 0.2s; }
      .pagination-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
      .pagination-btn:disabled { opacity: 0.3; cursor: not-allowed; }
      .pagination-num { cursor: pointer; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; transition: all 0.2s; color: var(--text2); }
      .pagination-num.active { background: var(--accent); color: white; box-shadow: 0 4px 12px rgba(99,102,241,0.35); }
      .pagination-num:not(.active):hover { background: rgba(99,102,241,0.1); color: var(--text); }

      .admin-root ::-webkit-scrollbar { width: 6px; height: 6px; }
      .admin-root ::-webkit-scrollbar-track { background: transparent; }
      .admin-root ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 3px; }
      .admin-root ::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.5); }

      .food-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 16px; display: flex; gap: 14px; transition: all 0.25s; cursor: default; }
      .food-card:hover { border-color: var(--border-hover); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,0,0,0.25); }

      .review-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 18px; transition: all 0.25s; cursor: default; }
      .review-card:hover { border-color: var(--border-hover); }

      .quick-action { cursor: pointer; border-radius: 16px; padding: 20px; text-align: left; border: 1px solid transparent; transition: all 0.3s ease; }
      .quick-action:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,0.3); }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])
  return null
}

export default AdminGlobalStyles
