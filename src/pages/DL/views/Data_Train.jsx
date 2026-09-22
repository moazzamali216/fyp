import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL;

function Data_Train() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [selectedModel, setSelectedModel] = useState('all')

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null')

  const runTraining = async () => {
    setLoading(true)
    setError('')
    setSaveMessage('')

    try {
      const response = await fetch(`${API_URL}/admin/model-data/train-test`, {
        method: 'POST',
        headers: { 'role': currentUser?.role || 'admin' }
      })
      const result = await response.json()

      if (result.error) {
        setError(result.error)
        setResults(null)
      } else {
        setResults(result)
      }
    } catch (err) {
      console.error('Training error:', err)
      setError('Failed to connect to server')
      setResults(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runTraining()
  }, [])

const saveModel = async () => {
  if (!results || selectedModel === 'all') {
    setError('Pick a specific model to save first')
    return
  }

  setSaving(true)
  setError('')
  setSaveMessage('')

  const params = new URLSearchParams({
    name: selectedModel,
    model_route: `models/${selectedModel.replace(/\s+/g, '_').toLowerCase()}.pkl`
  })

  try {
    const response = await fetch(
      `${API_URL}/admin/model-data/save-model?${params}`,
      {
        method: 'POST',
        headers: {
          'role': currentUser?.role || 'admin'
        }
      }
    )
    const result = await response.json()

    if (result.error) {
      setError(result.error)
    } else {
      setSaveMessage(`✅ Saved "${result.model.name}"`)
    }
  } catch (err) {
    console.error('Save error:', err)
    setError('Failed to save model')
  } finally {
    setSaving(false)
  }
}

  const metricColor = (value) => {
    if (value >= 0.85) return '#2e7d32'
    if (value >= 0.7) return '#f9a825'
    return '#c62828'
  }

  const renderMetric = (label, value) => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '12px', color: '#757575', marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{
        fontSize: '18px',
        fontWeight: 'bold',
        color: metricColor(value)
      }}>
        {(value * 100).toFixed(1)}%
      </div>
    </div>
  )

  const renderConfusionMatrix = (cm) => {
    if (!cm || cm.length !== 2) return null
    const [[tn, fp], [fn, tp]] = cm

    return (
      <div style={{
        marginTop: '15px',
        padding: '12px',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        border: '1px solid #e0e0e0'
      }}>
        <div style={{
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#555',
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          Confusion Matrix
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '6px',
          maxWidth: '280px',
          margin: '0 auto'
        }}>
          <div style={{ padding: '8px', backgroundColor: '#e8f5e9', borderRadius: '4px', textAlign: 'center', fontSize: '12px' }}>
            <div style={{ color: '#666', fontSize: '10px' }}>TN</div>
            <div style={{ fontWeight: 'bold', color: '#2e7d32', fontSize: '16px' }}>{tn}</div>
          </div>
          <div style={{ padding: '8px', backgroundColor: '#ffebee', borderRadius: '4px', textAlign: 'center', fontSize: '12px' }}>
            <div style={{ color: '#666', fontSize: '10px' }}>FP</div>
            <div style={{ fontWeight: 'bold', color: '#c62828', fontSize: '16px' }}>{fp}</div>
          </div>
          <div style={{ padding: '8px', backgroundColor: '#ffebee', borderRadius: '4px', textAlign: 'center', fontSize: '12px' }}>
            <div style={{ color: '#666', fontSize: '10px' }}>FN</div>
            <div style={{ fontWeight: 'bold', color: '#c62828', fontSize: '16px' }}>{fn}</div>
          </div>
          <div style={{ padding: '8px', backgroundColor: '#e8f5e9', borderRadius: '4px', textAlign: 'center', fontSize: '12px' }}>
            <div style={{ color: '#666', fontSize: '10px' }}>TP</div>
            <div style={{ fontWeight: 'bold', color: '#2e7d32', fontSize: '16px' }}>{tp}</div>
          </div>
        </div>
      </div>
    )
  }

  if (loading && !results) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        gap: '15px'
      }}>
        <div className="spinner"></div>
        <p style={{ color: '#0d5c63', fontWeight: 'bold' }}>
          Training 4 models... this may take a moment.
        </p>
      </div>
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
          🧠 Model Training & Evaluation
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#0d5c63' }}>
            Select:
          </label>

          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={loading || saving}
            style={{
              padding: '10px 14px',
              borderRadius: '6px',
              border: '1px solid #0d5c63',
              backgroundColor: 'white',
              color: '#0d5c63',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: (loading || saving) ? 'not-allowed' : 'pointer',
              opacity: (loading || saving) ? 0.7 : 1,
              minWidth: '180px'
            }}
          >
            <option value="all">🏆 All Models</option>
            <option value="Neural Network">🧠 Neural Network</option>
            <option value="Support Vector Machine">📐 Support Vector Machine</option>
            <option value="Decision Tree">🌳 Decision Tree</option>
            <option value="Logistic Regression">📈 Logistic Regression</option>
          </select>

          <button
            onClick={saveModel}
            disabled={loading || saving || selectedModel === 'all'}
            style={{
              padding: '12px 24px',
              backgroundColor: '#0d5c63',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: (loading || saving || selectedModel === 'all') ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              opacity: (loading || saving || selectedModel === 'all') ? 0.7 : 1
            }}
          >
            {saving ? 'Saving...' : 'Save Model'}
          </button>

          <button
            onClick={runTraining}
            disabled={loading || saving}
            style={{
              padding: '12px 24px',
              backgroundColor: '#0d5c63',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: (loading || saving) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              opacity: (loading || saving) ? 0.7 : 1
            }}
          >
            {loading ? 'Training...' : '🚀 Retrain Models'}
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

      {/* Save success */}
      {saveMessage && (
        <div style={{
          padding: '15px',
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #a5d6a7'
        }}>
          {saveMessage}
        </div>
      )}

      {/* Summary */}
      {results && (
        <>
          <div style={{
            padding: '15px',
            backgroundColor: '#e8f5e9',
            border: '1px solid #a5d6a7',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            gap: '25px',
            flexWrap: 'wrap',
            fontSize: '14px',
            color: '#2e7d32'
          }}>
            <span>🏋️ Train rows: <strong>{results.train_count}</strong></span>
            <span>🧪 Test rows: <strong>{results.test_count}</strong></span>
            <span>📊 Features: <strong>{results.feature_count}</strong></span>
            {results.best_model && (
              <span>🏆 Best: <strong>{results.best_model}</strong></span>
            )}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {results.results.map((r) => (
              <div
                key={r.model}
                style={{
                  padding: '20px',
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '10px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                }}
              >
                <h3 style={{
                  margin: '0 0 15px 0',
                  color: '#0d5c63',
                  fontSize: '16px',
                  borderBottom: '2px solid #0d5c63',
                  paddingBottom: '8px'
                }}>
                  {r.model}
                </h3>

                {r.error ? (
                  <div style={{ color: '#c62828', fontSize: '13px' }}>
                    ❌ {r.error}
                  </div>
                ) : (
                  <>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '15px',
                      marginBottom: '10px'
                    }}>
                      {renderMetric('Accuracy', r.accuracy)}
                      {renderMetric('Precision', r.precision)}
                      {renderMetric('Recall', r.recall)}
                      {renderMetric('F1 Score', r.f1_score)}
                    </div>
                    {renderConfusionMatrix(r.confusion_matrix)}
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty */}
      {!loading && !error && !results && (
        <div style={{
          padding: '60px 40px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          color: '#6c757d'
        }}>
          <p style={{ fontSize: '18px', margin: 0 }}>
            Click "Retrain Models" to run the evaluation
          </p>
        </div>
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

export default Data_Train