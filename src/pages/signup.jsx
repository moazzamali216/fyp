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

  // OTP flow state
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState("")
  const [isSendingOtp, setIsSendingOtp] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL;

  const validateForm = () => {
    if (!name || !email || !password || !confirmPassword) {
      setMessage("⚠️ Please fill all fields")
      return false
    }
    if (password !== confirmPassword) {
      setMessage("⚠️ Passwords do not match")
      return false
    }
    if (password.length < 6) {
      setMessage("⚠️ Password must be at least 6 characters")
      return false
    }
    return true
  }

  // --- Button 1: Send OTP ---
  const handleSendOtp = () => {
    if (!validateForm()) return

    setIsSendingOtp(true)
    setMessage("")

    fetch(`${API_URL}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
      .then(res => res.json())
      .then(data => {
        setIsSendingOtp(false)
        if (data.error) {
          setMessage("❌ " + data.error)
        } else {
          setOtpSent(true)
          setMessage("📧 OTP sent to " + email + " — check your inbox")
        }
      })
      .catch(() => {
        setIsSendingOtp(false)
        setMessage("❌ Could not send OTP. Try again.")
      })
  }

  // --- Button 2: Create Account (verifies OTP first, then signs up) ---
  const handleSignup = async () => {
    if (!validateForm()) return

    if (!otpSent) {
      setMessage("⚠️ Please click 'Send OTP' first")
      return
    }

    if (!otp || otp.length !== 6) {
      setMessage("⚠️ Enter the 6-digit OTP from your email")
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      // Step 1: verify the OTP
      const verifyRes = await fetch(`${API_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      })
      const verifyData = await verifyRes.json()

      if (verifyData.error) {
        setIsLoading(false)
        setMessage("❌ " + verifyData.error)
        return
      }

      // Step 2: OTP is valid → create account
      const signupRes = await fetch(
        `${API_URL}/signup?name=${encodeURIComponent(name)}` +
        `&email=${encodeURIComponent(email)}` +
        `&password=${encodeURIComponent(password)}` +
        `&role=${encodeURIComponent(role)}`,
        { method: 'POST' }
      )
      const signupData = await signupRes.json()

      setIsLoading(false)

      if (signupData.error) {
        setMessage("❌ " + signupData.error)
      } else {
        setMessage("✅ Account created successfully!")
        setTimeout(() => navigate('/login'), 1500)
      }
    } catch {
      setIsLoading(false)
      setMessage("❌ Something went wrong. Try again.")
    }
  }

  return (
    <div className="container">
      <div className="signup-box">
        <h1 className="title">Create Account</h1>
        <p className="subtitle">Sign up to get started</p>

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
            disabled={otpSent}
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

        {/* ---- OTP row: input + Send OTP button ---- */}
        <div className="form-group">
          <input
            className="input"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            style={{
              letterSpacing: '4px',
              textAlign: 'center',
              fontSize: '16px'
            }}
          />
          <button
            className="btn btn-submit"
            onClick={handleSendOtp}
            disabled={isSendingOtp}
            style={{
              whiteSpace: 'nowrap',
              padding: '16px 16px',

              color: 'white',
              border: 'none',
              marginTop: '10px',
              borderRadius: 8,
              cursor: 'pointer',
              width: '100%'
            }}
          >
            {isSendingOtp ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
          </button>
        </div>

        {/* ---- Create Account button ---- */}
        <button
          className="btn btn-submit"
          onClick={handleSignup}
          disabled={isLoading}
        >
          {isLoading ? "Verifying & Creating..." : "🎉 Create Account"}
        </button>

        {message && (
          <div className={`message ${message.includes('✅') || message.includes('📧') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <p className="login-link">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}

export default Signup