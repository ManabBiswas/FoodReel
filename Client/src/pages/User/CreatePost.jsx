import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { API_ENDPOINTS, multipartConfig } from '../../config/Api'
import Navbar from '../../Components/Navbar'
import ErrorBoundary from '../../Components/ErrorBoundary'
import { Upload, Image as ImageIcon, Video, X, Plus, Loader2 } from 'lucide-react'

const CreatePost = () => {
  const navigate = useNavigate()
  const [type, setType] = useState('image')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (t) => setTags(prev => prev.filter(x => x !== t))

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    const isImage = f.type.startsWith('image/')
    const isVideo = f.type.startsWith('video/')
    if (type === 'image' && !isImage) return setMessage('Please select an image file')
    if (type === 'video' && !isVideo) return setMessage('Please select a video file')
    if (f.size > 5 * 1024 * 1024) return setMessage('File must be less than 5MB')
    setFile(f)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result)
    reader.readAsDataURL(f)
    setMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    if (!name.trim()) { setMessage('Name required'); setLoading(false); return }
    if (!description.trim()) { setMessage('Description required'); setLoading(false); return }
    if (!file) { setMessage('Please select a file'); setLoading(false); return }

    try {
      const fd = new FormData()
      fd.append('name', name)
      fd.append('description', description)
      fd.append('type', type)
      fd.append('tags', JSON.stringify(tags))
      fd.append('file', file)

      const res = await axios.post(API_ENDPOINTS.food.createUserPost, fd, multipartConfig)
      if (res?.data) {
        setMessage('Post created successfully')
        setTimeout(() => navigate('/reels'), 1200)
      }
    } catch (err) {
      console.error(err)
      setMessage(err?.response?.data?.error || err.message || 'Failed to create post')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-semibold mb-4">Create a Post</h1>
        {message && <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded">{message}</div>}
        <ErrorBoundary>
          <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
            <div>
              <label className="block text-sm font-medium mb-1">Content Type</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setType('image')} className={`px-3 py-2 rounded border ${type==='image'?'bg-blue-50 border-blue-200':'border-gray-200'}`}><ImageIcon className="inline w-4 h-4 mr-2"/>Image</button>
                <button type="button" onClick={() => setType('video')} className={`px-3 py-2 rounded border ${type==='video'?'bg-red-50 border-red-200':'border-gray-200'}`}><Video className="inline w-4 h-4 mr-2"/>Video</button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input value={name} onChange={e=>setName(e.target.value)} className="w-full px-3 py-2 border rounded" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea value={description} onChange={e=>setDescription(e.target.value)} className="w-full px-3 py-2 border rounded" rows={4} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">File</label>
              {!preview ? (
                <div className="border-2 border-dashed p-6 text-center rounded">
                  <input id="file-input" type="file" accept={type==='image'? 'image/*' : 'video/*'} onChange={handleFileChange} className="hidden" />
                  <label htmlFor="file-input" className="cursor-pointer">
                    <Upload className="mx-auto w-10 h-10 text-gray-400" />
                    <div className="mt-2 text-gray-600">Click to upload {type}</div>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  {type==='image' ? <img src={preview} alt="preview" className="w-full rounded"/> : <video src={preview} controls className="w-full rounded"/>}
                  <button type="button" onClick={()=>{setFile(null); setPreview(null)}} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><X className="w-4 h-4"/></button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tags (optional)</label>
              <div className="flex gap-2 mb-2">
                <input value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyPress={e=> e.key==='Enter' && (e.preventDefault(), addTag())} className="flex-1 px-3 py-2 border rounded" />
                <button type="button" onClick={addTag} className="px-3 py-2 bg-blue-500 text-white rounded"><Plus className="w-4 h-4"/></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((t,i)=>(<span key={i} className="px-2 py-1 bg-blue-100 rounded">{t} <button type="button" onClick={()=>removeTag(t)} className="ml-2 text-blue-600">x</button></span>))}
              </div>
            </div>

            <div>
              <button type="submit" disabled={loading} className="w-full py-3 bg-green-500 text-white rounded">
                {loading ? (<><Loader2 className="animate-spin inline w-4 h-4 mr-2"/> Creating...</>) : 'Create Post'}
              </button>
            </div>
          </form>
        </ErrorBoundary>
      </div>
    </div>
  )
}

export default CreatePost
