import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom'
import Signup from './pages/signup'
import Login from './pages/login'
import PatientDashboard from './pages/dashboard/PatientDashboard'
import AdminDashboard from './pages/dashboard/AdminDashboard'
import Data_Dashboard from './pages/DL/Data_Dashboard'
import DoctorDashboard from './pages/dashboard/DoctorDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from "./components/ErrorBoundary"
import Navbar from './components/Navbar'
import './App.css'


// Layout component that includes Navbar
const Layout = () => {
  return (
    <>
      <Navbar />
      <Outlet /> {/* This renders the child routes */}
    </>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Public routes without Navbar */}
          <Route path="/" element={<Signup/>} />
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes with Navbar */}
          <Route element={<Layout />}>
            {/* Patient Routes */}
            <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
              <Route path="/patient-dashboard" element={<PatientDashboard />} />
            </Route>
            
            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/data_dashboard" element={<Data_Dashboard />} />
            </Route>
            
            {/* Doctor Routes */}
            <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
              <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}

export default App