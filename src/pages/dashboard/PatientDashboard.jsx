import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Profile from '../commons/Profile'
import BlogList from '../commons/BlogList'
import Patient_Predict from '../views/Patient_Predict'
import Patient_History from '../views/Patient_History'
import Patient_Guide from '../views/Patient_Guide'



const API_URL = import.meta.env.VITE_API_URL;
function PatientDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('predict')
  const [patientType, setPatientType] = useState(null)
  const [doctorInfo, setDoctorInfo] = useState(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      navigate('/login')
    } else {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)

      // Check patient type
      fetch(`${API_URL}/${parsedUser.id}`, {
        headers: { 'role': parsedUser.role }
      })
        .then(res => res.json())
        .then(data => {
          if (data.patient) {
            setPatientType(data.type)
            if (data.doctor) {
              setDoctorInfo(data.doctor)
            }
          }
        })
        .catch(err => console.error('Error fetching patient type:', err))
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
            className={`sidebar-btn ${activeTab === 'predict' ? 'active' : ''}`}
            onClick={() => setActiveTab('predict')}
          >
            <span className="icon">📊</span> Predict
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            <span className="icon">🤖</span> AI Guidance
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <span className="icon">📋</span> History
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
          {activeTab === 'predict' && <Patient_Predict user={user} />}
          {activeTab === 'history' && <Patient_History user={user} />}
          {activeTab === 'ai' && <Patient_Guide user={user} />}
          {activeTab === 'education' && <><BlogList isAdmin={false} />{`${JSON.stringify(user)}`}</>}
          {activeTab === 'profile' && <Profile user={user} />}

        </main>
      </div>
    </div>
  )
}

export default PatientDashboard