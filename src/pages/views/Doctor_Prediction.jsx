import { useState, useEffect } from 'react'
import jsPDF from 'jspdf'

const API_URL = import.meta.env.VITE_API_URL;

function Doctor_Prediction({ user }) {
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState('')
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
    fetchPatients()
  }, [])

  const fetchPatients = () => {
    fetch(`${API_URL}/doctor/patients?doctor_id=${user.id}`, {
      headers: { 'role': 'doctor' }
    })
    .then(res => res.json())
    .then(data => {
      if (data.patients) setPatients(data.patients)
    })
    .catch(err => console.error('Error fetching patients:', err))
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handlePredict = () => {
    if (!selectedPatient) {
      alert('Please select a patient first')
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

    const params = new URLSearchParams({
      patient_id: selectedPatient,
      doctor_id: user.id,
      glucose: formData.glucose,
      blood_pressure: formData.blood_pressure,
      bmi: formData.bmi,
      age: formData.age,
      insulin: formData.insulin || 0,
      skin_thickness: formData.skin_thickness || 0,
      pregnancies: formData.pregnancies || 0,
      diabetes_pedigree_function: formData.diabetes_pedigree_function || 0
    })

    fetch(`${API_URL}/doctor/predict?${params}`, {
      method: 'POST',
      headers: { 'role': 'doctor' }
    })
    .then(res => res.json())
    .then(data => {
      setLoading(false)
      if (data.prediction) {
        const selectedPatientObj = patients.find(p => p.id === parseInt(selectedPatient))
        setPredictionResult({
          ...data.prediction,
          patient_name: selectedPatientObj?.name || 'Unknown',
          patient_email: selectedPatientObj?.email || 'Unknown',
          patient_id: selectedPatient,
          doctor_name: user.name || 'Doctor'
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
        alert(`✅ Prediction done for patient!`)
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
    
    // Add doctor info
    doc.setFontSize(12)
    doc.text(`Doctor: ${predictionResult.doctor_name || 'N/A'}`, 20, 50)
    doc.text(`Doctor ID: ${user.id}`, 20, 60)
    
    // Add patient info
    doc.text(`Patient Name: ${predictionResult.patient_name || 'N/A'}`, 20, 75)
    doc.text(`Patient Email: ${predictionResult.patient_email || 'N/A'}`, 20, 85)
    doc.text(`Patient ID: ${predictionResult.patient_id || 'N/A'}`, 20, 95)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 105)
    
    // Add a separator line
    doc.line(20, 110, 190, 110)
    
    // Add prediction results
    doc.setFontSize(16)
    doc.text('Prediction Results', 20, 125)
    
    doc.setFontSize(12)
    doc.text(`Risk Percentage: ${predictionResult.risk_percentage || 0}%`, 20, 140)
    doc.text(`Result: ${predictionResult.result || 'N/A'}`, 20, 150)
    
    const riskLevel = predictionResult.risk_percentage >= 70 ? '⚠️ High Risk' :
                     predictionResult.risk_percentage >= 40 ? '⚡ Medium Risk' : '✅ Low Risk'
    doc.text(`Risk Level: ${riskLevel}`, 20, 160)
    
    // Add input data summary using stored healthData
    doc.setFontSize(14)
    doc.text('Input Data Summary', 20, 180)
    
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
    
    let yPos = 190
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

  const selectedPatientName = patients.find(p => p.id === parseInt(selectedPatient))?.name

  return (
    <div>
      <h2>📊 Predict for Patient</h2>
      <p className="subtitle">Make a diabetes risk prediction for your assigned patient</p>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body">
          <div className="form-group">
            <label>Select Patient *</label>
            <select 
              className="input"
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
            >
              <option value="">-- Select a patient --</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} ({patient.email})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedPatient && (
        <div className="card">
          <div className="card-body">
            <h4 style={{ marginBottom: '15px', color: 'var(--color-primary)' }}>
              👨‍⚕️ Predicting for: {selectedPatientName}
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

            <button 
              className="btn btn-primary btn-block" 
              onClick={handlePredict}
              disabled={loading}
              style={{ marginTop: '20px' }}
            >
              {loading ? 'Predicting...' : 'Predict for Patient'}
            </button>

            {predictionResult && (
              <div>
                <div className={`prediction-result ${predictionResult.risk_percentage >= 70 ? 'high' : predictionResult.risk_percentage >= 40 ? 'medium' : 'low'}`}>
                  <h4>Prediction Result</h4>
                  <p><strong>Patient:</strong> {selectedPatientName}</p>
                  <p><strong>Result:</strong> {predictionResult.result}</p>
                  <p><strong>Risk Percentage:</strong> {predictionResult.risk_percentage}%</p>
                  <p><strong>Risk Level:</strong> {
                    predictionResult.risk_percentage >= 70 ? '⚠️ High Risk' :
                    predictionResult.risk_percentage >= 40 ? '⚡ Medium Risk' : '✅ Low Risk'
                  }</p>
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
        </div>
      )}
    </div>
  )
}

export default Doctor_Prediction