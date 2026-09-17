import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL;

function Admin_Dashboard_Stats({ user }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = () => {
    setLoading(true)
    fetch(`${API_URL}/admin/dashboard-stats`, {
      headers: {"ngrok-skip-browser-warning": "true", 'role': 'admin' }
    })
    .then(res => res.json())
    .then(data => {
      setLoading(false)
      if (data.error) {
        setError(data.error)
      } else {
        setStats(data)
      }
    })
    .catch(() => {
      setLoading(false)
      setError('Failed to fetch statistics')
    })
  }

  if (loading) {
    return (
      <div className="flex-center" style={{ padding: '40px' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="message error">
        ❌ {error}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="message info">
        No data available yet. Start making predictions!
      </div>
    )
  }

  // Prepare monthly trend data for display
  const months = Object.keys(stats.monthly_trend || {}).sort()
  const monthLabels = months.map(m => {
    const [year, month] = m.split('-')
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${monthNames[parseInt(month) - 1]} ${year}`
  })
  const monthData = months.map(m => stats.monthly_trend[m])

  return (
    <div className="admin-dashboard-stats">
      <div className="stats-header">
        <h2>📊 Dashboard Overview</h2>
        <p className="subtitle">Summary statistics and insights</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <span className="stat-number">{stats.total_patients}</span>
            <span className="stat-label">Total Patients</span>
          </div>
        </div>

        <div className="stat-card stat-card-success">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <span className="stat-number">{stats.total_predictions}</span>
            <span className="stat-label">Total Predictions</span>
          </div>
        </div>

        <div className="stat-card stat-card-danger">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <span className="stat-number">{stats.high_risk}</span>
            <span className="stat-label">High Risk Patients</span>
          </div>
        </div>

        <div className="stat-card stat-card-warning">
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <span className="stat-number">{stats.recent_predictions_count}</span>
            <span className="stat-label">Last 7 Days</span>
          </div>
        </div>
      </div>

      {/* Risk Distribution */}
      <div className="stats-section">
        <h3>Risk Level Distribution</h3>
        <div className="risk-distribution">
          <div className="risk-bar">
            <div 
              className="risk-bar-fill risk-high" 
              style={{ width: `${(stats.high_risk / stats.total_predictions * 100) || 0}%` }}
            />
            <span className="risk-label">High Risk ({stats.high_risk})</span>
          </div>
          <div className="risk-bar">
            <div 
              className="risk-bar-fill risk-medium" 
              style={{ width: `${(stats.medium_risk / stats.total_predictions * 100) || 0}%` }}
            />
            <span className="risk-label">Medium Risk ({stats.medium_risk})</span>
          </div>
          <div className="risk-bar">
            <div 
              className="risk-bar-fill risk-low" 
              style={{ width: `${(stats.low_risk / stats.total_predictions * 100) || 0}%` }}
            />
            <span className="risk-label">Low Risk ({stats.low_risk})</span>
          </div>
        </div>
      </div>

      {/* Prediction Results */}
      <div className="stats-section">
        <h3>Prediction Results</h3>
        <div className="result-grid">
          <div className="result-item result-diabetic">
            <span className="result-icon">🔴</span>
            <div>
              <span className="result-number">{stats.diabetic}</span>
              <span className="result-label">Diabetic</span>
            </div>
          </div>
          <div className="result-item result-non-diabetic">
            <span className="result-icon">🟢</span>
            <div>
              <span className="result-number">{stats.non_diabetic}</span>
              <span className="result-label">Non-Diabetic</span>
            </div>
          </div>
        </div>
      </div>

      {/* Average Metrics */}
      <div className="stats-section">
        <h3>Average Patient Metrics</h3>
        <div className="metrics-grid">
          <div className="metric-item">
            <span className="metric-label">Glucose</span>
            <span className="metric-value">{stats.avg_glucose}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">BMI</span>
            <span className="metric-value">{stats.avg_bmi}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Age</span>
            <span className="metric-value">{stats.avg_age}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Avg Risk</span>
            <span className="metric-value">{stats.avg_risk}%</span>
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      {months.length > 0 && (
        <div className="stats-section">
          <h3>Monthly Trend</h3>
          <div className="trend-chart">
            <div className="trend-labels">
              {monthLabels.map((label, i) => (
                <span key={i} className="trend-label">{label}</span>
              ))}
            </div>
            <div className="trend-bars">
              {monthData.map((data, i) => (
                <div key={i} className="trend-bar-group">
                  <div 
                    className="trend-bar trend-diabetic" 
                    style={{ height: `${(data.diabetic / (data.total || 1)) * 150 || 0}px` }}
                    title={`Diabetic: ${data.diabetic}`}
                  />
                  <div 
                    className="trend-bar trend-non-diabetic" 
                    style={{ height: `${(data.non_diabetic / (data.total || 1)) * 150 || 0}px` }}
                    title={`Non-Diabetic: ${data.non_diabetic}`}
                  />
                  <span className="trend-total">{data.total}</span>
                </div>
              ))}
            </div>
            <div className="trend-legend">
              <span><span className="legend-dot legend-diabetic"></span> Diabetic</span>
              <span><span className="legend-dot legend-non-diabetic"></span> Non-Diabetic</span>
            </div>
          </div>
        </div>
      )}

      {/* Risk Factors */}
      {Object.keys(stats.risk_factors || {}).length > 0 && (
        <div className="stats-section">
          <h3>Key Risk Factors (Diabetic Patients)</h3>
          <div className="factors-grid">
            {Object.entries(stats.risk_factors).map(([key, value]) => (
              <div key={key} className="factor-item">
                <span className="factor-label">{key.replace('_', ' ').toUpperCase()}</span>
                <span className="factor-value">{typeof value === 'number' ? value.toFixed(2) : value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patient Status */}
      <div className="stats-section">
        <h3>Patient Status</h3>
        <div className="status-grid">
          <div className="status-item status-with">
            <span className="status-number">{stats.patients_with_predictions}</span>
            <span className="status-label">With Predictions</span>
          </div>
          <div className="status-item status-without">
            <span className="status-number">{stats.patients_without_predictions}</span>
            <span className="status-label">Without Predictions</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Admin_Dashboard_Stats