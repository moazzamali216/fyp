import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL;

function Admin_Users({ user }) {
  const [allUsers, setAllUsers] = useState([])
  const [doctors, setDoctors] = useState([])
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [assignLoading, setAssignLoading] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState({})
  
  // NEW: Search state
  const [searchTerm, setSearchTerm] = useState('')
  const [searchFilter, setSearchFilter] = useState('all') // all, name, email, role

  useEffect(() => {
    fetchUsers()
    fetchDoctors()
  }, [])

  const fetchUsers = () => {
    fetch(`${API_URL}/users`, {
      headers: {"ngrok-skip-browser-warning": "true", 'role': 'admin' }
    })
    .then(res => res.json())
    .then(data => {
      if (data.users) setAllUsers(data.users)
    })
  }

  const fetchDoctors = () => {
    fetch(`${API_URL}/users/doctors`, {
      headers: {"ngrok-skip-browser-warning": "true", 'role': 'admin' }
    })
    .then(res => res.json())
    .then(data => {
      if (data.doctors) setDoctors(data.doctors)
    })
  }

  const handleDeleteUser = (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      return
    }

    setDeleteLoading(true)
    fetch(`${API_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: {"ngrok-skip-browser-warning": "true", 'role': 'admin' }
    })
    .then(res => res.json())
    .then(data => {
      setDeleteLoading(false)
      if (data.error) {
        alert('Error: ' + data.error)
      } else {
        alert(`User "${userName}" deleted successfully!`)
        fetchUsers()
        fetchDoctors()
      }
    })
    .catch(() => {
      setDeleteLoading(false)
      alert('Failed to delete user')
    })
  }

  const handleAssignPatient = (patientId) => {
    const doctorId = selectedDoctor[patientId]
    if (!doctorId) {
      alert('Please select a doctor first')
      return
    }

    if (!window.confirm('Assign this patient to the selected doctor?')) {
      return
    }

    setAssignLoading(true)
    fetch(`${API_URL}/admin/assign-patient?patient_id=${patientId}&doctor_id=${doctorId}`, {
      method: 'POST',
      headers: {"ngrok-skip-browser-warning": "true", 'role': 'admin' }
    })
    .then(res => res.json())
    .then(data => {
      setAssignLoading(false)
      if (data.error) {
        alert('Error: ' + data.error)
      } else {
        alert('Patient assigned successfully!')
        fetchUsers()
        fetchDoctors()
      }
    })
    .catch(() => {
      setAssignLoading(false)
      alert('Failed to assign patient')
    })
  }

  const handleUnassignPatient = (patientId) => {
    if (!window.confirm('Remove this patient from doctor (make individual)?')) {
      return
    }

    setAssignLoading(true)
    fetch(`${API_URL}/admin/unassign-patient?patient_id=${patientId}`, {
      method: 'POST',
      headers: {"ngrok-skip-browser-warning": "true", 'role': 'admin' }
    })
    .then(res => res.json())
    .then(data => {
      setAssignLoading(false)
      if (data.error) {
        alert('Error: ' + data.error)
      } else {
        alert('Patient unassigned successfully!')
        fetchUsers()
        fetchDoctors()
      }
    })
    .catch(() => {
      setAssignLoading(false)
      alert('Failed to unassign patient')
    })
  }

  const getDoctorName = (doctorId) => {
    const doctor = doctors.find(d => d.id === doctorId)
    return doctor ? doctor.name : 'None'
  }

  // NEW: Filter users based on search
  const filteredUsers = allUsers.filter(u => {
    if (!searchTerm.trim()) return true
    
    const searchLower = searchTerm.toLowerCase().trim()
    
    switch (searchFilter) {
      case 'name':
        return u.name.toLowerCase().includes(searchLower)
      case 'email':
        return u.email.toLowerCase().includes(searchLower)
      case 'role':
        return u.roles.toLowerCase().includes(searchLower)
      default:
        // Search across all fields
        return (
          u.name.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower) ||
          u.roles.toLowerCase().includes(searchLower) ||
          u.id.toString().includes(searchLower)
        )
    }
  })

  // Get stats for filtered users
  const filteredPatients = filteredUsers.filter(u => u.roles === 'patient')
  const filteredDoctors = filteredUsers.filter(u => u.roles === 'doctor')

  // Clear search
  const clearSearch = () => {
    setSearchTerm('')
    setSearchFilter('all')
  }

  return (
    <div className="users-management">
      <div className="users-header">
        <div>
          <h2>All Users</h2>
          <p className="subtitle">Manage users, assign patients to doctors</p>
        </div>
        <div className="users-stats">
          <span className="stat-badge">
            Total: {allUsers.length}
          </span>
          <span className="stat-badge">
            Patients: {allUsers.filter(u => u.roles === 'patient').length}
          </span>
          <span className="stat-badge">
            Doctors: {allUsers.filter(u => u.roles === 'doctor').length}
          </span>
        </div>
      </div>

      {/* NEW: Search Bar */}
      <div className="search-container">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search users by name, email, ID, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="search-clear" onClick={clearSearch}>
              ✕
            </button>
          )}
        </div>
        
        <div className="search-filters">
          <button
            className={`filter-btn ${searchFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSearchFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${searchFilter === 'name' ? 'active' : ''}`}
            onClick={() => setSearchFilter('name')}
          >
            Name
          </button>
          <button
            className={`filter-btn ${searchFilter === 'email' ? 'active' : ''}`}
            onClick={() => setSearchFilter('email')}
          >
            Email
          </button>
          <button
            className={`filter-btn ${searchFilter === 'role' ? 'active' : ''}`}
            onClick={() => setSearchFilter('role')}
          >
            Role
          </button>
        </div>
      </div>

      {/* NEW: Search Results Summary */}
      {searchTerm && (
        <div className="search-results-summary">
          Found <strong>{filteredUsers.length}</strong> user(s) matching 
          "<strong>{searchTerm}</strong>" 
          {searchFilter !== 'all' && ` in ${searchFilter}`}
          <button className="clear-search-link" onClick={clearSearch}>
            Clear
          </button>
        </div>
      )}

      {deleteLoading && <div className="loading-message">Deleting user...</div>}
      {assignLoading && <div className="loading-message">Processing assignment...</div>}

      <div className="table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Assigned Doctor</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td className="user-id">#{u.id}</td>
                  <td className="user-name">{u.name}</td>
                  <td className="user-email">{u.email}</td>
                  <td>
                    <span className={`role-badge role-${u.roles}`}>
                      {u.roles}
                    </span>
                  </td>
                  <td>
                    {u.roles === 'patient' && (
                      u.doctor_id ? (
                        <span className="doctor-badge">
                          👨‍⚕️ Dr. {getDoctorName(u.doctor_id)}
                        </span>
                      ) : (
                        <span className="individual-badge">
                          👤 Individual
                        </span>
                      )
                    )}
                    {u.roles !== 'patient' && (
                      <span className="na-text">—</span>
                    )}
                  </td>
                  <td>
                    <div className="action-cell">
                      {u.roles === 'patient' && (
                        <>
                          {!u.doctor_id ? (
                            <div className="assign-group">
                              <select 
                                className="assign-select"
                                onChange={(e) => setSelectedDoctor({ ...selectedDoctor, [u.id]: parseInt(e.target.value) })}
                                value={selectedDoctor[u.id] || ''}
                              >
                                <option value="">Select Doctor</option>
                                {doctors.map(d => (
                                  <option key={d.id} value={d.id}>Dr. {d.name}</option>
                                ))}
                              </select>
                              <button 
                                className="btn-assign"
                                onClick={() => handleAssignPatient(u.id)}
                                disabled={assignLoading}
                              >
                                Assign
                              </button>
                            </div>
                          ) : (
                            <button 
                              className="btn-unassign"
                              onClick={() => handleUnassignPatient(u.id)}
                              disabled={assignLoading}
                            >
                              Make Individual
                            </button>
                          )}
                        </>
                      )}
                      {u.id !== user.id && (
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          disabled={deleteLoading}
                        >
                          Delete
                        </button>
                      )}
                      {u.id === user.id && (
                        <span className="you-badge">You</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-results">
                  <div className="no-results-content">
                    <span className="no-results-icon">🔍</span>
                    <p>No users found matching "<strong>{searchTerm}</strong>"</p>
                    <button className="clear-search-btn" onClick={clearSearch}>
                      Clear Search
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Admin_Users