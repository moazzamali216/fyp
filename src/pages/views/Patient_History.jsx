import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL;

function Patient_History({ user }) {
  const [predictions, setPredictions] = useState([])

  useEffect(() => {
    fetchPredictions()
  }, [])

  const fetchPredictions = () => {
    const role = user?.role || 'patient'
    fetch(`${API_URL}/predictions?user_id=${user.id}`, {
      headers: {'ngrok-skip-browser-warning': 'true', 'role': role }
    })
    .then(res => res.json())
    .then(data => {
      if (data.predictions) setPredictions(data.predictions)
    })
  }

  return (
    <div>
      <h2>My Prediction History</h2>
      {predictions.length === 0 ? (
        <p>No predictions yet. Make your first prediction!</p>
      ) : (
        <ul className="user-list">
          {predictions.map((p) => (
            <li key={p.id} className="user-item">
              <span className="user-id">#{p.id}</span>
              <span className="user-name">
                {p.prediction_result === 1 ? '🟠 Diabetic' : '🟢 Non-Diabetic'}
              </span>
              <span className="user-email">Risk: {p.risk_percentage}%</span>
              <span className="user-role">{new Date(p.created_at).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Patient_History