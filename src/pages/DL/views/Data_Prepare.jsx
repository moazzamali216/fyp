import { useState, useEffect } from 'react'
import Data_Table from './Data_Table'

const API_URL = import.meta.env.VITE_API_URL;

function DataPreprocess() {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)
    const [preprocessing, setPreprocessing] = useState(false)
    const [stats, setStats] = useState(null)
    const [error, setError] = useState(null)
    const [view, setView] = useState(true)
    const [showStats, setShowStats] = useState(true)

    const currentUser = JSON.parse(localStorage.getItem('user') || 'null')

    // Automatically fetch model_data on load
    useEffect(() => {
        fetchModelData()
    }, [])

    // Fetch data from model_data table
    const fetchModelData = async () => {
        setLoading(true)
        try {
            const response = await fetch(`${API_URL}/admin/model-data`, {
                headers: {'ngrok-skip-browser-warning': 'true', 'role': currentUser?.role || 'admin' }
            })
            const result = await response.json()

            if (result.success) {
                setData(result.data || [])
                // Check if statistics exist in the response
                if (result.statistics) {
                    setStats(result.statistics)
                } else {
                    // If no stats, set default stats from the data
                    setStats({
                        total_records: result.data?.length || 0,
                        columns: result.data?.length > 0 ? Object.keys(result.data[0]) : []
                    })
                }
                setError(null)
            } else {
                setError(result.error || 'Failed to fetch data')
                setData([])
                setStats(null)
            }
        } catch (err) {
            console.error('Error fetching model data:', err)
            setError('Failed to connect to server')
            setData([])
            setStats(null)
        } finally {
            setLoading(false)
        }
    }

    // Handle preprocessing (reprocess data and update display)
    const handlePreprocess = async () => {
        setPreprocessing(true)
        setError(null)

        try {
            const response = await fetch(`${API_URL}/admin/dl-table/preprocess`, {
                method: 'POST',
                headers: {'ngrok-skip-browser-warning': 'true',
                    'role': currentUser?.role || 'admin',
                    'Content-Type': 'application/json'
                }
            })

            const result = await response.json()

            if (result.success) {
                // ✅ IMPORTANT: Fetch the updated data after preprocessing
                await fetchModelData()
                setShowStats(true)
                alert(`✅ ${result.message}\nProcessed ${result.total_records} records`)
            } else {
                setError(result.error || 'Preprocessing failed')
                alert(`❌ Error: ${result.error || 'Preprocessing failed'}`)
            }
        } catch (err) {
            setError(err.message)
            alert(`❌ Error: ${err.message}`)
        } finally {
            setPreprocessing(false)
        }
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <div className="spinner"></div>
            </div>
        )
    }

    return (
        <div style={{ padding: '20px', maxWidth: '100%', overflowX: 'auto' }}>
            {/* Header with action buttons */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '10px'
            }}>
                <h2 style={{ margin: 0, color: '#0d5c63' }}>
                    📊 Model Data ({data.length} records)
                </h2>

                <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                        onClick={()=>{
                            setView(false)
                        }}
     
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#0d5c63',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: preprocessing ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            opacity: preprocessing ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
 
                            <>
                                <span className="spinner-small"></span>
                                Show Real Data
                            </>

                    </button>

                    <button
                    onClick={()=>{
                        setView(true)
                        handlePreprocess()
                        }}
     
                        disabled={preprocessing}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#0d5c63',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: preprocessing ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            opacity: preprocessing ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {preprocessing ? (
                            <>
                                <span className="spinner-small"></span>
                                Processing...
                            </>
                        ) : (
                            '🔄 Reprocess Data'
                        )}
                    </button>

                    <button
                        onClick={fetchModelData}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold'
                        }}
                    >
                        🔄 Refresh
                    </button>

                    {stats && (
                        <button
                            onClick={() => setShowStats(!showStats)}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}
                        >
                            {showStats ? '📊 Hide Stats' : '📈 Show Stats'}
                        </button>
                    )}
                </div>
            </div>

            {/* Error message */}
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

            {/* Statistics Section */}
{view === true ? <>
            {showStats && stats && (
                <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: '1px solid #dee2e6'
                }}>
                    <h4 style={{ marginTop: 0, color: '#0d5c63' }}>📊 Data Statistics</h4>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '15px'
                    }}>
                        <StatCard label="Total Records" value={stats.total_records || data.length} />
                        <StatCard label="Total Columns" value={stats.columns?.length || 0} />
                        <StatCard label="Original Features" value={stats.original_features || 'N/A'} />
                        <StatCard label="Selected Features" value={stats.selected_features || 'N/A'} />
                        <StatCard label="Engineered Features" value={stats.engineered_features || 'N/A'} />
                        <StatCard label="Total Features" value={stats.total_processed_features || stats.columns?.length || 0} />
                        <StatCard label="Records" value={stats.data_shape?.[0] || data.length || 0} />
                        <StatCard label="Scaler Type" value={stats.scaler_type || 'StandardScaler'} />
                    </div>

                    {stats.target_distribution && (
                        <div style={{ marginTop: '15px' }}>
                            <h5>Target Distribution (Diabetes)</h5>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <span>✅ No Diabetes: {stats.target_distribution[0] || 0}</span>
                                <span>⚠️ Diabetes: {stats.target_distribution[1] || 0}</span>
                            </div>
                        </div>
                    )}

                    {stats.top_features && stats.top_features.length > 0 && (
                        <div style={{ marginTop: '15px' }}>
                            <h5>Top Selected Features</h5>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {stats.top_features.slice(0, 5).map(([feature, score]) => (
                                    <span key={feature} style={{
                                        backgroundColor: '#0d5c63',
                                        color: 'white',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '12px'
                                    }}>
                                        {feature}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {stats.columns && stats.columns.length > 0 && !stats.top_features && (
                        <div style={{ marginTop: '15px' }}>
                            <h5>Columns in Model Data</h5>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {stats.columns.map((col) => (
                                    <span key={col} style={{
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '12px'
                                    }}>
                                        {col}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Data Table */}
            {data.length > 0 ? (
                <div style={{
                    overflowX: 'auto',
                    marginTop: '20px',
                    width: '950px',
                    maxWidth: '100%',
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                }}>
                    <table style={{
                        width: '2000px',
                        borderCollapse: 'collapse',
                        fontSize: '14px',
                    }}>
                        <thead>
                            <tr style={{ backgroundColor: '#0d5c63', position: 'sticky', top: 0 }}>
                                {Object.keys(data[0]).map((col) => (
                                    <th key={col} style={{
                                        padding: '12px 15px',
                                        textAlign: 'left',
                                        color: 'white',
                                        borderBottom: '2px solid #ddd',
                                        whiteSpace: 'nowrap',
                                        minWidth: '100px'
                                    }}>
                                        {col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, ' ')}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, index) => (
                                <tr key={index} style={{ 
                                    backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white',
                                    borderBottom: '1px solid #eee'
                                }}>
                                    {Object.keys(data[0]).map((col) => (
                                        <td key={col} style={{
                                            padding: '10px 15px',
                                            borderBottom: '1px solid #eee',
                                            maxWidth: '200px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            fontSize: '13px'
                                        }}>
                                            {row[col] !== null && row[col] !== undefined
                                                ? typeof row[col] === 'number'
                                                    ? row[col].toFixed ? row[col].toFixed(3) : String(row[col])
                                                    : String(row[col])
                                                : 'N/A'
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div style={{
                    padding: '60px 40px',
                    textAlign: 'center',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    color: '#6c757d'
                }}>
                    <p style={{ fontSize: '18px', margin: '0' }}>📭 No data available in model_data</p>
                    <p style={{ fontSize: '14px', marginTop: '10px' }}>
                        Click the "Reprocess Data" button to generate data from dl_table
                    </p>
                </div>
            )}

</> : <Data_Table/>

}



            {/* CSS for spinners */}
            <style>{`
                .spinner {
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #0d5c63;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                }
                
                .spinner-small {
                    display: inline-block;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #ffffff;
                    border-radius: 50%;
                    width: 16px;
                    height: 16px;
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

// Helper component for stat cards
function StatCard({ label, value }) {
    return (
        <div style={{
            backgroundColor: 'white',
            padding: '12px 15px',
            borderRadius: '6px',
            border: '1px solid #dee2e6'
        }}>
            <div style={{ fontSize: '12px', color: '#6c757d' }}>{label}</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0d5c63' }}>
                {value !== undefined && value !== null ? value : 'N/A'}
            </div>
        </div>
    )
}

export default DataPreprocess