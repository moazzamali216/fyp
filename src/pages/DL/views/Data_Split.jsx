// components/Data_Table.jsx
import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL;

function Data_Split() {
  const [trainData, setTrainData] = useState([])
  const [testData, setTestData] = useState([])
  const [loading, setLoading] = useState(false)
  const [splitting, setSplitting] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('train')

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null')

  const fetchSplitData = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/admin/model-data/split`, {
        headers: {"ngrok-skip-browser-warning": "true", 'role': currentUser?.role || 'admin' }
      })
      const result = await response.json()

      if (result.error) {
        setError(result.error)
        setTrainData([])
        setTestData([])
      } else {
        setTrainData(result.train || [])
        setTestData(result.test || [])
      }
    } catch (err) {
      console.error('Error fetching split data:', err)
      setError('Failed to connect to server')
      setTrainData([])
      setTestData([])
    } finally {
      setLoading(false)
    }
  }

  const handleSplit = async () => {
    setSplitting(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/admin/model-data/split`, {
        method: 'POST',
        headers: {"ngrok-skip-browser-warning": "true", 'role': currentUser?.role || 'admin' }
      })
      const result = await response.json()

      if (result.error) {
        setError(result.error)
      } else {
        await fetchSplitData()
      }
    } catch (err) {
      console.error('Split error:', err)
      setError('Split request failed')
    } finally {
      setSplitting(false)
    }
  }

  useEffect(() => {
    fetchSplitData()
  }, [])

  const hasData = trainData.length > 0 || testData.length > 0
  const activeData = activeTab === 'train' ? trainData : testData
  const activeColor = activeTab === 'train' ? '#0d5c63' : '#d97706'

const renderTable = (rows) => {
  if (rows.length === 0) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        color: '#6c757d'
      }}>
        <p style={{ margin: 0 }}>📭 No data in this set</p>
      </div>
    )
  }

  // Hide the 'id' column on the frontend
  const columns = Object.keys(rows[0]).filter(col => col !== 'id')

  return (
    <div style={{
      overflowX: 'auto',
      border: '1px solid #ddd',
      borderRadius: '8px',
      width: "950px"
    }}>
      <table style={{
        width: '2000px',
        borderCollapse: 'collapse',
        fontSize: '13px'
      }}>
        <thead>
          <tr style={{ backgroundColor: activeColor }}>
            {columns.map((col) => (
              <th key={col} style={{
                padding: '10px 12px',
                textAlign: 'left',
                color: 'white',
                whiteSpace: 'nowrap',
                minWidth: '90px'
              }}>
                {col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} style={{
              backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white'
            }}>
              {columns.map((col) => (
                <td key={col} style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid #eee',
                  whiteSpace: 'nowrap'
                }}>
                  {row[col] !== null && row[col] !== undefined
                    ? typeof row[col] === 'number'
                      ? (row[col].toFixed ? row[col].toFixed(3) : String(row[col]))
                      : String(row[col])
                    : 'N/A'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

  // Tab button component
  const Tab = ({ id, label, count, color }) => {
    const isActive = activeTab === id
    return (
      <button
        onClick={() => setActiveTab(id)}
        style={{
          padding: '10px 24px',
          backgroundColor: isActive ? color : 'transparent',
          color: isActive ? 'white' : '#555',
          border: 'none',
          borderBottom: isActive ? `3px solid ${color}` : '3px solid transparent',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          transition: 'all 0.2s ease',
          borderTopLeftRadius: '6px',
          borderTopRightRadius: '6px'
        }}
      >
        {label} ({count})
      </button>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '100%', overflowX: 'auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <h2 style={{ margin: 0, color: '#0d5c63' }}>
          📊 Train / Test Split
        </h2>
                <p style={{ margin: 0, color: '#0d5c63' }}>
      Please split it again if the old data is being displayed, so that the new data is shown correctly.
        </p>


        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSplit}
            disabled={splitting}
            style={{
              padding: '12px 24px',
              backgroundColor: '#0d5c63',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: splitting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              opacity: splitting ? 0.7 : 1
            }}
          >
            {splitting ? 'Splitting...' : '✂️ Split 80/20'}
          </button>

          <button
            onClick={fetchSplitData}
            disabled={loading}
            style={{
              padding: '12px 24px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Content */}
      {loading && !hasData ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner"></div>
        </div>
      ) : !hasData ? (
        <div style={{
          padding: '60px 40px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          color: '#6c757d'
        }}>
          <p style={{ fontSize: '18px', margin: '0 0 10px 0' }}>
            📭 No train / test data available
          </p>
          <p style={{ fontSize: '14px', margin: 0 }}>
            Click "Split 70/30" to generate training and testing sets from model_data
          </p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '4px',
            borderBottom: '2px solid #e0e0e0',
            marginBottom: '15px'
          }}>
            <Tab
              id="train"
              label="🧠 Training Set"
              count={trainData.length}
              color="#0d5c63"
            />
            <Tab
              id="test"
              label="🧪 Testing Set"
              count={testData.length}
              color="#d97706"
            />
          </div>

          {/* Active table */}
          {renderTable(activeData)}
        </>
      )}

      {/* Spinner CSS */}
      <style>{`
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #0d5c63;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default Data_Split