import { useState, useEffect } from 'react'
import jsPDF from 'jspdf'

const API_URL = import.meta.env.VITE_API_URL;

function Admin_Predict({ user }) {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState('')
  const [loading, setLoading] = useState(false)
  const [predictionResult, setPredictionResult] = useState(null)
  const [healthData, setHealthData] = useState(null)
  const [formData, setFormData] = useState({
    glucose: '',
    blood_pressure: '',
    bmi: '',
    age: '',
    insulin: '',
    skin_thickness: '',
    pregnancies: '',
    diabetes_pedigree_function: ''
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = () => {
    fetch(`${API_URL}/users`, {
      headers: {'ngrok-skip-browser-warning': 'true', 'role': 'admin' }
    })
    .then(res => res.json())
    .then(data => {
      if (data.users) {
        // Filter only patients
        const patients = data.users.filter(u => u.roles === 'patient')
        setUsers(patients)
      }
    })
    .catch(err => console.error('Error fetching users:', err))
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handlePredict = () => {
    if (!selectedUser) {
      alert('Please select a user first')
      return
    }

    const required = ['glucose', 'blood_pressure', 'bmi', 'age']
    for (let field of required) {
      if (!formData[field]) {
        alert(`Please enter ${field.replace('_', ' ')}`)
        return
      }
    }

    setLoading(true)
    setPredictionResult(null)

    const params = new URLSearchParams({
      user_id: selectedUser,
      glucose: formData.glucose,
      blood_pressure: formData.blood_pressure,
      bmi: formData.bmi,
      age: formData.age,
      insulin: formData.insulin || 0,
      skin_thickness: formData.skin_thickness || 0,
      pregnancies: formData.pregnancies || 0,
      diabetes_pedigree_function: formData.diabetes_pedigree_function || 0
    })

    fetch(`${API_URL}/admin/predict?${params}`, {
      method: 'POST',
      headers: {'ngrok-skip-browser-warning': 'true', 'role': 'admin' }
    })
    .then(res => res.json())
    .then(data => {
      setLoading(false)
      if (data.prediction) {
        const selectedPatient = users.find(u => u.id === parseInt(selectedUser))
        setPredictionResult({
          ...data.prediction,
          patient_name: selectedPatient?.name || 'Unknown',
          patient_email: selectedPatient?.email || 'Unknown',
          patient_id: selectedUser
        })
        // Store health data for PDF
        setHealthData({
          glucose: formData.glucose || 0,
          blood_pressure: formData.blood_pressure || 0,
          bmi: formData.bmi || 0,
          age: formData.age || 0,
          insulin: formData.insulin || 0,
          skin_thickness: formData.skin_thickness || 0,
          pregnancies: formData.pregnancies || 0,
          diabetes_pedigree_function: formData.diabetes_pedigree_function || 0
        })
        setFormData({
          glucose: '',
          blood_pressure: '',
          bmi: '',
          age: '',
          insulin: '',
          skin_thickness: '',
          pregnancies: '',
          diabetes_pedigree_function: ''
        })
        alert('✅ Prediction done successfully!')
      } else {
        alert(data.error || 'Something went wrong')
      }
    })
    .catch(() => {
      setLoading(false)
      alert('Something went wrong')
    })
  }

  const downloadPDF = () => {
    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(20)
    doc.text('Diabetes Risk Prediction Report', 20, 30)
    
    // Add patient info
    doc.setFontSize(12)
    doc.text(`Patient Name: ${predictionResult.patient_name || 'N/A'}`, 20, 50)
    doc.text(`Patient Email: ${predictionResult.patient_email || 'N/A'}`, 20, 60)
    doc.text(`Patient ID: ${predictionResult.patient_id || 'N/A'}`, 20, 70)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 80)
    
    // Add a separator line
    doc.line(20, 85, 190, 85)
    
    // Add prediction results
    doc.setFontSize(16)
    doc.text('Prediction Results', 20, 100)
    
    doc.setFontSize(12)
    doc.text(`Risk Percentage: ${predictionResult.risk_percentage || 0}%`, 20, 115)
    doc.text(`Result: ${predictionResult.result || 'N/A'}`, 20, 125)
    
    const riskLevel = predictionResult.risk_percentage >= 70 ? '⚠️ High Risk' :
                     predictionResult.risk_percentage >= 40 ? '⚡ Medium Risk' : '✅ Low Risk'
    doc.text(`Risk Level: ${riskLevel}`, 20, 135)
    
    // Add input data summary
    doc.setFontSize(14)
    doc.text('Input Data Summary', 20, 155)
    
    doc.setFontSize(10)
    const inputData = [
      `Glucose: ${healthData?.glucose || 'N/A'} mg/dL`,
      `Blood Pressure: ${healthData?.blood_pressure || 'N/A'} mm Hg`,
      `BMI: ${healthData?.bmi || 'N/A'}`,
      `Age: ${healthData?.age || 'N/A'} years`,
      `Insulin: ${healthData?.insulin || 'N/A'}`,
      `Skin Thickness: ${healthData?.skin_thickness || 'N/A'}`,
      `Pregnancies: ${healthData?.pregnancies || 'N/A'}`,
      `Diabetes Pedigree: ${healthData?.diabetes_pedigree_function || 'N/A'}`
    ]
    
    let yPos = 165
    inputData.forEach(line => {
      doc.text(line, 20, yPos)
      yPos += 8
    })
    
    // Add note
    doc.setFontSize(10)
    doc.text('This report is for informational purposes only.', 20, yPos + 10)
    doc.text('Please consult with a healthcare professional.', 20, yPos + 20)
    
    // Save the PDF
    doc.save(`diabetes_risk_report_${predictionResult.patient_name || 'patient'}_${Date.now()}.pdf`)
  }

  const selectedUserName = users.find(u => u.id === parseInt(selectedUser))?.name

  return (
    <div>
      <h2>📊 Predict for Existing User</h2>
      <p className="subtitle">Select a patient and make a prediction on their behalf</p>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body">
          <div className="form-group">
            <label>Select Patient *</label>
            <select 
              className="input"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">-- Select a patient --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedUser && (
        <div className="card">
          <div className="card-body">
            <h4 style={{ marginBottom: '15px', color: 'var(--color-primary)' }}>
              👤 Predicting for: {selectedUserName}
            </h4>

            <div className="form-grid">
              <div className="form-group">
                <label>Glucose (mg/dL) *</label>
                <input 
                  className="input" 
                  type="number" 
                  name="glucose"
                  placeholder="e.g., 120" 
                  value={formData.glucose} 
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Blood Pressure (mm Hg) *</label>
                <input 
                  className="input" 
                  type="number" 
                  name="blood_pressure"
                  placeholder="e.g., 80" 
                  value={formData.blood_pressure} 
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>BMI *</label>
                <input 
                  className="input" 
                  type="number" 
                  step="0.1"
                  name="bmi"
                  placeholder="e.g., 28.5" 
                  value={formData.bmi} 
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Age *</label>
                <input 
                  className="input" 
                  type="number" 
                  name="age"
                  placeholder="e.g., 45" 
                  value={formData.age} 
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Insulin</label>
                <input 
                  className="input" 
                  type="number" 
                  name="insulin"
                  placeholder="e.g., 80" 
                  value={formData.insulin} 
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Skin Thickness</label>
                <input 
                  className="input" 
                  type="number" 
                  name="skin_thickness"
                  placeholder="e.g., 25" 
                  value={formData.skin_thickness} 
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Pregnancies</label>
                <input 
                  className="input" 
                  type="number" 
                  name="pregnancies"
                  placeholder="e.g., 2" 
                  value={formData.pregnancies} 
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Diabetes Pedigree Function</label>
                <input 
                  className="input" 
                  type="number" 
                  step="0.001"
                  name="diabetes_pedigree_function"
                  placeholder="e.g., 0.627" 
                  value={formData.diabetes_pedigree_function} 
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                className="btn btn-primary" 
                onClick={handlePredict}
                disabled={loading}
              >
                {loading ? 'Predicting...' : 'Predict for Patient'}
              </button>
              
              {predictionResult && (
                <button 
                  className="btn btn-success"
                  onClick={downloadPDF}
                  style={{ 
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  📄 Download PDF Report
                </button>
              )}
            </div>

            {predictionResult && (
              <div className={`prediction-result ${predictionResult.risk_percentage >= 70 ? 'high' : predictionResult.risk_percentage >= 40 ? 'medium' : 'low'}`}>
                <h4>✅ Prediction Result</h4>
                <p><strong>Patient:</strong> {predictionResult.patient_name}</p>
                <p><strong>Result:</strong> {predictionResult.result}</p>
                <p><strong>Risk Percentage:</strong> {predictionResult.risk_percentage}%</p>
                <p><strong>Risk Level:</strong> {
                  predictionResult.risk_percentage >= 70 ? '⚠️ High Risk' :
                  predictionResult.risk_percentage >= 40 ? '⚡ Medium Risk' : '✅ Low Risk'
                }</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin_Predict