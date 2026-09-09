import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Profile from '../commons/Profile'
import BlogList from '../commons/BlogList'
import Doctor_Patients from '../views/Doctor_Patients'
import Doctor_Prediction from '../views/Doctor_Prediction'




function DoctorDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('patients')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      navigate('/login')
      localStorage.removeItem("token")
    } else {
      setUser(JSON.parse(userData))
    }
  }, [navigate])


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
            className={`sidebar-btn ${activeTab === 'patients' ? 'active' : ''}`}
            onClick={() => setActiveTab('patients')}
          >
            <span className="icon">👥</span> My Patients
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'predict' ? 'active' : ''}`}
            onClick={() => setActiveTab('predict')}
          >
            <span className="icon">📊</span> Predict for Patient
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="icon">👤</span> Profile
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'education' ? 'active' : ''}`}
            onClick={() => setActiveTab('education')}
          >
            <span className="icon">📚</span> Education
          </button>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {activeTab === 'patients' && <Doctor_Patients user={user} />}
          {activeTab === 'predict' && <Doctor_Prediction user={user} />}
          {activeTab === 'profile' && <Profile user={user} />}
          {activeTab === 'education' && <BlogList isAdmin={false} />}
        </main>
      </div>
    </div>
  )
}

export default DoctorDashboard