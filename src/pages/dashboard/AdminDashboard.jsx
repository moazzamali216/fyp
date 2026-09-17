import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Profile from '../commons/Profile'
import Admin_Predict_Create from '../views/Admin_Predict_Create'
import Admin_Predict from '../views/Admin_Predict'
import Admin_Users from '../views/Admin_Users'
import Admin_Predictions from '../views/Admin_Predictions'
import Admin_Dashboard_Stats from '../views/Admin_Dashboard_Stats'
import BlogList from '../commons/BlogList'
import Admin_Blogs_Create from '../views/Admin_Blogs_Create'
import Data_Dashboard from '../DL/Data_Dashboard'


// ✅ This is correct for YOUR setup (React + Vite)
const API_URL = import.meta.env.VITE_API_URL;
function AdminDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      navigate('/login')
    } else {
      setUser(JSON.parse(userData))
    }
  }, [navigate])


  // Add edit and delete handlers
  const handleEditBlog = (blog) => {
    // For now, just show alert - you can implement edit modal
    alert('Edit blog: ' + blog.title)
  }

  const handleDeleteBlog = (blogId) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return

    fetch(`${API_URL}/blogs/${blogId}`, {
      method: 'DELETE',
      headers: { 'role': 'admin' }
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert('Error: ' + data.error)
        } else {
          alert('Blog deleted successfully!')
          // Refresh blog list
          window.location.reload()
        }
      })
  }

  if (!user) return (
    <div className="flex-center" style={{ minHeight: '100vh' }}>
      <div className="spinner"></div>
    </div>
  )

  return (
    <div className="dashboard-container">


      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <button
            className={`sidebar-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="icon">📊</span> Dashboard
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'predict_create' ? 'active' : ''}`}
            onClick={() => setActiveTab('predict_create')}
          >
            <span className="icon">➕</span> Create & Predict
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'predict_existing' ? 'active' : ''}`}
            onClick={() => setActiveTab('predict_existing')}
          >
            <span className="icon">📊</span> Predict Existing
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'all_users' ? 'active' : ''}`}
            onClick={() => setActiveTab('all_users')}
          >
            <span className="icon">👥</span> All Users
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'all_predictions' ? 'active' : ''}`}
            onClick={() => setActiveTab('all_predictions')}
          >
            <span className="icon">📋</span> All Predictions
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="icon">👤</span> Profile
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'blog_create' ? 'active' : ''}`}
            onClick={() => setActiveTab('blog_create')}
          >
            <span className="icon">✍️</span> Create Article
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'blog_view' ? 'active' : ''}`}
            onClick={() => setActiveTab('blog_view')}
          >
            <span className="icon">📚</span> Education
          </button>
          <button className={"sidebar-btn"} onClick={()=>navigate("/data_dashboard",{replace:true})}>
           🧑🏻‍💻  Data Dashboard
          </button>
          
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {activeTab === 'dashboard' && <Admin_Dashboard_Stats user={user} />}
          {activeTab === 'predict_create' && <Admin_Predict_Create user={user} />}
          {activeTab === 'predict_existing' && <Admin_Predict user={user} />}
          {activeTab === 'all_users' && <Admin_Users user={user} />}
          {activeTab === 'all_predictions' && <Admin_Predictions user={user} />}
          {activeTab === 'profile' && <Profile user={user} />}
          {activeTab === 'blog_create' && <Admin_Blogs_Create user={user} />}
          {activeTab === 'blog_view' && <BlogList isAdmin={true} onEdit={handleEditBlog} onDelete={handleDeleteBlog} />}

        </main>
      </div>
    </div>
  )
}

export default AdminDashboard