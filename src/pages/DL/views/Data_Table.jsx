// components/Data_Table.jsx
import { useState, useEffect, useRef } from 'react'

// Add this at the top - same pattern as Data_Process
const API_URL = import.meta.env.VITE_API_URL;

function Data_Table() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [error, setError] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const fileInputRef = useRef(null)
  
  const [showFullData, setShowFullData] = useState(false)
  const PREVIEW_LIMIT = 25

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null')

  // Sort data by ID in ascending order
  const sortDataById = (dataArray) => {
    return [...dataArray].sort((a, b) => (a.id || 0) - (b.id || 0))
  }

  // Fetch all data - UPDATED with API_URL
  const fetchData = () => {
    setLoading(true)
    setError('')
    
    fetch(`${API_URL}/admin/dl-table`, {
      headers: { 'role': currentUser?.role || 'admin' }
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        setError(data.error)
      } else {
        setData(sortDataById(data.data || []))
      }
      setLoading(false)
    })
    .catch(() => {
      setError('Failed to fetch data')
      setLoading(false)
    })
  }

  // Export CSV - UPDATED with API_URL
  const handleExportCSV = () => {
    setExportLoading(true)
    fetch(`${API_URL}/admin/dl-table/export`, {
      headers: { 'role': currentUser?.role || 'admin' }
    })
    .then(res => {
      if (!res.ok) throw new Error('Export failed')
      return res.blob()
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dl_data_export_${new Date().toISOString().slice(0,10)}.csv`
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

  // Download full dataset as CSV - No API call needed, uses local data
  const handleDownloadFullDataset = () => {
    if (data.length === 0) {
      alert('No data to download')
      return
    }

    const headers = Object.keys(data[0])
    let csvContent = headers.join(',') + '\n'
    
    data.forEach(row => {
      const values = headers.map(header => {
        let value = row[header] !== undefined && row[header] !== null ? row[header] : ''
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          value = `"${value.replace(/"/g, '""')}"`
        }
        return value
      })
      csvContent += values.join(',') + '\n'
    })
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `dl_full_dataset_${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Parse CSV file
  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim() !== '')
    const headers = lines[0].split(',').map(header => header.trim().toLowerCase())
    
    const rows = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',')
      const row = {}
      
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || ''
      })
      
      rows.push(row)
    }
    
    return { headers, rows }
  }

  // Validate CSV
  const validateCSV = (headers, rows) => {
    const requiredColumns = ['id', 'preg', 'plas', 'pres', 'skin', 'test', 'mass', 'pedi', 'age', 'class']
    const missingColumns = requiredColumns.filter(col => !headers.includes(col))
    
    if (missingColumns.length > 0) {
      return {
        valid: false,
        error: `Missing required columns: ${missingColumns.join(', ')}`
      }
    }
    
    if (rows.length === 0) {
      return {
        valid: false,
        error: 'CSV file has no data rows'
      }
    }
    
    
    return {
      valid: true,
      error: null
    }
  }

  // Handle file selection - UPDATED with API_URL
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      setImportMessage('❌ Please upload a CSV file')
      return
    }

    setImportLoading(true)
    setImportMessage('')

    const dataBackup = [...data]

    const reader = new FileReader()
    
    reader.onload = (event) => {
      const text = event.target.result
      const { headers, rows } = parseCSV(text)
      
      const validation = validateCSV(headers, rows)
      
      if (!validation.valid) {
        setImportMessage(`❌ ${validation.error}`)
        setImportLoading(false)
        return
      }
      
      const formData = new FormData()
      const blob = new Blob([text], { type: 'text/csv' })
      formData.append('file', blob, file.name)
      
      fetch(`${API_URL}/admin/dl-table/import`, {
        method: 'POST',
        headers: { 'role': currentUser?.role || 'admin' },
        body: formData
      })
      .then(res => res.json())
      .then(response => {
        setImportLoading(false)
        
        if (response.error) {
          if (response.critical) {
            setImportMessage(`🚨 CRITICAL: ${response.error}`)
            fetchData()
          } else if (response.restored_count) {
            setImportMessage(`❌ ${response.error} (${response.restored_count} records restored)`)
            fetchData()
          } else {
            setImportMessage(`❌ ${response.error}`)
            if (dataBackup.length > 0) {
              setData(sortDataById(dataBackup))
              setImportMessage(`❌ ${response.error} - Previous data restored from backup (${dataBackup.length} records)`)
            }
          }
        } else {
          setImportMessage(`✅ ${response.message}`)
          fetchData()
          setTimeout(() => {
            setShowImportModal(false)
            setImportMessage('')
          }, 2000)
        }
      })
      .catch((error) => {
        setImportLoading(false)
        setImportMessage('❌ Import failed: Network error')
        if (dataBackup.length > 0) {
          setData(sortDataById(dataBackup))
          setImportMessage(`❌ Import failed - Previous data restored from backup (${dataBackup.length} records)`)
        }
        console.error('Import error:', error)
      })
    }
    
    reader.onerror = () => {
      setImportLoading(false)
      setImportMessage('❌ Failed to read file')
      if (dataBackup.length > 0) {
        setData(sortDataById(dataBackup))
      }
    }
    
    reader.readAsText(file)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Calculate statistics
  const calculateStats = () => {
    if (!data || data.length === 0) return null

    const numericColumns = Object.keys(data[0]).filter(key => {
      const value = data[0][key]
      return typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)))
    })

    const stats = {}

    numericColumns.forEach(column => {
      const values = data.map(row => parseFloat(row[column])).filter(val => !isNaN(val))
      
      if (values.length === 0) return

      const sum = values.reduce((a, b) => a + b, 0)
      const mean = sum / values.length
      const sortedValues = [...values].sort((a, b) => a - b)
      const median = values.length % 2 === 0 
        ? (sortedValues[values.length / 2 - 1] + sortedValues[values.length / 2]) / 2
        : sortedValues[Math.floor(values.length / 2)]
      
      const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length
      const stdDev = Math.sqrt(variance)
      const min = Math.min(...values)
      const max = Math.max(...values)
      const range = max - min

      stats[column] = {
        mean: mean.toFixed(2),
        median: median.toFixed(2),
        stdDev: stdDev.toFixed(2),
        variance: variance.toFixed(2),
        min: min.toFixed(2),
        max: max.toFixed(2),
        range: range.toFixed(2),
        count: values.length
      }
    })

    return stats
  }

  const stats = calculateStats()

  // Get preview data (first 25 rows) - SORTED BY ID
  const previewData = sortDataById(data.slice(0, PREVIEW_LIMIT))
  const hasMoreData = data.length > PREVIEW_LIMIT

  if (loading && data.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="users-management">
      {/* Header */}
      <div className="users-header">
        <div>
          <h2>Data Table</h2>
          <p className="subtitle">Training Data Records & Statistics</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-export" 
            onClick={() => setShowImportModal(true)}
            style={{ width: 'fit-content', padding: '8px 16px' }}
          >
            📤 Import CSV
          </button>
          <button 
            className="btn btn-export" 
            onClick={handleExportCSV}
            disabled={exportLoading || loading}
            style={{ width: 'fit-content', padding: '8px 16px' }}
          >
            {exportLoading ? 'Exporting...' : '📥 Download CSV'}
          </button>
          <button 
            className="btn btn-export" 
            onClick={fetchData}
            disabled={loading}
            style={{ width: 'fit-content', padding: '8px 16px' }}
          >
            {loading ? 'Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="message error" style={{ marginBottom: '15px' }}>
          ❌ {error}
        </div>
      )}

      {/* Statistics Section */}
      {stats && Object.keys(stats).length > 0 && (
        <div style={{
          marginBottom: '25px',
          padding: '20px',
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E8EAF6',
          boxShadow: '0 2px 8px rgba(26, 35, 126, 0.06)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#283593', fontSize: '18px' }}>
            📊 Statistics Summary
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {Object.entries(stats).map(([column, colStats]) => (
              <div key={column} style={{
                padding: '15px',
                background: '#F8FAFC',
                borderRadius: '8px',
                border: '1px solid #E8EAF6'
              }}>
                <h4 style={{ 
                  margin: '0 0 10px 0', 
                  color: '#283593', 
                  fontSize: '14px',
                  textTransform: 'capitalize'
                }}>
                  {column.replace(/_/g, ' ')}
                </h4>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px'
                }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#757575' }}>Mean</span>
                    <div style={{ fontWeight: '600', fontSize: '16px' }}>{colStats.mean}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#757575' }}>Median</span>
                    <div style={{ fontWeight: '600', fontSize: '16px' }}>{colStats.median}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#757575' }}>Std Dev</span>
                    <div style={{ fontWeight: '600', fontSize: '16px' }}>{colStats.stdDev}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#757575' }}>Variance</span>
                    <div style={{ fontWeight: '600', fontSize: '16px' }}>{colStats.variance}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#757575' }}>Min</span>
                    <div style={{ fontWeight: '600', fontSize: '16px' }}>{colStats.min}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#757575' }}>Max</span>
                    <div style={{ fontWeight: '600', fontSize: '16px' }}>{colStats.max}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#757575' }}>Range</span>
                    <div style={{ fontWeight: '600', fontSize: '16px' }}>{colStats.range}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#757575' }}>Count</span>
                    <div style={{ fontWeight: '600', fontSize: '16px' }}>{colStats.count}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Table - Preview Mode */}
      <div style={{
        marginBottom: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        background: '#F5F5F5',
        borderRadius: '6px',
        border: '1px solid #E0E0E0'
      }}>
        <div style={{ fontSize: '14px', color: '#757575' }}>
          {data.length === 0 ? (
            <span>📋 No records found</span>
          ) : hasMoreData ? (
            <>
              <span>🔍 Showing <strong>first {Math.min(PREVIEW_LIMIT, data.length)}</strong> rows</span>
              <span style={{ marginLeft: '10px', fontSize: '12px', color: '#EF5350' }}>
                ({data.length - PREVIEW_LIMIT} additional rows hidden)
              </span>
            </>
          ) : (
            <span>📋 Showing all <strong>{data.length}</strong> rows</span>
          )}
        </div>
        {hasMoreData && (
          <div style={{ fontSize: '13px', color: '#757575' }}>
            💡 Click "Download Full Dataset" to view all data
          </div>
        )}
      </div>

      <div className="table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              {previewData.length > 0 && Object.keys(previewData[0]).map((key) => (
                <th key={key}>
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewData.length === 0 ? (
              <tr>
                <td colSpan={Object.keys(previewData[0] || {}).length || 1} className="no-results">
                  <div className="no-results-content">
                    <span className="no-results-icon">🔍</span>
                    <p>No records found</p>
                  </div>
                </td>
              </tr>
            ) : (
              previewData.map((row) => (
                <tr key={row.id}>
                  {Object.entries(row).map(([key, value]) => {
                    // Check if value is null or undefined
                    let displayValue = value;
                    let cellStyle = {};
                    
                    if (value === null || value === undefined) {
                      displayValue = '⚠️ NULL';
                      cellStyle = {
                        color: '#E65100',
                        fontWeight: 'bold',
                        backgroundColor: '#FFE0B2'
                      };
                    } else if (typeof value === 'number' && isNaN(value)) {
                      displayValue = '⚠️ NULL';
                      cellStyle = {
                        color: '#E65100',
                        fontWeight: 'bold',
                        backgroundColor: '#FFE0B2'
                      };
                    } else if (typeof value === 'string' && value.trim() === '') {
                      displayValue = '⚠️ NULL';
                      cellStyle = {
                        color: '#E65100',
                        fontWeight: 'bold',
                        backgroundColor: '#FFE0B2'
                      };
                    } else {
                      displayValue = String(value);
                    }
                    
                    return (
                      <td key={key} style={cellStyle}>
                        {displayValue}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Show "View Full Dataset" button below table */}
      {hasMoreData && (
        <div style={{
          marginTop: '15px',
          textAlign: 'center',
          padding: '15px',
          background: '#F8FAFC',
          borderRadius: '8px',
          border: '1px dashed #C5CAE9'
        }}>
          <p style={{ margin: '0 0 10px 0', color: '#757575', fontSize: '14px' }}>
            {data.length - PREVIEW_LIMIT} more records not shown in preview
          </p>
          <button
            onClick={handleDownloadFullDataset}
            style={{
              padding: '10px 30px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#388E3C'
              e.target.style.transform = 'scale(1.02)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#4CAF50'
              e.target.style.transform = 'scale(1)'
            }}
          >
            📥 Download Full Dataset ({data.length} rows)
          </button>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay import-modal" onClick={() => setShowImportModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>📤 Import CSV Data</h3>
            </div>
            <div className="modal-body">
              <div style={{
                padding: '10px',
                background: '#E8EAF6',
                borderRadius: '8px',
                marginBottom: '15px',
                fontSize: '13px',
                color: '#757575'
              }}>
                <strong>Required Columns:</strong>
                <div style={{ marginTop: '5px', fontSize: '12px' }}>
                  id, preg, plas, pres, skin, test, mass, pedi, age, class
                </div>
              </div>

              <div style={{
                border: '2px dashed #E0E0E0',
                borderRadius: '12px',
                padding: '30px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.target.style.borderColor = '#283593'
                e.target.style.background = '#E8EAF6'
              }}
              onDragLeave={(e) => {
                e.target.style.borderColor = '#E0E0E0'
                e.target.style.background = 'transparent'
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.target.style.borderColor = '#E0E0E0'
                e.target.style.background = 'transparent'
                const file = e.dataTransfer.files[0]
                if (file) {
                  handleFileSelect({ target: { files: [file] } })
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              >
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>📁</div>
                <p style={{ margin: '0 0 5px 0', fontWeight: '600' }}>
                  Drag & drop CSV file here
                </p>
                <p style={{ margin: '0', fontSize: '13px', color: '#757575' }}>
                  or click to browse files
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              {importMessage && (
                <div className={`message ${importMessage.includes('✅') ? 'success' : importMessage.includes('🚨') ? 'critical' : 'error'}`} style={{ 
                  marginTop: '15px',
                  ...(importMessage.includes('🚨') && {
                    backgroundColor: '#FF1744',
                    color: 'white',
                    fontWeight: 'bold',
                    padding: '15px',
                    borderRadius: '8px'
                  })
                }}>
                  {importMessage}
                </div>
              )}

              {importLoading && (
                <div style={{
                  textAlign: 'center',
                  padding: '10px',
                  marginTop: '10px'
                }}>
                  <div className="spinner"></div>
                  <p style={{ marginTop: '5px' }}>Importing data...</p>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-export"
                onClick={() => {
                  setShowImportModal(false)
                  setImportMessage('')
                  setImportLoading(false)
                }}
                disabled={importLoading}
                style={{ width: 'fit-content' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Count */}
      <div style={{
        marginTop: '15px',
        padding: '10px',
        background: '#E8EAF6',
        borderRadius: '8px',
        textAlign: 'center',
        color: '#757575',
        fontSize: '14px'
      }}>
        Total Records: {data.length} | Showing Preview: {Math.min(PREVIEW_LIMIT, data.length)} rows
        {hasMoreData && ` | ${data.length - PREVIEW_LIMIT} more rows available`}
      </div>
    </div>
  )
}

export default Data_Table