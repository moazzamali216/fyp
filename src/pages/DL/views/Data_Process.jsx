// components/Data_Table.jsx
import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL;

function Data_Process() {
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dataQualityIssues, setDataQualityIssues] = useState([])
  const [showQualityReport, setShowQualityReport] = useState(true)
  const [cleaningLoading, setCleaningLoading] = useState(false)
  const [cleaningMessage, setCleaningMessage] = useState('')

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null')

  const fetchData = () => {
    setLoading(true)
    setError('')
    
    fetch(`${API_URL}/admin/dl-table`, {
      headers: {'ngrok-skip-browser-warning': 'true', 'role': currentUser?.role || 'admin' }
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        setError(data.error)
      } else {
        const rawData = data.data || []
        const sortedData = [...rawData].sort((a, b) => (a.id || 0) - (b.id || 0))
        setData(sortedData)
        setFilteredData(sortedData)
        analyzeDataQuality(sortedData)
      }
      setLoading(false)
    })
    .catch(() => {
      setError('Failed to fetch data')
      setLoading(false)
    })
  }

  const cleanData = () => {
    if (!data || data.length === 0) {
      setCleaningMessage('No data to clean')
      setTimeout(() => setCleaningMessage(''), 3000)
      return
    }

    setCleaningLoading(true)
    setCleaningMessage('⏳ Cleaning data...')
    setDataQualityIssues([])

    fetch(`${API_URL}/admin/dl-table/clean`, {
      method: 'POST',
      headers: {'ngrok-skip-browser-warning': 'true', 
        'role': currentUser?.role || 'admin',
        'Content-Type': 'application/json'
      }
    })
    .then(res => res.json())
    .then(response => {
      console.log('Clean response:', response)
      setCleaningLoading(false)
      
      if (response.error) {
        setCleaningMessage(`❌ ${response.error}`)
        setTimeout(() => setCleaningMessage(''), 5000)
        return
      }
      
      if (response.success) {
        console.log('Cleaning successful, fetching fresh data...')
        setLoading(true)
        
        fetch(`${API_URL}/admin/dl-table`, {
          headers: {'ngrok-skip-browser-warning': 'true', 'role': currentUser?.role || 'admin' }
        })
        .then(res => res.json())
        .then(freshData => {
          setLoading(false)
          if (freshData.error) {
            setError(freshData.error)
            setCleaningMessage(`❌ ${freshData.error}`)
          } else {
            const rawData = freshData.data || []
            const newData = [...rawData].sort((a, b) => (a.id || 0) - (b.id || 0))
            console.log('Fresh data fetched:', newData.length, 'records')
            
            setData(newData)
            setFilteredData(newData)
            analyzeDataQuality(newData)
            
            const changesCount = response.changes_count || 0
            if (changesCount > 0) {
              setCleaningMessage(`✅ Data cleaned! ${changesCount} issues fixed. ${newData.length} records updated.`)
            } else {
              setCleaningMessage('✅ Data is already clean! No changes needed.')
            }
            setTimeout(() => setCleaningMessage(''), 5000)
          }
        })
        .catch((err) => {
          setLoading(false)
          setError('Failed to refresh data after cleaning')
          console.error('Refresh error:', err)
          setCleaningMessage('⚠️ Data cleaned but failed to refresh. Please refresh manually.')
          setTimeout(() => setCleaningMessage(''), 5000)
        })
      } else {
        setCleaningMessage('❌ Failed to clean data')
        setTimeout(() => setCleaningMessage(''), 5000)
      }
    })
    .catch((error) => {
      setCleaningLoading(false)
      setCleaningMessage(`❌ Error cleaning data: ${error.message}`)
      setTimeout(() => setCleaningMessage(''), 5000)
      console.error('Clean error:', error)
    })
  }

  // Search function - filters by ID
  const handleSearch = (e) => {
    const term = e.target.value
    setSearchTerm(term)
    
    if (!term || term.trim() === '') {
      setFilteredData(data)
      return
    }

    const searchId = parseInt(term.trim())
    
    if (isNaN(searchId)) {
      setFilteredData([])
      return
    }

    const filtered = data.filter(row => row.id === searchId)
    setFilteredData(filtered)
  }

  // Clear search
  const clearSearch = () => {
    setSearchTerm('')
    setFilteredData(data)
  }

  const analyzeDataQuality = (dataset) => {
    if (!dataset || dataset.length === 0) {
      setDataQualityIssues([{ category: 'Info', message: 'No data to analyze' }])
      return
    }

    const issues = []
    const columns = Object.keys(dataset[0] || {})
    
    columns.forEach(col => {
      const missingCount = dataset.filter(row => {
        const val = row[col]
        return val === null || 
               val === undefined || 
               val === '' || 
               (typeof val === 'number' && isNaN(val)) ||
               (typeof val === 'string' && val.trim() === '')
      }).length
      
      if (missingCount > 0) {
        const percentage = ((missingCount / dataset.length) * 100).toFixed(1)
        issues.push({
          category: 'Missing Values',
          severity: missingCount > dataset.length * 0.2 ? 'High' : 'Medium',
          message: `Column "${col}" has ${missingCount} missing values (${percentage}% of data)`,
          count: missingCount,
          column: col,
          type: 'missing'
        })
      }
    })

    const seen = new Set()
    const duplicateIndices = []
    dataset.forEach((row, index) => {
      const rowStr = JSON.stringify(row)
      if (seen.has(rowStr)) {
        duplicateIndices.push(index)
      } else {
        seen.add(rowStr)
      }
    })
    
    if (duplicateIndices.length > 0) {
      issues.push({
        category: 'Duplicate Records',
        severity: duplicateIndices.length > 10 ? 'High' : 'Medium',
        message: `Found ${duplicateIndices.length} duplicate records in the dataset`,
        count: duplicateIndices.length,
        type: 'duplicate',
        indices: duplicateIndices
      })
    }

    const numericColumns = ['preg', 'plas', 'pres', 'skin', 'test', 'mass', 'pedi', 'age']
    
    const customBounds = {
      'preg': { min: 0, max: 17 },
      'plas': { min: 70, max: 200 },
      'pres': { min: 40, max: 120 },
      'skin': { min: 0, max: 50 },
      'test': { min: 0, max: 500 },
      'mass': { min: 15, max: 60 },
      'pedi': { min: 0, max: 1.0 },
      'age': { min: 21, max: 80 }
    }
    
    numericColumns.forEach(col => {
      if (columns.includes(col) && customBounds[col]) {
        const { min, max } = customBounds[col]
        
        const outliers = dataset.filter((row) => {
          const val = Number(row[col])
          if (isNaN(val) || val === null || val === undefined) return false
          return val < min || val > max
        })
        
        if (outliers.length > 0) {
          const outlierIndices = []
          dataset.forEach((row, index) => {
            const val = Number(row[col])
            if (!isNaN(val) && (val < min || val > max)) {
              outlierIndices.push(index)
            }
          })
          
          issues.push({
            category: 'Outliers',
            severity: outliers.length > 5 ? 'High' : 'Medium',
            message: `Column "${col}" has ${outliers.length} outliers (outside ${min} - ${max} range)`,
            count: outliers.length,
            column: col,
            type: 'outlier',
            lowerBound: min,
            upperBound: max,
            indices: outlierIndices
          })
        }
      }
    })

    columns.forEach(col => {
      const types = {}
      dataset.forEach(row => {
        const val = row[col]
        if (val !== null && val !== undefined && val !== '') {
          let type = typeof val
          
          if (type === 'number') {
            type = 'numeric'
          } else if (type === 'string' && !isNaN(Date.parse(val))) {
            type = 'date'
          } else if (type === 'string' && !isNaN(Number(val)) && val.trim() !== '') {
            type = 'numeric'
          }
          
          types[type] = (types[type] || 0) + 1
        }
      })
      
      const typeKeys = Object.keys(types)
      
      if (typeKeys.length > 1) {
        const nonNumericTypes = typeKeys.filter(type => type !== 'numeric')
        
        if (nonNumericTypes.length > 0) {
          const totalValues = dataset.filter(row => 
            row[col] !== null && row[col] !== undefined && row[col] !== ''
          ).length
          
          const significantTypes = typeKeys.filter(type => 
            (types[type] / totalValues) > 0.05
          )
          
          if (significantTypes.length > 1) {
            const typeDetails = significantTypes.map(type => 
              `${type} (${types[type]} rows)`
            ).join(', ')
            
            issues.push({
              category: 'Inconsistent Data Types',
              severity: 'Medium',
              message: `Column "${col}" has mixed data types: ${typeDetails}`,
              count: typeKeys.length,
              column: col,
              type: 'inconsistent_types',
              details: types
            })
          }
        }
      }
    })

    const severityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 }
    issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    
    setDataQualityIssues(issues)
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (searchTerm && searchTerm.trim() !== '') {
      const searchId = parseInt(searchTerm.trim())
      if (!isNaN(searchId)) {
        const filtered = data.filter(row => row.id === searchId)
        setFilteredData(filtered)
      }
    } else {
      setFilteredData(data)
    }
  }, [data])

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'High': return '#EF5350'
      case 'Medium': return '#FFA726'
      case 'Low': return '#66BB6A'
      default: return '#757575'
    }
  }

  const getSeverityBadge = (severity) => {
    const colors = {
      'High': '#EF5350',
      'Medium': '#FFA726',
      'Low': '#66BB6A'
    }
    return {
      backgroundColor: colors[severity] || '#757575',
      color: 'white',
      padding: '2px 10px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '600',
      display: 'inline-block'
    }
  }

  const hasCellIssue = (row, col, index) => {
    return dataQualityIssues.some(issue => {
      if (issue.column === col) {
        const val = row[col]
        if (issue.type === 'missing') {
          return val === null || val === undefined || val === '' || 
                 (typeof val === 'number' && isNaN(val)) ||
                 (typeof val === 'string' && val.trim() === '')
        }
        if (issue.type === 'outlier' && issue.indices) {
          return issue.indices.includes(index)
        }
        if (issue.type === 'inconsistent_types') {
          const types = issue.details
          const typeKeys = Object.keys(types)
          const dominantType = typeKeys.reduce((a, b) => types[a] > types[b] ? a : b)
          let cellType = typeof val
          
          if (cellType === 'number') {
            cellType = 'numeric'
          } else if (cellType === 'string' && !isNaN(Date.parse(val))) {
            cellType = 'date'
          } else if (cellType === 'string' && !isNaN(Number(val)) && val.trim() !== '') {
            cellType = 'numeric'
          }
          
          return cellType !== dominantType && typeKeys.includes(cellType)
        }
      }
      return false
    })
  }

  const isDuplicateRow = (index) => {
    return dataQualityIssues.some(issue => 
      issue.type === 'duplicate' && issue.indices && issue.indices.includes(index)
    )
  }

  const formatCellValue = (value) => {
    if (value === null || value === undefined) {
      return '⚠️ NULL'
    }
    if (typeof value === 'string' && value.trim() === '') {
      return '⚠️ NULL'
    }
    if (typeof value === 'number' && isNaN(value)) {
      return '⚠️ NULL'
    }
    return String(value)
  }

  if (loading && data.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="users-management">
      {error && (
        <div className="message error" style={{ marginBottom: '15px' }}>
          ❌ {error}
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2>Data Cleaning & Null Filling</h2>
          <p className="subtitle">Data Preprocessing Records & Statistics</p>
        </div>
        <button
          onClick={cleanData}
          disabled={cleaningLoading || data.length === 0}
          style={{
            padding: '10px 24px',
            backgroundColor: cleaningLoading ? '#BDBDBD' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: cleaningLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            if (!cleaningLoading && data.length > 0) {
              e.target.style.backgroundColor = '#388E3C'
              e.target.style.transform = 'scale(1.02)'
            }
          }}
          onMouseLeave={(e) => {
            if (!cleaningLoading && data.length > 0) {
              e.target.style.backgroundColor = '#4CAF50'
              e.target.style.transform = 'scale(1)'
            }
          }}
        >
          {cleaningLoading ? '⏳ Cleaning...' : '🧹 Clean Data'}
        </button>
      </div>

      {cleaningMessage && (
        <div style={{
          marginBottom: '15px',
          padding: '12px 16px',
          backgroundColor: cleaningMessage.includes('✅') ? '#E8F5E9' : 
                          cleaningMessage.includes('⏳') ? '#FFF3E0' : 
                          cleaningMessage.includes('⚠️') ? '#FFF8E1' : '#FFEBEE',
          borderRadius: '8px',
          border: `1px solid ${cleaningMessage.includes('✅') ? '#4CAF50' : 
                               cleaningMessage.includes('⏳') ? '#FFA726' :
                               cleaningMessage.includes('⚠️') ? '#FFC107' : '#EF5350'}`,
          color: cleaningMessage.includes('✅') ? '#2E7D32' : 
                 cleaningMessage.includes('⏳') ? '#E65100' :
                 cleaningMessage.includes('⚠️') ? '#F57F17' : '#C62828',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {cleaningMessage}
        </div>
      )}

      {dataQualityIssues.length > 0 && dataQualityIssues[0].category !== 'Info' && (
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#FFF8E1',
          borderRadius: '8px',
          border: '1px solid #FFE082'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#E65100' }}>
              📊 Data Quality Report
            </h3>
            <button
              onClick={() => setShowQualityReport(!showQualityReport)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#E65100'
              }}
            >
              {showQualityReport ? '▼ Hide' : '▶ Show'}
            </button>
          </div>
          
          {showQualityReport && (
            <div>
              <div style={{
                display: 'flex',
                gap: '15px',
                flexWrap: 'wrap',
                marginBottom: '15px'
              }}>
                <span style={{ fontSize: '13px', color: '#555' }}>
                  <strong>Total Issues Found:</strong> {dataQualityIssues.length}
                </span>
                <span style={{ fontSize: '13px', color: '#555' }}>
                  <strong>High Severity:</strong> {dataQualityIssues.filter(i => i.severity === 'High').length}
                </span>
                <span style={{ fontSize: '13px', color: '#555' }}>
                  <strong>Medium Severity:</strong> {dataQualityIssues.filter(i => i.severity === 'Medium').length}
                </span>
                <span style={{ fontSize: '13px', color: '#555' }}>
                  <strong>Low Severity:</strong> {dataQualityIssues.filter(i => i.severity === 'Low').length}
                </span>
              </div>
              
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                background: 'white',
                borderRadius: '6px',
                padding: '5px'
              }}>
                {dataQualityIssues.map((issue, index) => (
                  <div key={index} style={{
                    padding: '8px 12px',
                    marginBottom: '4px',
                    backgroundColor: '#FAFAFA',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    borderLeft: `3px solid ${getSeverityColor(issue.severity)}`
                  }}>
                    <span style={getSeverityBadge(issue.severity)}>
                      {issue.severity}
                    </span>
                    <span style={{ fontSize: '13px', flex: 1 }}>
                      <strong>{issue.category}:</strong> {issue.message}
                    </span>
                    {issue.count && (
                      <span style={{
                        fontSize: '12px',
                        color: '#757575',
                        background: '#F5F5F5',
                        padding: '1px 8px',
                        borderRadius: '10px'
                      }}>
                        {issue.count}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '15px',
        background: 'white',
        padding: '8px 15px',
        borderRadius: '8px',
        border: '1px solid #E0E0E0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        maxWidth: '350px'
      }}>
        <span style={{ fontSize: '16px', color: '#757575' }}>🔍</span>
        <input
          type="text"
          placeholder="Search by ID..."
          value={searchTerm}
          onChange={handleSearch}
          style={{
            border: 'none',
            outline: 'none',
            fontSize: '14px',
            padding: '8px 0',
            width: '100%',
            color: '#333'
          }}
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            style={{
              background: 'none',
              border: 'none',
              color: '#757575',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '0 5px'
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Data Count with search results */}
      <div style={{
        marginBottom: '10px',
        fontSize: '13px',
        color: '#757575'
      }}>
        Showing {filteredData.length} of {data.length} records
        {searchTerm && ` (search: "${searchTerm}")`}
      </div>

      {/* Data Table */}
      <div className="table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
     <th style={{ backgroundColor: '#0d5c63', minWidth: '80px', color: 'white' }}>Status</th>
              {data.length > 0 && Object.keys(data[0]).map((key) => (
                <th key={key}>
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={Object.keys(data[0] || {}).length || 1} className="no-results">
                  <div className="no-results-content">
                    <span className="no-results-icon">🔍</span>
                    <p>No records found matching ID: {searchTerm}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((row, index) => {
                const duplicate = isDuplicateRow(index)
                const hasIssues = dataQualityIssues.some(issue => {
                  if (issue.type === 'duplicate' && issue.indices && issue.indices.includes(index)) {
                    return true
                  }
                  if (issue.column) {
                    const val = row[issue.column]
                    if (issue.type === 'missing') {
                      return val === null || val === undefined || val === '' || 
                             (typeof val === 'number' && isNaN(val)) ||
                             (typeof val === 'string' && val.trim() === '')
                    }
                    if (issue.type === 'outlier' && issue.indices) {
                      return issue.indices.includes(index)
                    }
                  }
                  return false
                })

                return (
                  <tr key={row.id || index} style={{
                    backgroundColor: duplicate ? '#FFCDD2' : 
                                   hasIssues ? '#FFF3E0' : 'transparent',
                    borderBottom: duplicate ? '2px solid #EF5350' : '1px solid #E0E0E0'
                  }}>
                    <td style={{ textAlign: 'center', fontSize: '18px' }}>
                      {duplicate ? '⚠️' : hasIssues ? '⚠️' : '✅'}
                    </td>
                    {Object.entries(row).map(([key, value]) => {
                      const hasIssue = hasCellIssue(row, key, index)
                      const isMissing = dataQualityIssues.some(issue => 
                        issue.type === 'missing' && 
                        issue.column === key && 
                        (value === null || value === undefined || value === '' || 
                         (typeof value === 'number' && isNaN(value)) ||
                         (typeof value === 'string' && value.trim() === ''))
                      )
                      
                      return (
                        <td key={key} style={{
                          backgroundColor: isMissing ? '#FFE0B2' :
                                         hasIssue ? '#FFCC80' : 'transparent',
                          fontWeight: hasIssue || isMissing ? 'bold' : 'normal',
                          color: isMissing ? '#E65100' : 'inherit'
                        }}>
                          {formatCellValue(value)}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

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
        Total Records: {data.length} {searchTerm && `| Showing: ${filteredData.length}`}
      </div>
    </div>
  )
}

export default Data_Process