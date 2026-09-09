import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import '../App.css'

function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState("patient")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const API_URL = import.meta.env.VITE_API_URL;

  const handleSignup = () => {
    if (!name || !email || !password || !confirmPassword) {
      setMessage("⚠️ Please fill all fields")
      return
    }

    if (password !== confirmPassword) {
      setMessage("⚠️ Passwords do not match")
      return
    }

    if (password.length < 6) {
      setMessage("⚠️ Password must be at least 6 characters")
      return
    }

    setIsLoading(true)
    setMessage("")

    fetch(`${API_URL}/signup?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&role=${encodeURIComponent(role)}`, {
      method: 'POST'
    })
    .then((res) => res.json())
    .then((data) => {
      setIsLoading(false)
      if (data.error) {
        setMessage("❌ " + data.error)
      } else {
        setMessage("✅ Account created successfully!")
        setTimeout(() => navigate('/login'), 1500)
      }
    })
    .catch(() => {
      setIsLoading(false)
      setMessage("❌ Something went wrong. Try again.")
    })
  }

  return (
    <div className="container">
      <div className="signup-box">
        <h1 className="title">Create Acscount</h1>
        <p className="subtitle">Sign upasasa to get started</p>

        <div className="form-group">
          <input 
            className="input" 
            type="text" 
            placeholder="Full Name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
        </div>

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
          <select 
            className="input" 
            value={role} 
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
            
          </select>
        </div>

        <div className="form-group">
          <input 
            className="input" 
            type="password" 
            placeholder="Password (min 6 characters)" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
        </div>

        <div className="form-group">
          <input 
            className="input" 
            type="password" 
            placeholder="Confirm Password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
          />
        </div>

        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <button 
          className="btn btn-submit" 
          onClick={handleSignup}
          disabled={isLoading}
        >
          {isLoading ? "Creating..." : "Sign Up"}
        </button>

        <p className="login-link">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}

export default Signup