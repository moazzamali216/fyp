import { useState } from 'react'
import jsPDF from 'jspdf'

const API_URL = import.meta.env.VITE_API_URL;

function Admin_Predict_Create({ user }) {
  const [newPatient, setNewPatient] = useState({
    name: '',
    email: '',
    password: ''
  })
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
  const [predictionResult, setPredictionResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [healthData, setHealthData] = useState(null) // Store health data for PDF

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleNewPatientChange = (e) => {
    setNewPatient({
      ...newPatient,
      [e.target.name]: e.target.value
    })
  }

  const handleCreateAndPredict = () => {
    // Validate patient details
    if (!newPatient.name || !newPatient.email || !newPatient.password) {
      alert('Please fill all patient details')
      return
    }

    // Validate prediction data
    const required = ['glucose', 'blood_pressure', 'bmi', 'age']
    for (let field of required) {
      if (!formData[field]) {
        alert(`Please enter ${field.replace('_', ' ')} for prediction`)
        return
      }
    }

    setLoading(true)
    setPredictionResult(null)

    // Store patient data to use later
    const patientName = newPatient.name
    const patientEmail = newPatient.email
    
    // Store health data for PDF before clearing
    const currentHealthData = {
      glucose: formData.glucose || 0,
      blood_pressure: formData.blood_pressure || 0,
      bmi: formData.bmi || 0,
      age: formData.age || 0,
      insulin: formData.insulin || 0,
      skin_thickness: formData.skin_thickness || 0,
      pregnancies: formData.pregnancies || 0,
      diabetes_pedigree_function: formData.diabetes_pedigree_function || 0
    }
    setHealthData(currentHealthData)

    // Step 1: Create the patient
    const createParams = new URLSearchParams({
      name: newPatient.name,
      email: newPatient.email,
      password: newPatient.password
    })

    fetch(`${API_URL}/admin/create-patient?${createParams}`, {
      method: 'POST',
      headers: {"ngrok-skip-browser-warning": "true", 'role': 'admin' }
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert('Failed to create patient: ' + data.error)
        setLoading(false)
        return
      }

      const patientId = data.user.id
      
      // Step 2: Make prediction for the new patient
      const predictParams = new URLSearchParams({
        user_id: patientId,
        glucose: formData.glucose,
        blood_pressure: formData.blood_pressure,
        bmi: formData.bmi,
        age: formData.age,
        insulin: formData.insulin || 0,
        skin_thickness: formData.skin_thickness || 0,
        pregnancies: formData.pregnancies || 0,
        diabetes_pedigree_function: formData.diabetes_pedigree_function || 0
      })

      // Return a promise that includes both the prediction and patient data
      return fetch(`${API_URL}/predict?${predictParams}`, {
        method: 'POST'
      })
      .then(res => res.json())
      .then(predictionData => {
        return {
          predictionData,
          patientId,
          patientName,
          patientEmail
        }
      })
    })
    .then(({ predictionData, patientId, patientName, patientEmail }) => {
      setLoading(false)
      if (predictionData.prediction) {
        setPredictionResult({
          ...predictionData.prediction,
          patient_name: patientName,
          patient_email: patientEmail,
          patient_id: patientId
        })
        setNewPatient({ name: '', email: '', password: '' })
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
        alert(`✅ Patient "${patientName}" created and prediction done!`)
      } else {
        alert(predictionData.error || 'Prediction failed')
      }
    })
    .catch((error) => {
      console.error('Error:', error)
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
    
    // Add input data summary using stored healthData
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

  return (
    <div>
      <h2>Predict & Create Patient</h2>
      <p className="subtitle">Create a new patient and make their first prediction</p>

      <div className="form-section">
        <h4>Patient Details</h4>
        <div className="form-grid">
          <div className="form-group">
            <label>Full Name *</label>
            <input 
              className="input" 
              type="text" 
              name="name"
              placeholder="e.g., John Doe" 
              value={newPatient.name} 
              onChange={handleNewPatientChange}
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input 
              className="input" 
              type="email" 
              name="email"
              placeholder="e.g., john@email.com" 
              value={newPatient.email} 
              onChange={handleNewPatientChange}
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input 
              className="input" 
              type="text" 
              name="password"
              placeholder="e.g., 123456" 
              value={newPatient.password} 
              onChange={handleNewPatientChange}
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4>Prediction Data</h4>
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
      </div>

      <button 
        className="btn btn-submit" 
        onClick={handleCreateAndPredict}
        disabled={loading}
        style={{width: '100%', marginTop: '15px', width: 'fit-content'}}
      >
        {loading ? 'Creating & Predicting...' : 'Create Patient & Predict'}
      </button>

      {predictionResult && predictionResult.patient_name && (
        <div>
          <div className={`prediction-result ${predictionResult.result === 'Diabetic' ? 'diabetic' : 'non-diabetic'}`}>
            <h4>✅ Patient Created & Prediction Done!</h4>
            <p><strong>Patient:</strong> {predictionResult.patient_name} ({predictionResult.patient_email})</p>
            <p><strong>Patient ID:</strong> {predictionResult.patient_id}</p>
            <p><strong>Result:</strong> {predictionResult.result}</p>
            <p><strong>Risk Percentage:</strong> {predictionResult.risk_percentage}%</p>
          </div>
          
          {/* PDF Download Button */}
          <button 
            className="btn btn-success" 
            onClick={downloadPDF}
            style={{ 
              marginTop: '15px', 
              width: '100%',
              padding: '10px',
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
        </div>
      )}
    </div>
  )
}

export default Admin_Predict_Create