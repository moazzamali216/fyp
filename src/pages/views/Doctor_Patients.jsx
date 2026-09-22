import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL;

function Doctor_Patients({ user }) {
  const [patients, setPatients] = useState([])
  const [filteredPatients, setFilteredPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientPredictions, setPatientPredictions] = useState([])
  const [showPredictions, setShowPredictions] = useState(false)

  useEffect(() => {
    fetchPatients()
  }, [])

  useEffect(() => {
    // Filter patients based on search term
    if (searchTerm.trim() === '') {
      setFilteredPatients(patients)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = patients.filter(patient => 
        patient.name.toLowerCase().includes(term) ||
        patient.email.toLowerCase().includes(term) ||
        patient.id.toString().includes(term)
      )
      setFilteredPatients(filtered)
    }
  }, [searchTerm, patients])

  const fetchPatients = () => {
    setLoading(true)
    fetch(`${API_URL}/doctor/patients?doctor_id=${user.id}`, {
      headers: { 'role': 'doctor' }
    })
    .then(res => res.json())
    .then(data => {
      if (data.patients) {
        setPatients(data.patients)
        setFilteredPatients(data.patients)
      }
      setLoading(false)
    })
    .catch(() => setLoading(false))
  }

  const viewPatientPredictions = (patient) => {
    setSelectedPatient(patient)
    setShowPredictions(true)
    
    fetch(`${API_URL}/doctor/patient/${patient.id}/predictions?doctor_id=${user.id}`, {
      headers: { 'role': 'doctor' }
    })
    .then(res => res.json())
    .then(data => {
      if (data.predictions) {
        setPatientPredictions(data.predictions)
      }
    })
    .catch(err => console.error('Error fetching predictions:', err))
  }

  const getRiskBadge = (risk) => {
    if (risk >= 70) return 'badge-high'
    if (risk >= 40) return 'badge-medium'
    return 'badge-low'
  }

  const getRiskText = (risk) => {
    if (risk >= 70) return 'High Risk'
    if (risk >= 40) return 'Medium Risk'
    return 'Low Risk'
  }

  if (loading) {
    return (
      <div className="flex-center" style={{ padding: '40px' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="doctor-patients-container">
      <div className="patients-header">
        <div>
          <h2>👨‍⚕️ My Patients</h2>
          <p className="subtitle">View and manage your assigned patients</p>
        </div>
        <div className="patients-stats">
          <span className="stat-badge">
            Total: {patients.length}
          </span>
          <span className="stat-badge stat-active">
            Active: {patients.filter(p => p.status !== 'inactive').length}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="search-clear"
              onClick={() => setSearchTerm('')}
            >
              ✕
            </button>
          )}
        </div>
        <div className="search-results-info">
          {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {patients.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👨‍⚕️</div>
          <h3>No Patients Assigned</h3>
          <p>You don't have any patients assigned to you yet.</p>
          <p className="empty-hint">Contact admin to assign patients to you.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="patients-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Patient Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-results">
                    No patients found matching "{searchTerm}"
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient.id}>
                    <td className="patient-id">#{patient.id}</td>
                    <td className="patient-name">
                      <span className="patient-avatar">
                        {patient.name.charAt(0).toUpperCase()}
                      </span>
                      {patient.name}
                    </td>
                    <td className="patient-email">{patient.email}</td>
                    <td>
                      <span className="status-badge status-active">
                        ● Active
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-view-history"
                        onClick={() => viewPatientPredictions(patient)}
                      >
                        📋 View History
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Predictions Modal */}
      {showPredictions && selectedPatient && (
        <div className="modal-overlay" onClick={() => setShowPredictions(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Predictions for {selectedPatient.name}</h3>
            </div>
            <div className="modal-body">
              {patientPredictions.length === 0 ? (
                <div className="empty-predictions">
                  <p>No predictions yet for this patient.</p>
                </div>
              ) : (
                <div className="predictions-list">
                  <div className="predictions-header">
                    <span>Prediction</span>
                    <span>Risk</span>
                    <span>Date</span>
                  </div>
                  {patientPredictions.map((p) => (
                    <div key={p.id} className="prediction-item">
                      <span className={`prediction-result ${p.prediction_result === 1 ? 'diabetic' : 'non-diabetic'}`}>
                        {p.prediction_result === 1 ? '🟠 Diabetic' : '🟢 Non-Diabetic'}
                      </span>
                      <span className={`badge ${getRiskBadge(p.risk_percentage)}`}>
                        {getRiskText(p.risk_percentage)} ({p.risk_percentage}%)
                      </span>
                      <span className="prediction-date">
                        {new Date(p.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button style={{width:"fit-content"}}
                className="btn btn-primary btn-sm"
                onClick={() => setShowPredictions(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Doctor_Patients