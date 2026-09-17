import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL;

function Admin_Predictions({ user }) {
  const [predictions, setPredictions] = useState([])
  const [exportLoading, setExportLoading] = useState(false)
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('')
  const [searchFilter, setSearchFilter] = useState('all') // all, name, email, result, risk

  useEffect(() => {
    fetchPredictions()
  }, [])

  const fetchPredictions = () => {
    fetch(`${API_URL}/predictions`, {
      headers: {"ngrok-skip-browser-warning": "true", 'role': 'admin' }
    })
    .then(res => res.json())
    .then(data => {
      if (data.predictions) setPredictions(data.predictions)
    })
  }

  const handleExportCSV = () => {
    setExportLoading(true)
    fetch(`${API_URL}/predictions/export`, {
      headers: {"ngrok-skip-browser-warning": "true", 'role': 'admin' }
    })
    .then(res => {
      if (!res.ok) throw new Error('Export failed')
      return res.blob()
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `predictions_${new Date().toISOString().slice(0,10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      setExportLoading(false)
    })
    .catch(() => {
      alert('Failed to export data')
      setExportLoading(false)
    })
  }

  // Filter predictions based on search
  const filteredPredictions = predictions.filter(p => {
    if (!searchTerm.trim()) return true
    
    const searchLower = searchTerm.toLowerCase().trim()
    const patientName = p.users?.name?.toLowerCase() || ''
    const patientEmail = p.users?.email?.toLowerCase() || ''
    const resultText = p.prediction_result === 1 ? 'diabetic' : 'non-diabetic'
    const riskText = p.risk_percentage?.toString() || ''
    const idText = p.id?.toString() || ''
    const dateText = new Date(p.created_at).toLocaleDateString() || ''
    
    switch (searchFilter) {
      case 'name':
        return patientName.includes(searchLower)
      case 'email':
        return patientEmail.includes(searchLower)
      case 'result':
        return resultText.includes(searchLower)
      case 'risk':
        return riskText.includes(searchLower)
      default:
        return (
          patientName.includes(searchLower) ||
          patientEmail.includes(searchLower) ||
          resultText.includes(searchLower) ||
          riskText.includes(searchLower) ||
          idText.includes(searchLower) ||
          dateText.includes(searchLower)
        )
    }
  })

  // Get stats for filtered predictions
  const totalDiabetic = filteredPredictions.filter(p => p.prediction_result === 1).length
  const totalNonDiabetic = filteredPredictions.filter(p => p.prediction_result === 0).length
  const avgRisk = filteredPredictions.length > 0 
    ? Math.round(filteredPredictions.reduce((sum, p) => sum + p.risk_percentage, 0) / filteredPredictions.length)
    : 0

  // Clear search
  const clearSearch = () => {
    setSearchTerm('')
    setSearchFilter('all')
  }

  return (
    <div>
      {/* Header */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
        <div>
          <h2 style={{margin: 0}}>All Patient Predictions</h2>
          <p className="subtitle">Total: {predictions.length} predictions</p>
        </div>
        <button style={{width:"fit-content"}}
          className="btn btn-export" 
          onClick={handleExportCSV}
          disabled={exportLoading}
        >
          {exportLoading ? 'Exporting...' : '📥 Download CSV'}
        </button>
      </div>

      {/* Stats Summary */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <span style={{
          padding: '6px 16px',
          borderRadius: '20px',
          background: '#E8EAF6',
          color: '#283593',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          📊 Total: {filteredPredictions.length}
        </span>
        <span style={{
          padding: '6px 16px',
          borderRadius: '20px',
          background: '#FFEBEE',
          color: '#E53935',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          🔴 Diabetic: {totalDiabetic}
        </span>
        <span style={{
          padding: '6px 16px',
          borderRadius: '20px',
          background: '#E8F5E9',
          color: '#43A047',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          🟢 Non-Diabetic: {totalNonDiabetic}
        </span>
        {filteredPredictions.length > 0 && (
          <span style={{
            padding: '6px 16px',
            borderRadius: '20px',
            background: '#FFF3E0',
            color: '#FB8C00',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            📈 Avg Risk: {avgRisk}%
          </span>
        )}
      </div>

      {/* Search Bar */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginBottom: '20px',
        padding: '16px 20px',
        background: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E8EAF6',
        boxShadow: '0 2px 8px rgba(26, 35, 126, 0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          <span style={{ 
            position: 'absolute', 
            left: '14px', 
            fontSize: '16px',
            color: '#BDBDBD'
          }}>
            🔍
          </span>
          <input
            type="text"
            style={{
              width: '100%',
              padding: '10px 50px 10px 40px',
              border: '2px solid #E0E0E0',
              borderRadius: '10px',
              fontSize: '15px',
              transition: 'all 0.3s ease',
              background: '#FAFAFA'
            }}
            placeholder="Search predictions by name, email, result, risk %..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={(e) => e.target.style.borderColor = '#283593'}
            onBlur={(e) => e.target.style.borderColor = '#E0E0E0'}
          />
          {searchTerm && (
            <button
              style={{
                position: 'absolute',
                right: '14px',
                background: 'none',
                border: 'none',
                color: '#757575',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '50%'
              }}
              onClick={clearSearch}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', 'name', 'email', 'result', 'risk'].map((filter) => (
            <button
              key={filter}
              style={{
                padding: '4px 16px',
                border: `2px solid ${searchFilter === filter ? '#113d13' : '#E0E0E0'}`,
                borderRadius: '20px',
                background: searchFilter === filter ? '#113d13' : 'transparent',
                color: searchFilter === filter ? '#FFFFFF' : '#757575',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={() => setSearchFilter(filter)}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        {/* Search Results Summary */}
        {searchTerm && (
          <div style={{
            padding: '6px 14px',
            background: '#E8EAF6',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#757575'
          }}>
            Found <strong>{filteredPredictions.length}</strong> prediction(s) matching 
            "<strong>{searchTerm}</strong>"
            {searchFilter !== 'all' && ` in ${searchFilter}`}
            <button
              style={{
                background: 'none',
                border: 'none',
                color: '#283593',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '13px',
                marginLeft: '8px'
              }}
              onClick={clearSearch}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Predictions List */}
      {filteredPredictions.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#757575'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
          <p style={{ fontSize: '16px', margin: '0' }}>
            {searchTerm ? (
              <>No predictions found matching "<strong>{searchTerm}</strong>"</>
            ) : (
              'No predictions yet.'
            )}
          </p>
          {searchTerm && (
            <button
              style={{
                marginTop: '12px',
                padding: '8px 24px',
                border: '2px solid #283593',
                borderRadius: '20px',
                background: 'transparent',
                color: '#283593',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              onClick={clearSearch}
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <ul className="user-list" style={{ listStyle: 'none', padding: 0 }}>
          {filteredPredictions.map((p) => (
            <li key={p.id} className="user-item" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: '#FAFAFA',
              borderRadius: '8px',
              marginBottom: '8px',
              border: '1px solid #E8EAF6',
              flexWrap: 'wrap'
            }}>
              <span className="user-id" style={{ fontWeight: '600', color: '#757575', minWidth: '40px' }}>
                #{p.id}
              </span>
              <span className="user-name" style={{ fontWeight: '500', minWidth: '120px' }}>
                {p.users?.name || 'Unknown'}
              </span>
              <span className="user-email" style={{ color: '#757575', minWidth: '150px' }}>
                {p.users?.email || 'N/A'}
              </span>
              <span style={{
                padding: '4px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600',
                background: p.prediction_result === 1 ? '#FFEBEE' : '#E8F5E9',
                color: p.prediction_result === 1 ? '#E53935' : '#43A047'
              }}>
                {p.prediction_result === 1 ? '🔴 Diabetic' : '🟢 Non-Diabetic'}
              </span>
              <span style={{
                padding: '4px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600',
                background: p.risk_percentage > 70 ? '#FFEBEE' : 
                          p.risk_percentage > 40 ? '#FFF3E0' : '#E8F5E9',
                color: p.risk_percentage > 70 ? '#E53935' : 
                       p.risk_percentage > 40 ? '#FB8C00' : '#43A047'
              }}>
                Risk: {p.risk_percentage}%
              </span>
              <span style={{ color: '#BDBDBD', fontSize: '13px', marginLeft: 'auto' }}>
                {new Date(p.created_at).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Admin_Predictions