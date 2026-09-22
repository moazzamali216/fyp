// components/DataPreprocess.jsx
import { useState, useEffect, useRef } from 'react'

const API_URL = import.meta.env.VITE_API_URL;

function Data_Prepare() {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)
    const [preprocessLoading, setPreprocessLoading] = useState(false)
    const [stats, setStats] = useState(null)
    const [error, setError] = useState(null)
    const [activeTab, setActiveTab] = useState('summary')

    const hasRun = useRef(false)

    const currentUser = JSON.parse(localStorage.getItem('user') || 'null')

    // ============================================
    // FETCH MODEL DATA
    // ============================================
    const fetchModelData = async () => {
        setLoading(true)
        try {
            const response = await fetch(`${API_URL}/admin/model-data`, {
                headers: { 'role': currentUser?.role || 'admin' }
            })
            const result = await response.json()

            if (result.success) {
                setData(result.data || [])
                if (result.statistics) {
                    setStats(result.statistics)
                } else {
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

    // ============================================
    // RUN PREPROCESS THEN FETCH MODEL DATA
    // ============================================
    const runPreprocessThenFetch = async () => {
        setPreprocessLoading(true)
        setError(null)
        try {
            const res = await fetch(`${API_URL}/admin/dl-table/preprocess`, {
                method: 'POST',
                headers: { 'role': currentUser?.role || 'admin' }
            })
            const result = await res.json()

            if (result.error) {
                setError(result.error)
                setPreprocessLoading(false)
                // Still try to load whatever model_data currently exists
                await fetchModelData()
                return
            }

            // Preprocess succeeded — load fresh model_data
            await fetchModelData()
        } catch (err) {
            console.error('Preprocess error:', err)
            setError('Preprocessing failed')
            // Fall back to whatever is already in model_data
            await fetchModelData()
        } finally {
            setPreprocessLoading(false)
        }
    }

    useEffect(() => {
        if (hasRun.current) return   // guard against React StrictMode double-run
        hasRun.current = true
        runPreprocessThenFetch()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ============================================
    // STATISTICAL HELPERS
    // ============================================
    const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length

    const quantile = (sorted, p) => {
        const pos = (sorted.length - 1) * p
        const base = Math.floor(pos)
        const rest = pos - base
        if (sorted[base + 1] !== undefined) {
            return sorted[base] + rest * (sorted[base + 1] - sorted[base])
        }
        return sorted[base]
    }

    const mode = (arr) => {
        const freq = {}
        let best = null, bestCount = 0
        arr.forEach(v => {
            const k = String(v)
            freq[k] = (freq[k] || 0) + 1
            if (freq[k] > bestCount) { bestCount = freq[k]; best = v }
        })
        return { mode: best, count: bestCount }
    }

    const geometricMean = (arr) => {
        if (arr.some(v => v <= 0)) return null
        const logSum = arr.reduce((a, v) => a + Math.log(v), 0)
        return Math.exp(logSum / arr.length)
    }

    const harmonicMean = (arr) => {
        if (arr.some(v => v === 0)) return null
        const invSum = arr.reduce((a, v) => a + 1 / v, 0)
        return arr.length / invSum
    }

    const pearson = (x, y) => {
        const n = x.length
        if (n < 2) return null
        const mx = mean(x), my = mean(y)
        let num = 0, dx = 0, dy = 0
        for (let i = 0; i < n; i++) {
            const a = x[i] - mx
            const b = y[i] - my
            num += a * b
            dx += a * a
            dy += b * b
        }
        if (dx === 0 || dy === 0) return null
        return num / Math.sqrt(dx * dy)
    }

    const spearman = (x, y) => {
        const n = x.length
        if (n < 2) return null
        const rank = (arr) => {
            const idx = arr.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0])
            const ranks = new Array(arr.length)
            let i = 0
            while (i < idx.length) {
                let j = i
                while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++
                const avgRank = (i + j) / 2 + 1
                for (let k = i; k <= j; k++) ranks[idx[k][1]] = avgRank
                i = j + 1
            }
            return ranks
        }
        return pearson(rank(x), rank(y))
    }

    // ============================================
    // DEEP STATISTICAL ANALYSIS
    // ============================================
    const computeDeepStats = (dataset) => {
        if (!dataset || dataset.length === 0) return null

        const columns = Object.keys(dataset[0]).filter(c => c !== 'id')

        const numeric = {}
        const categorical = {}
        const numericCols = []
        const numericMatrix = {}

        const FORCE_CATEGORICAL = new Set(['class'])

        columns.forEach(col => {
            const values = dataset
                .map(r => r[col])
                .filter(v => v !== null && v !== undefined && v !== '' && !(typeof v === 'number' && isNaN(v)))

            if (values.length === 0) return

            const numericValues = values.map(v => Number(v)).filter(v => !isNaN(v))
            const parsesAsNumber = numericValues.length / values.length >= 0.9
            const uniqueCount = new Set(values.map(v => String(v))).size

            const isCategorical =
                FORCE_CATEGORICAL.has(col) ||
                !parsesAsNumber ||
                (parsesAsNumber && uniqueCount <= 10)

            if (isCategorical) {
                const freq = {}
                values.forEach(v => {
                    const key = String(v)
                    freq[key] = (freq[key] || 0) + 1
                })
                const entries = Object.entries(freq).sort((a, b) => b[1] - a[1])
                const total = values.length

                let entropy = 0
                for (const [, cnt] of entries) {
                    const p = cnt / total
                    entropy -= p * Math.log2(p)
                }

                let simpson = 0
                for (const [, cnt] of entries) {
                    const p = cnt / total
                    simpson += p * p
                }
                simpson = 1 - simpson

                categorical[col] = {
                    unique: entries.length,
                    missing: dataset.length - values.length,
                    total,
                    top: entries.slice(0, 10),
                    mode: entries[0] ? entries[0][0] : null,
                    modeCount: entries[0] ? entries[0][1] : 0,
                    entropy,
                    normalizedEntropy: entries.length > 1 ? entropy / Math.log2(entries.length) : 0,
                    simpson,
                }
            } else {
                numericCols.push(col)
                numericMatrix[col] = numericValues

                const n = numericValues.length
                const sorted = [...numericValues].sort((a, b) => a - b)
                const sum = numericValues.reduce((a, b) => a + b, 0)
                const m = sum / n

                const median = quantile(sorted, 0.5)
                const q1 = quantile(sorted, 0.25)
                const q3 = quantile(sorted, 0.75)
                const iqr = q3 - q1

                const variance =
                    numericValues.reduce((acc, v) => acc + Math.pow(v - m, 2), 0) / n
                const std = Math.sqrt(variance)

                const sampleVariance =
                    n > 1
                        ? numericValues.reduce((acc, v) => acc + Math.pow(v - m, 2), 0) / (n - 1)
                        : 0

                const min = sorted[0]
                const max = sorted[n - 1]
                const range = max - min

                const cv = m !== 0 ? std / m : null
                const sem = n > 1 ? std / Math.sqrt(n) : null
                const ci95Low = sem !== null ? m - 1.96 * sem : null
                const ci95High = sem !== null ? m + 1.96 * sem : null

                const skewness =
                    n > 2 && std > 0
                        ? (n / ((n - 1) * (n - 2))) *
                          numericValues.reduce(
                              (acc, v) => acc + Math.pow((v - m) / std, 3),
                              0
                          )
                        : 0

                const kurtosis =
                    n > 3 && std > 0
                        ? (n * (n + 1)) /
                              ((n - 1) * (n - 2) * (n - 3)) *
                              numericValues.reduce(
                                  (acc, v) => acc + Math.pow((v - m) / std, 4),
                                  0
                              ) -
                          (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3))
                        : 0

                const deviations = numericValues.map(v => Math.abs(v - median))
                const mad = quantile([...deviations].sort((a, b) => a - b), 0.5)

                const { mode: modeVal, count: modeCount } = mode(numericValues)

                numeric[col] = {
                    count: n,
                    missing: dataset.length - values.length,
                    sum,
                    mean: m,
                    median,
                    mode: modeVal,
                    modeCount,
                    geometricMean: geometricMean(numericValues),
                    harmonicMean: harmonicMean(numericValues),
                    std,
                    sampleVariance,
                    variance,
                    cv,
                    sem,
                    ci95Low,
                    ci95High,
                    min,
                    max,
                    range,
                    q1,
                    q3,
                    iqr,
                    mad,
                    skewness,
                    kurtosis,
                }
            }
        })

        const correlationPearson = {}
        const correlationSpearman = {}
        numericCols.forEach(a => {
            correlationPearson[a] = {}
            correlationSpearman[a] = {}
            numericCols.forEach(b => {
                if (a === b) {
                    correlationPearson[a][b] = 1
                    correlationSpearman[a][b] = 1
                } else {
                    const n = Math.min(numericMatrix[a].length, numericMatrix[b].length)
                    const xa = numericMatrix[a].slice(0, n)
                    const xb = numericMatrix[b].slice(0, n)
                    correlationPearson[a][b] = pearson(xa, xb)
                    correlationSpearman[a][b] = spearman(xa, xb)
                }
            })
        })

        return {
            numeric,
            categorical,
            numericCols,
            correlationPearson,
            correlationSpearman,
            totalRows: dataset.length,
        }
    }

    const deep = computeDeepStats(data)

    const fmt = (v, digits = 4) => {
        if (v === null || v === undefined) return '—'
        if (typeof v !== 'number') return String(v)
        if (!isFinite(v)) return '—'
        if (Math.abs(v) >= 1e6 || (Math.abs(v) < 1e-3 && v !== 0)) {
            return v.toExponential(3)
        }
        return v.toFixed(digits)
    }

    // ============================================
    // LOADING STATE
    // ============================================
    if (preprocessLoading || loading) {
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
                <p style={{ color: '#0d5c63', fontWeight: 'bold', margin: 0 }}>
                    {preprocessLoading
                        ? '⚙️ Preprocessing data...'
                        : '📊 Loading model data...'}
                </p>
                <p style={{ color: '#6c757d', fontSize: '13px', margin: 0 }}>
                    This may take a few seconds
                </p>
            </div>
        )
    }

    const Section = ({ title, subtitle, children }) => (
        <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #dee2e6',
            overflow: 'hidden',
            boxSizing: 'border-box',
            maxWidth: '100%',
            minWidth: 0,
        }}>
            <h4 style={{ marginTop: 0, color: '#0d5c63' }}>{title}</h4>
            {subtitle && (
                <p style={{ fontSize: '13px', color: '#6c757d', marginTop: 0 }}>{subtitle}</p>
            )}
            {children}
        </div>
    )

    // Constrained horizontal scroll wrapper — prevents table width from
    // propagating up the DOM and pushing the whole page wide.
    const ScrollWrapper = ({ children }) => (
        <div style={{
            display: 'block',
            position: 'relative',
            width: '950px',
            maxWidth: '100%',
            minWidth: 0,
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
        }}>
            {children}
        </div>
    )

    return (
        <div style={{
            padding: '20px',
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            overflow: 'hidden',
            boxSizing: 'border-box',
        }}>
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
                    📊 Model Data — Statistical Analysis ({data.length} records)
                </h2>

                <button
                    onClick={runPreprocessThenFetch}
                    disabled={preprocessLoading || loading}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: (preprocessLoading || loading) ? '#94a3b8' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: (preprocessLoading || loading) ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }}
                >
                    {preprocessLoading ? '⚙️ Preprocessing...' : '🔄 Re-run Preprocess'}
                </button>
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

            {data.length === 0 ? (
                <div style={{
                    padding: '60px 40px',
                    textAlign: 'center',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    color: '#6c757d'
                }}>
                    <p style={{ fontSize: '18px', margin: 0 }}>📭 No data available in model_data</p>
                </div>
            ) : (
                <>
                    {/* Tabs */}
                    <div style={{
                        display: 'flex',
                        gap: '4px',
                        borderBottom: '2px solid #e0e0e0',
                        marginBottom: '20px',
                        flexWrap: 'wrap'
                    }}>
                        {[
                            { id: 'summary', label: '📋 Summary' },
                            { id: 'central', label: '📈 Central Tendency & Spread' },
                            { id: 'shape', label: '🔔 Distribution Shape' },
                            { id: 'dist', label: '🎯 Categorical Distributions' },
                            { id: 'corr', label: '🔗 Correlation Matrix' },
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                style={{
                                    padding: '10px 20px',
                                    background: activeTab === t.id ? '#0d5c63' : 'transparent',
                                    color: activeTab === t.id ? 'white' : '#555',
                                    border: 'none',
                                    borderBottom: activeTab === t.id ? '3px solid #0d5c63' : '3px solid transparent',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    borderTopLeftRadius: '6px',
                                    borderTopRightRadius: '6px'
                                }}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* SUMMARY TAB */}
                    {activeTab === 'summary' && stats && (
                        <Section title="📋 Dataset Summary">
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: '15px'
                            }}>
                                <StatCard label="Total Records" value={stats.total_records || data.length} />
                                <StatCard label="Total Columns" value={stats.columns?.length || 0} />
                                <StatCard label="Original Features" value={stats.original_features || '—'} />
                                <StatCard label="Selected Features" value={stats.selected_features || '—'} />
                                <StatCard label="Engineered Features" value={stats.engineered_features || '—'} />
                                <StatCard label="Total Features" value={stats.total_processed_features || 0} />
                            </div>

                            {stats.target_distribution && (
                                <div style={{ marginTop: '20px' }}>
                                    <h5 style={{ color: '#0d5c63' }}>Target Distribution</h5>
                                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                        <span>Class 0 (No Diabetes): <strong>{stats.target_distribution[0] || 0}</strong></span>
                                        <span>Class 1 (Diabetes): <strong>{stats.target_distribution[1] || 0}</strong></span>
                                    </div>
                                </div>
                            )}
                        </Section>
                    )}

                    {/* CENTRAL TENDENCY TAB */}
                    {activeTab === 'central' && deep && (
                        <Section
                            title="📈 Central Tendency & Spread"
                            subtitle="Mean, median, mode, geometric/harmonic means, standard deviation, coefficient of variation, 95% CI of the mean"
                        >
                            <ScrollWrapper>
                                <table style={{
                                    borderCollapse: 'collapse',
                                    fontSize: '13px',
                                    width: '950px'
                                }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#0d5c63' }}>
                                            {[
                                                'Column', 'Count', 'Missing', 'Mean', 'Median', 'Mode',
                                                'Geometric Mean', 'Harmonic Mean', 'Std', 'Sample Var',
                                                'CV', 'SEM', '95% CI Low', '95% CI High', 'Sum'
                                            ].map(h => (
                                                <th key={h} style={{
                                                    padding: '10px 12px',
                                                    textAlign: 'left',
                                                    color: 'white',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(deep.numeric).map(([col, s], i) => (
                                            <tr key={col} style={{
                                                backgroundColor: i % 2 === 0 ? '#f9f9f9' : 'white'
                                            }}>
                                                <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#0d5c63', whiteSpace: 'nowrap' }}>{col}</td>
                                                <td style={{ padding: '8px 12px' }}>{s.count}</td>
                                                <td style={{ padding: '8px 12px' }}>{s.missing}</td>
                                                <td style={{ padding: '8px 12px' }}>{fmt(s.mean)}</td>
                                                <td style={{ padding: '8px 12px' }}>{fmt(s.median)}</td>
                                                <td style={{ padding: '8px 12px' }}>{fmt(s.mode)}</td>
                                                <td style={{ padding: '8px 12px' }}>{fmt(s.geometricMean)}</td>
                                                <td style={{ padding: '8px 12px' }}>{fmt(s.harmonicMean)}</td>
                                                <td style={{ padding: '8px 12px' }}>{fmt(s.std)}</td>
                                                <td style={{ padding: '8px 12px' }}>{fmt(s.sampleVariance)}</td>
                                                <td style={{ padding: '8px 12px' }}>{fmt(s.cv, 3)}</td>
                                                <td style={{ padding: '8px 12px' }}>{fmt(s.sem)}</td>
                                                <td style={{ padding: '8px 12px' }}>{fmt(s.ci95Low)}</td>
                                                <td style={{ padding: '8px 12px' }}>{fmt(s.ci95High)}</td>
                                                <td style={{ padding: '8px 12px' }}>{fmt(s.sum, 2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </ScrollWrapper>

                            <h5 style={{ color: '#0d5c63', marginTop: '25px' }}>
                                Range, Quartiles & Robust Spread
                            </h5>
                            <ScrollWrapper>
                                <table style={{
                                    borderCollapse: 'collapse',
                                    fontSize: '13px',
                                    width: 'max-content'
                                }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#0d5c63' }}>
                                            {['Column', 'Min', 'Q1', 'Median', 'Q3', 'Max', 'Range', 'IQR', 'MAD'].map(h => (
                                                <th key={h} style={{
                                                    padding: '10px 12px',
                                                    textAlign: 'left',
                                                    color: 'white',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(deep.numeric).map(([col, s], i) => (
                                            <tr key={col} style={{
                                                backgroundColor: i % 2 === 0 ? '#f9f9f9' : 'white'
                                            }}>
                                                <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#0d5c63', whiteSpace: 'nowrap' }}>{col}</td>
                                                <td style={{ padding: '8px 12px' }}>{fmt(s.min)}</td>
                                                <td style={{ padding: '8px 12px' }}>{fmt(s.q1)}</td>
                                                <td style={{ padding: '8px 12px' }}>{fmt(s.median)}</td>
                                                <td style={{ padding: '8px 12px' }}>{fmt(s.q3)}</td>
                                                <td style={{ padding: '8px 12px' }}>{fmt(s.max)}</td>
                                                <td style={{ padding: '8px 12px' }}>{fmt(s.range)}</td>
                                                <td style={{ padding: '8px 12px' }}>{fmt(s.iqr)}</td>
                                                <td style={{ padding: '8px 12px' }}>{fmt(s.mad)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </ScrollWrapper>
                        </Section>
                    )}

                    {/* DISTRIBUTION SHAPE TAB */}
                    {activeTab === 'shape' && deep && (
                        <Section
                            title="🔔 Distribution Shape"
                            subtitle="Skewness, kurtosis, and interpretation. No outlier detection is performed — these describe the shape of each distribution as-is."
                        >
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                gap: '15px'
                            }}>
                                {Object.entries(deep.numeric).map(([col, s]) => {
                                    const skewAbs = Math.abs(s.skewness)
                                    const skewLabel = skewAbs < 0.5
                                        ? 'Approximately symmetric'
                                        : skewAbs < 1
                                            ? (s.skewness > 0 ? 'Slightly right-skewed' : 'Slightly left-skewed')
                                            : (s.skewness > 0 ? 'Highly right-skewed' : 'Highly left-skewed')

                                    const kurtAbs = Math.abs(s.kurtosis)
                                    const kurtLabel = kurtAbs < 0.5
                                        ? 'Mesokurtic (normal tails)'
                                        : s.kurtosis > 0
                                            ? 'Leptokurtic (heavy tails, peaked)'
                                            : 'Platykurtic (light tails, flat)'

                                    return (
                                        <div key={col} style={{
                                            padding: '14px',
                                            background: '#f8fafc',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            fontSize: '13px'
                                        }}>
                                            <div style={{
                                                fontWeight: 'bold',
                                                color: '#0d5c63',
                                                fontSize: '14px',
                                                marginBottom: '8px'
                                            }}>
                                                {col}
                                            </div>

                                            <div style={{ marginBottom: '6px' }}>
                                                <div style={{ color: '#555' }}>
                                                    Skewness: <strong>{fmt(s.skewness, 4)}</strong>
                                                </div>
                                                <div style={{ color: '#0d5c63', fontSize: '12px' }}>
                                                    → {skewLabel}
                                                </div>
                                            </div>

                                            <div style={{ marginBottom: '6px' }}>
                                                <div style={{ color: '#555' }}>
                                                    Kurtosis (excess): <strong>{fmt(s.kurtosis, 4)}</strong>
                                                </div>
                                                <div style={{ color: '#0d5c63', fontSize: '12px' }}>
                                                    → {kurtLabel}
                                                </div>
                                            </div>

                                            <div style={{ color: '#555', fontSize: '12px', marginTop: '8px' }}>
                                                CV = {fmt(s.cv, 3)} | SEM = {fmt(s.sem, 3)}
                                            </div>
                                            <div style={{ color: '#555', fontSize: '12px' }}>
                                                95% CI: [{fmt(s.ci95Low, 3)}, {fmt(s.ci95High, 3)}]
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </Section>
                    )}

                    {/* CATEGORICAL DISTRIBUTIONS TAB */}
                    {activeTab === 'dist' && deep && Object.keys(deep.categorical).length > 0 && (
                        <Section
                            title="🎯 Categorical Distributions"
                            subtitle="Frequency, proportion, entropy, and diversity for non-numeric columns"
                        >
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                                gap: '15px'
                            }}>
                                {Object.entries(deep.categorical).map(([col, c]) => {
                                    const total = c.total || 1
                                    return (
                                        <div key={col} style={{
                                            padding: '15px',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            background: '#f8fafc'
                                        }}>
                                            <div style={{
                                                fontWeight: 'bold',
                                                color: '#0d5c63',
                                                marginBottom: '6px',
                                                fontSize: '14px'
                                            }}>
                                                {col}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#555', marginBottom: '10px' }}>
                                                Unique: <strong>{c.unique}</strong> | Missing: <strong>{c.missing}</strong>
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#555', marginBottom: '10px' }}>
                                                Shannon entropy: <strong>{fmt(c.entropy, 3)}</strong> bits
                                                {c.unique > 1 && (
                                                    <> (normalized: <strong>{fmt(c.normalizedEntropy, 3)}</strong>)</>
                                                )}
                                                <br />
                                                Simpson diversity: <strong>{fmt(c.simpson, 3)}</strong>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                {c.top.map(([value, count]) => {
                                                    const pct = (count / total) * 100
                                                    return (
                                                        <div key={value}>
                                                            <div style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                fontSize: '12px',
                                                                marginBottom: '2px'
                                                            }}>
                                                                <span><strong>{value}</strong></span>
                                                                <span>{count} ({pct.toFixed(1)}%)</span>
                                                            </div>
                                                            <div style={{
                                                                height: '6px',
                                                                background: '#e5e7eb',
                                                                borderRadius: '3px',
                                                                overflow: 'hidden'
                                                            }}>
                                                                <div style={{
                                                                    width: `${pct}%`,
                                                                    height: '100%',
                                                                    background: '#0d5c63'
                                                                }} />
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </Section>
                    )}

                    {/* CORRELATION TAB */}
                    {activeTab === 'corr' && deep && deep.numericCols.length > 1 && (
                        <>
                            <Section
                                title="🔗 Pearson Correlation Matrix"
                                subtitle="Linear correlation between numeric features. Ranges from -1 (perfect negative) to +1 (perfect positive)."
                            >
                                <CorrelationMatrix
                                    cols={deep.numericCols}
                                    matrix={deep.correlationPearson}
                                />
                            </Section>

                            <Section
                                title="🔗 Spearman Rank Correlation Matrix"
                                subtitle="Monotonic (rank-based) correlation — robust to non-linear relationships and outliers."
                            >
                                <CorrelationMatrix
                                    cols={deep.numericCols}
                                    matrix={deep.correlationSpearman}
                                />
                            </Section>

                            <Section
                                title="🔝 Strongest Feature Pairs (|Pearson r|)"
                                subtitle="Features most linearly related to each other"
                            >
                                <TopCorrelations
                                    cols={deep.numericCols}
                                    matrix={deep.correlationPearson}
                                />
                            </Section>
                        </>
                    )}
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

// ============================================
// SUBCOMPONENTS
// ============================================

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

function CorrelationMatrix({ cols, matrix }) {
    const getColor = (v) => {
        if (v === null || v === undefined) return '#f0f0f0'
        const abs = Math.abs(v)
        if (abs < 0.2) return '#f7fafc'
        if (v > 0) {
            if (v > 0.7) return '#0d5c63'
            if (v > 0.5) return '#377e85'
            if (v > 0.3) return '#6ba3a9'
            return '#b8d3d5'
        } else {
            const a = Math.abs(v)
            if (a > 0.7) return '#b71c1c'
            if (a > 0.5) return '#d35400'
            if (a > 0.3) return '#e67e22'
            return '#f5cba7'
        }
    }

    const getTextColor = (v) => {
        if (v === null || v === undefined) return '#333'
        return Math.abs(v) > 0.3 ? 'white' : '#333'
    }

    return (
        <div style={{
            display: 'block',
            position: 'relative',
            width: '950px',
            maxWidth: '100%',
            minWidth: 0,
            overflowX: 'auto',
            overflowY: 'hidden',
            boxSizing: 'border-box',
            WebkitOverflowScrolling: 'touch'
        }}>
            <table style={{
                borderCollapse: 'collapse',
                fontSize: '12px',
                width:'1000px',
            }}>
                <thead>
                    <tr>
                        <th style={{ padding: '8px', background: '#0d5c63', color: 'white' }}></th>
                        {cols.map(c => (
                            <th key={c} style={{
                                padding: '8px',
                                background: '#0d5c63',
                                color: 'white',
                                whiteSpace: 'nowrap',
                                fontSize: '11px'
                            }}>
                                {c}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {cols.map(rowCol => (
                        <tr key={rowCol}>
                            <td style={{
                                padding: '8px',
                                background: '#0d5c63',
                                color: 'white',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap',
                                fontSize: '11px'
                            }}>
                                {rowCol}
                            </td>
                            {cols.map(colCol => {
                                const v = matrix[rowCol][colCol]
                                return (
                                    <td key={colCol} style={{
                                        padding: '8px',
                                        background: getColor(v),
                                        color: getTextColor(v),
                                        textAlign: 'center',
                                        fontWeight: rowCol === colCol ? 'bold' : 'normal',
                                        border: '1px solid #fff'
                                    }}>
                                        {v === null || v === undefined ? '—' : v.toFixed(2)}
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function TopCorrelations({ cols, matrix }) {
    const pairs = []
    for (let i = 0; i < cols.length; i++) {
        for (let j = i + 1; j < cols.length; j++) {
            const v = matrix[cols[i]][cols[j]]
            if (v !== null && v !== undefined) {
                pairs.push({ a: cols[i], b: cols[j], r: v })
            }
        }
    }
    pairs.sort((x, y) => Math.abs(y.r) - Math.abs(x.r))
    const top = pairs.slice(0, 15)

    return (
        <div style={{
            display: 'block',
            position: 'relative',
            width: '100%',
            maxWidth: '100%',
            overflowX: 'auto',
            overflowY: 'hidden',
            minWidth: 0,
            boxSizing: 'border-box',
            WebkitOverflowScrolling: 'touch'
        }}>
            <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px'
            }}>
                <thead>
                    <tr style={{ background: '#0d5c63' }}>
                        {['#', 'Feature A', 'Feature B', 'Pearson r', 'Strength', 'Direction'].map(h => (
                            <th key={h} style={{
                                padding: '10px 12px',
                                textAlign: 'left',
                                color: 'white'
                            }}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {top.map((p, idx) => {
                        const abs = Math.abs(p.r)
                        const strength = abs > 0.8 ? 'Very strong'
                            : abs > 0.6 ? 'Strong'
                                : abs > 0.4 ? 'Moderate'
                                    : abs > 0.2 ? 'Weak'
                                        : 'Very weak'
                        const direction = p.r > 0 ? 'Positive' : 'Negative'
                        return (
                            <tr key={idx} style={{
                                background: idx % 2 === 0 ? '#f9f9f9' : 'white'
                            }}>
                                <td style={{ padding: '8px 12px' }}>{idx + 1}</td>
                                <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#0d5c63' }}>{p.a}</td>
                                <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#0d5c63' }}>{p.b}</td>
                                <td style={{
                                    padding: '8px 12px',
                                    color: p.r > 0 ? '#0d5c63' : '#c62828',
                                    fontWeight: 'bold'
                                }}>
                                    {p.r.toFixed(4)}
                                </td>
                                <td style={{ padding: '8px 12px' }}>{strength}</td>
                                <td style={{ padding: '8px 12px' }}>{direction}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

export default Data_Prepare