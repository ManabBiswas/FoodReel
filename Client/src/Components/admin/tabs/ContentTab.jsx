import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../../../config/Api'
import { Megaphone, Trash2 } from 'lucide-react'
import { Spinner, Empty, Pagination } from '../AdminUI'
import { fmtCur } from '../adminConstants'

const ContentTab = ({ navigate, setError, setConfirmAction }) => {
  const [subTab, setSubTab] = useState('food')

  // Food items
  const [foodItems, setFoodItems] = useState([])
  const [foodPag, setFoodPag] = useState({ page: 1, pages: 1, total: 0 })
  const [foodPage, setFoodPage] = useState(1)
  const [foodLoading, setFoodLoading] = useState(false)

  const fetchFood = useCallback(async (pg = 1) => {
    try {
      setFoodLoading(true); setError('')
      const res = await axios.get(`${API_ENDPOINTS.admin.foodItems}?page=${pg}&limit=10`, axiosConfig)
      setFoodItems(res.data.foodItems || [])
      setFoodPag(res.data.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin-login')
      else setError('Failed to load food items')
    } finally { setFoodLoading(false) }
  }, [navigate, setError])

  // Ads
  const [ads, setAds] = useState([])
  const [adsPag, setAdsPag] = useState({ page: 1, pages: 1, total: 0 })
  const [adsPage, setAdsPage] = useState(1)
  const [adsLoading, setAdsLoading] = useState(false)

  const fetchAds = useCallback(async (pg = 1) => {
    try {
      setAdsLoading(true); setError('')
      const res = await axios.get(`${API_ENDPOINTS.admin.advertisements}?page=${pg}&limit=10`, axiosConfig)
      setAds(res.data.advertisements || [])
      setAdsPag(res.data.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin-login')
      else setError('Failed to load advertisements')
    } finally { setAdsLoading(false) }
  }, [navigate, setError])

  useEffect(() => {
    if (subTab === 'food') fetchFood(foodPage)
    else fetchAds(adsPage)
  }, [subTab, foodPage, adsPage, fetchFood, fetchAds])

  const approveFoodItem = async (id, approve) => {
    try {
      await axios.put(API_ENDPOINTS.admin.approveFoodItem(id), { approve }, axiosConfig)
      setFoodItems(prev => prev.map(f => f._id === id ? { ...f, isActive: approve } : f))
    } catch { setError('Failed to update food item') }
  }

  const deleteFoodItem = async (id) => {
    try {
      await axios.delete(API_ENDPOINTS.admin.deleteFoodItem(id), axiosConfig)
      setFoodItems(prev => prev.filter(f => f._id !== id))
    } catch { setError('Failed to delete food item') }
  }

  const approveAd = async (id, approve) => {
    try {
      await axios.put(API_ENDPOINTS.admin.approveAdvertisement(id), { approve }, axiosConfig)
      setAds(prev => prev.map(a => a._id === id ? { ...a, isActive: approve } : a))
    } catch { setError('Failed to update advertisement') }
  }

  const deleteAd = async (id) => {
    try {
      await axios.delete(API_ENDPOINTS.admin.deleteAdvertisement(id), axiosConfig)
      setAds(prev => prev.filter(a => a._id !== id))
    } catch { setError('Failed to delete advertisement') }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 6, background: 'var(--surface)', padding: 6, borderRadius: 12, width: 'fit-content', border: '1px solid var(--border)' }}>
        {['food', 'ads'].map(t => (
          <button key={t} className={`tab-pill ${subTab === t ? 'active' : ''}`} onClick={() => setSubTab(t)}>
            {t === 'food' ? 'Food Items' : 'Advertisements'}
          </button>
        ))}
      </div>

      {subTab === 'food' && (
        <>
          <p style={{ color: 'var(--text3)', fontSize: 12, fontWeight: 600 }}>{foodPag.total} food items</p>
          {foodLoading ? <Spinner /> : foodItems.length === 0 ? <Empty text="No food items" /> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
              {foodItems.map(f => (
                <div key={f._id} className="food-card">
                  {(f.image || f.video) && (
                    <div style={{ width: 76, height: 76, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.04)' }}>
                      {f.video ? <video src={f.video} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                        : <img src={f.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name || 'Untitled'}</p>
                      <span className="pill" style={{ background: f.isActive ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', color: f.isActive ? '#34D399' : '#F87171', flexShrink: 0 }}>
                        {f.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text3)', margin: '0 0 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.foodPartner?.companyName || 'Unknown'} · {f.price ? fmtCur(f.price) : '—'}
                    </p>
                    <div style={{ display: 'flex', gap: 7 }}>
                      <button className={`tab-pill ${f.isActive ? '' : 'active'}`} style={{ padding: '5px 10px', fontSize: 11 }}
                        onClick={() => approveFoodItem(f._id, !f.isActive)}>
                        {f.isActive ? 'Deactivate' : 'Approve'}
                      </button>
                      <button className="btn-icon btn-delete" onClick={() => setConfirmAction({ msg: `Delete "${f.name || 'this item'}"?`, fn: () => deleteFoodItem(f._id) })}>
                        <Trash2 style={{ width: 13, height: 13 }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Pagination page={foodPag.page} pages={foodPag.pages} setPage={setFoodPage} />
        </>
      )}

      {subTab === 'ads' && (
        <>
          <p style={{ color: 'var(--text3)', fontSize: 12, fontWeight: 600 }}>{adsPag.total} advertisements</p>
          {adsLoading ? <Spinner /> : ads.length === 0 ? <Empty text="No advertisements" /> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
              {ads.map(a => (
                <div key={a._id} className="food-card">
                  {a.file && (
                    <div style={{ width: 76, height: 76, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.04)' }}>
                      {a.type === 'video' ? <video src={a.file} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                        : <img src={a.file} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <Megaphone style={{ width: 13, height: 13, color: '#A78BFA', flexShrink: 0 }} />
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name || a.title || 'Ad'}</p>
                      </div>
                      <span className="pill" style={{ background: a.isActive ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', color: a.isActive ? '#34D399' : '#F87171', flexShrink: 0 }}>
                        {a.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text3)', margin: '0 0 12px' }}>{a.partnerId?.companyName || 'Unknown'} · {a.promoType || 'Standard'}</p>
                    <div style={{ display: 'flex', gap: 7 }}>
                      <button className={`tab-pill ${a.isActive ? '' : 'active'}`} style={{ padding: '5px 10px', fontSize: 11 }}
                        onClick={() => approveAd(a._id, !a.isActive)}>
                        {a.isActive ? 'Deactivate' : 'Approve'}
                      </button>
                      <button className="btn-icon btn-delete" onClick={() => setConfirmAction({ msg: 'Delete this ad?', fn: () => deleteAd(a._id) })}>
                        <Trash2 style={{ width: 13, height: 13 }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Pagination page={adsPag.page} pages={adsPag.pages} setPage={setAdsPage} />
        </>
      )}
    </div>
  )
}

export default ContentTab
