import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL;

function BlogCreate({ onSuccess }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!title || !description) {
      setMessage('⚠️ Title and description are required')
      return
    }

    setLoading(true)
    setMessage('')

    const params = new URLSearchParams({
      title: title,
      description: description
    })

    fetch(`${API_URL}/blogs?${params}`, {
      method: 'POST',
      headers: {"ngrok-skip-browser-warning": "true", 'role': 'admin' }
    })
    .then(res => res.json())
    .then(data => {
      setLoading(false)
      if (data.error) {
        setMessage('❌ ' + data.error)
      } else {
        setMessage('✅ Blog created successfully!')
        setTitle('')
        setDescription('')
        if (onSuccess) onSuccess()
      }
    })
    .catch(() => {
      setLoading(false)
      setMessage('❌ Something went wrong')
    })
  }

  return (
    <div className="blog-create-container">
      <h2>✍️ Create New Article</h2>
      <p className="subtitle">Share educational content with patients</p>

      <form onSubmit={handleSubmit} className="blog-form">
        <div className="form-group">
          <label>Title *</label>
          <input
            type="text"
            className="input"
            placeholder="Enter article title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Description *</label>
          <textarea
            className="input"
            rows="6"
            placeholder="Write your article description here..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <button 
          type="submit" 
          className="btn btn-primary btn-block"
          disabled={loading}
        >
          {loading ? 'Creating...' : '📝 Create Article'}
        </button>
      </form>
    </div>
  )
}

export default BlogCreate