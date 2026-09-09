import { useState, useEffect } from 'react'
const API_URL = import.meta.env.VITE_API_URL;
function BlogList({ isAdmin = false, onEdit, onDelete }) {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    fetchBlogs()
  }, [])

  const fetchBlogs = () => {
    setLoading(true)
    fetch(`${API_URL}/blogs`,{
      headers: {
      'ngrok-skip-browser-warning': 'true'
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.blogs) setBlogs(data.blogs)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  const filteredBlogs = selectedCategory === 'all' 
    ? blogs 
    : blogs.filter(blog => blog.category === selectedCategory)

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <p>Loading articles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="blog-list-wrapper">
      {/* Header Section */}
      <div className="blog-header-section">
        <div className="header-content">
          <div className="header-badge">📚 Knowledge Hub</div>
          <h1 className="header-title">
            Diabetes Education &<br />
            <span className="highlight">Resources</span>
          </h1>
          <p className="header-subtitle">
            Evidence-based articles to help you understand and manage diabetes effectively
          </p>
        </div>
        <div className="header-decoration">
          <div className="decoration-circle"></div>
          <div className="decoration-circle-2"></div>
        </div>
      </div>



      {/* Blog Grid */}
      {filteredBlogs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>No Articles Yet</h3>
          <p>Check back later for educational content.</p>
          {isAdmin && (
            <button className="btn-create">+ Create First Article</button>
          )}
        </div>
      ) : (
        <div className="blog-grid">
          {filteredBlogs.map((blog, index) => (
            <div 
              key={blog.id} 
              className="blog-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Image Placeholder */}
              <div className="blog-image">

                {blog.category && (
                  <span className="blog-category">{blog.category}</span>
                )}
              </div>

              <div className="blog-body">
                <div className="blog-meta">
                  <span className="blog-date">
                    📅 {new Date(blog.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                  <span className="blog-read-time">⏱️ 5 min read</span>
                </div>

                <h3 className="blog-title">{blog.title}</h3>
                <p className="blog-description">{blog.description}</p>

                <div className="blog-footer">
                  <div className="blog-author">
                    <div className="author-avatar">👤</div>
                    <span className="author-name">Diabetes Educator</span>
                  </div>

                  {isAdmin && (
                    <div className="blog-actions">

                      <button 
                        className="btn-delete"
                        onClick={() => onDelete(blog.id)}
                        title="Delete article"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default BlogList