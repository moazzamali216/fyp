// components/Navbar.jsx
import { useNavigate } from 'react-router-dom'

function Navbar() {
  const navigate = useNavigate()


  let user = null
  try {
    const userData = localStorage.getItem('user')
    user = userData ? JSON.parse(userData) : null
  } catch (error) {
    console.error('Error parsing user data:', error)
  }

  const roleColors = {
    patient: '#4a6cf7',
    admin: '#dc3545',
    doctor: '#28a745'
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    navigate('/login')
  }

  // If no user, don't render or render minimal version
  if (!user) {
    return (
      <nav className="navbar">
        <div className="nav-brand">🩺 Diabetes Predictor</div>
        <div className="nav-user">
          <span>Not logged in</span>
        </div>
      </nav>
    )
  }

  return (
    <nav className="navbar">
      <div className="nav-brand" onClick={()=>{
        navigate("/")
      }}>🩺 Diabetes Predictor</div>
      <div className="nav-user">
        <span style={{ color: roleColors[user.role] || '#666' }}>
          {user.name || 'User'} ({user.role || 'guest'})
        </span>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  )
}

export default Navbar