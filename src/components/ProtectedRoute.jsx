import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'


const API_URL = import.meta.env.VITE_API_URL;
function ProtectedRoute({ allowedRoles }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    const verifyUser = async () => {
      try {
        const token = localStorage.getItem('token')
        
        console.log('🔍 ProtectedRoute - Token exists:', !!token)
        console.log('🔍 ProtectedRoute - Token value:', token ? token.substring(0, 30) + '...' : 'null')
        
        if (!token) {
          console.log('❌ No token found, redirecting to login')
          navigate("/login")
          setLoading(false)
          return
        }

        console.log('🔍 Calling /api/verify...')
        const response = await fetch(`${API_URL}/api/verify`, {
          method: 'GET',
          headers: {"ngrok-skip-browser-warning": "true",
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        })

        console.log('🔍 Response status:', response.status)
        
        // Get response as text first
        const responseText = await response.text()
        console.log('🔍 Raw response:', responseText)

        if (!response.ok) {
          console.log('❌ Response not OK:', response.status)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setLoading(false)
          return
        }

        // Parse JSON
        let data
        try {
          data = JSON.parse(responseText)
          console.log('✅ Parsed response:', data)
        } catch (e) {
          console.error('❌ Failed to parse JSON:', e)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setLoading(false)
          return
        }

        if (!data.user) {
          console.log('❌ No user data in response')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setLoading(false)
          return
        }

        const verifiedUser = data.user
        console.log('✅ Verified user:', verifiedUser)
        console.log('✅ User role:', verifiedUser.role)

        if (allowedRoles && !allowedRoles.includes(verifiedUser.role)) {
          console.log('❌ Role not authorized. Required:', allowedRoles, 'Got:', verifiedUser.role)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setLoading(false)
          return
        }

        console.log('✅ User authorized successfully!')
        setUser(verifiedUser)
        localStorage.setItem('user', JSON.stringify(verifiedUser))
        
      } catch (error) {
        console.error('❌ Verification error:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      } finally {
        setLoading(false)
      }
    }

    verifyUser()
  }, [allowedRoles])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div className="spinner"></div>
        <p>Verifying authentication...</p>
      </div>
    )
  }

  if (!user) {
    console.log('🔴 No user, redirecting to login')
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  console.log('✅ User authenticated, rendering protected route')
  return <Outlet />
}

export default ProtectedRoute