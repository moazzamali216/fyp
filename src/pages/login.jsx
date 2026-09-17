import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import '../App.css'


const API_URL = import.meta.env.VITE_API_URL;
function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // ✅ FIXED: Role map with admin, patient, doctor
  const roleMap = {
    'admin': '/admin-dashboard',
    'patient': '/patient-dashboard',
    'doctor': '/doctor-dashboard',
  }

  const handleLogin = () => {
    if (!email || !password) {
      setMessage("⚠️ Please fill all fields")
      return
    }

    setIsLoading(true)
    setMessage("")

    fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    })
    .then((res) => {
      console.log('🔍 Response status:', res.status)
      return res.json()
    })
    .then((data) => {
      setIsLoading(false)
      
      console.log('🔍 Login response:', data)
      
      if (data.error) {
        setMessage("❌ " + data.error)
        return
      }
      
      // ✅ Check if token exists
      if (!data.token) {
        console.error('❌ No token in response!')
        setMessage("❌ Server error: No token received")
        return
      }
      
      setMessage("✅ Login successful!")
      
      // ✅ Save the TOKEN
      localStorage.setItem('token', data.token)
      console.log('✅ Token saved:', data.token.substring(0, 20) + '...')
      
      // ✅ Save user data
      localStorage.setItem('user', JSON.stringify({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role
      }))
      console.log('✅ User saved:', data.user)

      // ✅ Verify both are saved
      console.log('🔍 Token in localStorage:', localStorage.getItem('token') ? 'YES' : 'NO')
      console.log('🔍 User in localStorage:', localStorage.getItem('user') ? 'YES' : 'NO')

      // ✅ FIXED: Get redirect path with proper fallback
      const redirectPath = roleMap[data.user.role] || '/dashboard'
      console.log('🔍 User role:', data.user.role)
      console.log('🔍 Redirecting to:', redirectPath)

      setTimeout(() => {
        navigate(redirectPath)
      }, 1000)
    })
    .catch((error) => {
      console.error('❌ Login error:', error)
      setIsLoading(false)
      setMessage("❌ Something went wrong. Try again.")
    })
  }

  return (
    <div className="container">
      <div className="signup-box">
        <h1 className="title">Welcome Back</h1>
        <p className="subtitle">Log in to your account</p>

        <div className="form-group">
          <input 
            className="input" 
            type="email" 
            placeholder="Email Address" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>

        <div className="form-group">
          <input 
            className="input" 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>

        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <button 
          className="btn btn-submit" 
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Log In"}
        </button>

        <p className="login-link">
          Don't have an account? <Link to="/">Sign up</Link>
        </p>
      </div>
    </div>
  )
}

export default Login  