// components/Data_Table.jsx
import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  ScatterChart, Scatter, ZAxis,
  ComposedChart, Line, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Treemap,
  Sankey,
  LineChart,
  RadialBarChart, RadialBar,
  FunnelChart, Funnel,
  AreaChart
} from 'recharts'

const API_URL = import.meta.env.VITE_API_URL;

function Data_Visualization() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({})
  const [chartData, setChartData] = useState({
    outcomeCount: [],
    glucoseDistribution: [],
    glucoseBoxPlot: [],
    bmiBoxPlot: [],
    scatterData: [],
    ageGlucoseScatter: [],
    correlationData: [],
    ageDistribution: [],
    presDistribution: [],
    massDistribution: [],
    pediDistribution: [],
    featureComparison: [],
    outcomeByAge: [],
    glucoseByAge: [],
    bmiByAge: [],
    classDistribution: [],
    // New chart data
    featureRadarData: [],
    glucoseTrendData: [],
    bmiTrendData: [],
    ageOutcomePie: [],
    glucoseCategories: [],
    bmiCategories: [],
    ageBmiScatter: [],
    presGlucoseScatter: [],
    featureBoxData: [],
    outcomeFunnelData: [],
    radialGlucoseData: [],
    stackedFeatureData: [],
    treemapData: [],
    sankeyData: { nodes: [], links: [] }
  })

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
        processChartData(sortedData)
        calculateStats(sortedData)
      }
      setLoading(false)
    })
    .catch(() => {
      setError('Failed to fetch data')
      setLoading(false)
    })
  }

  const calculateStats = (dataset) => {
    const features = ['plas', 'pres', 'mass', 'pedi', 'age']
    const featureLabels = {
      'plas': 'Glucose',
      'pres': 'Blood Pressure',
      'mass': 'BMI',
      'pedi': 'Diabetes Pedigree',
      'age': 'Age'
    }
    
    const statsData = {}
    features.forEach(feature => {
      const values = dataset.map(d => d[feature]).filter(v => v > 0)
      const sorted = [...values].sort((a, b) => a - b)
      const sum = values.reduce((a, b) => a + b, 0)
      const mean = sum / values.length
      const median = percentile(values, 50)
      const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length)
      const min = Math.min(...values)
      const max = Math.max(...values)
      const q1 = percentile(values, 25)
      const q3 = percentile(values, 75)
      const iqr = q3 - q1
      const outliers = values.filter(v => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr).length
      
      statsData[feature] = {
        label: featureLabels[feature],
        count: values.length,
        mean: mean.toFixed(2),
        median: median.toFixed(2),
        stdDev: stdDev.toFixed(2),
        min: min.toFixed(2),
        max: max.toFixed(2),
        q1: q1.toFixed(2),
        q3: q3.toFixed(2),
        iqr: iqr.toFixed(2),
        outliers: outliers
      }
    })
    
    const class0 = dataset.filter(d => d.class === 0).length
    const class1 = dataset.filter(d => d.class === 1).length
    
    statsData.class = {
      label: 'Diabetes Outcome',
      count0: class0,
      count1: class1,
      percentage0: ((class0 / dataset.length) * 100).toFixed(1),
      percentage1: ((class1 / dataset.length) * 100).toFixed(1)
    }
    
    setStats(statsData)
  }

  const processChartData = (dataset) => {
    // 1. Diabetes Outcome Count - Bar Chart
    const outcomeCount = [
      { name: 'No Diabetes', value: dataset.filter(d => d.class === 0).length },
      { name: 'Diabetes', value: dataset.filter(d => d.class === 1).length }
    ]

    // 2. Glucose Distribution - Histogram
    const glucoseBins = {}
    dataset.forEach(d => {
      const glucose = Math.floor(d.plas / 20) * 20
      glucoseBins[glucose] = (glucoseBins[glucose] || 0) + 1
    })
    const glucoseDistribution = Object.entries(glucoseBins)
      .map(([range, count]) => ({
        range: `${range}-${parseInt(range) + 20}`,
        count
      }))
      .sort((a, b) => parseInt(a.range) - parseInt(b.range))

    // 3. Glucose by Diabetes Outcome - Box Plot Data
    const glucoseNoDiabetes = dataset.filter(d => d.class === 0).map(d => d.plas)
    const glucoseDiabetes = dataset.filter(d => d.class === 1).map(d => d.plas)
    const glucoseBoxPlot = [
      { name: 'No Diabetes', min: Math.min(...glucoseNoDiabetes), q1: percentile(glucoseNoDiabetes, 25), median: percentile(glucoseNoDiabetes, 50), q3: percentile(glucoseNoDiabetes, 75), max: Math.max(...glucoseNoDiabetes) },
      { name: 'Diabetes', min: Math.min(...glucoseDiabetes), q1: percentile(glucoseDiabetes, 25), median: percentile(glucoseDiabetes, 50), q3: percentile(glucoseDiabetes, 75), max: Math.max(...glucoseDiabetes) }
    ]

    // 4. BMI by Diabetes Outcome - Box Plot Data
    const bmiNoDiabetes = dataset.filter(d => d.class === 0).map(d => d.mass)
    const bmiDiabetes = dataset.filter(d => d.class === 1).map(d => d.mass)
    const bmiBoxPlot = [
      { name: 'No Diabetes', min: Math.min(...bmiNoDiabetes), q1: percentile(bmiNoDiabetes, 25), median: percentile(bmiNoDiabetes, 50), q3: percentile(bmiNoDiabetes, 75), max: Math.max(...bmiNoDiabetes) },
      { name: 'Diabetes', min: Math.min(...bmiDiabetes), q1: percentile(bmiDiabetes, 25), median: percentile(bmiDiabetes, 50), q3: percentile(bmiDiabetes, 75), max: Math.max(...bmiDiabetes) }
    ]

    // 5. Glucose vs BMI - Scatter Plot
    const scatterData = dataset.map(d => ({
      glucose: d.plas,
      bmi: d.mass,
      outcome: d.class === 1 ? 'Diabetes' : 'No Diabetes'
    }))

    // 6. Age vs Glucose - Scatter Plot
    const ageGlucoseScatter = dataset.map(d => ({
      age: d.age,
      glucose: d.plas,
      outcome: d.class === 1 ? 'Diabetes' : 'No Diabetes'
    }))

    // 7. Age Distribution
    const ageBins = {}
    dataset.forEach(d => {
      const age = Math.floor(d.age / 10) * 10
      ageBins[age] = (ageBins[age] || 0) + 1
    })
    const ageDistribution = Object.entries(ageBins)
      .map(([range, count]) => ({
        range: `${range}-${parseInt(range) + 9}`,
        count
      }))
      .sort((a, b) => parseInt(a.range) - parseInt(b.range))

    // 8. Blood Pressure Distribution
    const presBins = {}
    dataset.forEach(d => {
      const pres = Math.floor(d.pres / 20) * 20
      if (pres > 0) {
        presBins[pres] = (presBins[pres] || 0) + 1
      }
    })
    const presDistribution = Object.entries(presBins)
      .map(([range, count]) => ({
        range: `${range}-${parseInt(range) + 19}`,
        count
      }))
      .sort((a, b) => parseInt(a.range) - parseInt(b.range))

    // 9. BMI Distribution
    const massBins = {}
    dataset.forEach(d => {
      const mass = Math.floor(d.mass / 5) * 5
      if (mass > 0) {
        massBins[mass] = (massBins[mass] || 0) + 1
      }
    })
    const massDistribution = Object.entries(massBins)
      .map(([range, count]) => ({
        range: `${range}-${parseInt(range) + 4}`,
        count
      }))
      .sort((a, b) => parseInt(a.range) - parseInt(b.range))

    // 10. Diabetes Pedigree Distribution
    const pediBins = {}
    dataset.forEach(d => {
      const pedi = Math.floor(d.pedi / 0.2) * 0.2
      if (pedi > 0) {
        const key = pedi.toFixed(1)
        pediBins[key] = (pediBins[key] || 0) + 1
      }
    })
    const pediDistribution = Object.entries(pediBins)
      .map(([range, count]) => ({
        range: `${parseFloat(range).toFixed(1)}-${(parseFloat(range) + 0.2).toFixed(1)}`,
        count
      }))
      .sort((a, b) => parseFloat(a.range) - parseFloat(b.range))

    // 11. Feature Comparison (mean values by outcome)
    const features = ['plas', 'pres', 'mass', 'pedi', 'age']
    const featureLabels = {
      'plas': 'Glucose',
      'pres': 'Blood Pressure',
      'mass': 'BMI',
      'pedi': 'Pedigree',
      'age': 'Age'
    }
    const featureComparison = features.map(f => {
      const noDiabetes = dataset.filter(d => d.class === 0).map(d => d[f])
      const diabetes = dataset.filter(d => d.class === 1).map(d => d[f])
      return {
        feature: featureLabels[f],
        'No Diabetes': (noDiabetes.reduce((a, b) => a + b, 0) / noDiabetes.length).toFixed(1),
        'Diabetes': (diabetes.reduce((a, b) => a + b, 0) / diabetes.length).toFixed(1)
      }
    })

    // 12. Outcome by Age Group
    const ageGroups = {}
    dataset.forEach(d => {
      const ageGroup = Math.floor(d.age / 10) * 10
      const key = `${ageGroup}-${ageGroup + 9}`
      if (!ageGroups[key]) ageGroups[key] = { total: 0, diabetes: 0 }
      ageGroups[key].total++
      if (d.class === 1) ageGroups[key].diabetes++
    })
    const outcomeByAge = Object.entries(ageGroups)
      .map(([range, data]) => ({
        ageRange: range,
        'No Diabetes': data.total - data.diabetes,
        'Diabetes': data.diabetes,
        rate: ((data.diabetes / data.total) * 100).toFixed(1)
      }))
      .sort((a, b) => parseInt(a.ageRange) - parseInt(b.ageRange))

    // 13. Glucose by Age
    const glucoseByAgeData = dataset.map(d => ({
      age: d.age,
      glucose: d.plas,
      outcome: d.class === 1 ? 'Diabetes' : 'No Diabetes'
    }))

    // 14. BMI by Age
    const bmiByAgeData = dataset.map(d => ({
      age: d.age,
      bmi: d.mass,
      outcome: d.class === 1 ? 'Diabetes' : 'No Diabetes'
    }))

    // 15. Correlation Heatmap Data
    const corrFeatures = ['plas', 'pres', 'mass', 'pedi', 'age']
    const corrData = []
    corrFeatures.forEach((f1, i) => {
      corrFeatures.forEach((f2, j) => {
        const correlation = calculateCorrelation(
          dataset.map(d => d[f1]),
          dataset.map(d => d[f2])
        )
        corrData.push({
          feature1: f1,
          feature2: f2,
          correlation: correlation,
          x: i,
          y: j
        })
      })
    })

    // === NEW CHART DATA ===

    // 16. Radar Chart Data - Feature averages by outcome
    const featureRadarData = features.map(f => {
      const noDiabetes = dataset.filter(d => d.class === 0).map(d => d[f])
      const diabetes = dataset.filter(d => d.class === 1).map(d => d[f])
      const avgNoDiabetes = noDiabetes.reduce((a, b) => a + b, 0) / noDiabetes.length
      const avgDiabetes = diabetes.reduce((a, b) => a + b, 0) / diabetes.length
      // Normalize for radar chart (scale to 0-1 range)
      const maxVal = Math.max(avgNoDiabetes, avgDiabetes) * 1.2
      return {
        feature: featureLabels[f],
        'No Diabetes': avgNoDiabetes / maxVal,
        'Diabetes': avgDiabetes / maxVal,
        rawNoDiabetes: avgNoDiabetes,
        rawDiabetes: avgDiabetes
      }
    })

    // 17. Glucose Trend by Age Groups (line chart data)
    const ageGroupsForTrend = {}
    dataset.forEach(d => {
      const ageGroup = Math.floor(d.age / 5) * 5
      const key = `${ageGroup}-${ageGroup + 4}`
      if (!ageGroupsForTrend[key]) {
        ageGroupsForTrend[key] = { total: 0, sumGlucose: 0, count: 0 }
      }
      ageGroupsForTrend[key].total++
      ageGroupsForTrend[key].sumGlucose += d.plas
      ageGroupsForTrend[key].count++
    })
    const glucoseTrendData = Object.entries(ageGroupsForTrend)
      .map(([range, data]) => ({
        ageRange: range,
        avgGlucose: (data.sumGlucose / data.count).toFixed(1),
        count: data.count
      }))
      .sort((a, b) => parseInt(a.ageRange) - parseInt(b.ageRange))

    // 18. BMI Trend by Age Groups
    const bmiTrendData = Object.entries(ageGroupsForTrend)
      .map(([range, data]) => ({
        ageRange: range,
        avgBMI: (dataset.filter(d => {
          const ageGroup = Math.floor(d.age / 5) * 5
          return `${ageGroup}-${ageGroup + 4}` === range
        }).reduce((sum, d) => sum + d.mass, 0) / data.count).toFixed(1),
        count: data.count
      }))
      .sort((a, b) => parseInt(a.ageRange) - parseInt(b.ageRange))

    // 19. Age Group Outcome Pie Chart
    const ageOutcomePie = [
      { name: 'Under 30 - No Diabetes', value: dataset.filter(d => d.age < 30 && d.class === 0).length },
      { name: 'Under 30 - Diabetes', value: dataset.filter(d => d.age < 30 && d.class === 1).length },
      { name: '30-50 - No Diabetes', value: dataset.filter(d => d.age >= 30 && d.age < 50 && d.class === 0).length },
      { name: '30-50 - Diabetes', value: dataset.filter(d => d.age >= 30 && d.age < 50 && d.class === 1).length },
      { name: '50+ - No Diabetes', value: dataset.filter(d => d.age >= 50 && d.class === 0).length },
      { name: '50+ - Diabetes', value: dataset.filter(d => d.age >= 50 && d.class === 1).length }
    ].filter(item => item.value > 0)

    // 20. Glucose Risk Categories
    const glucoseCategories = [
      { name: 'Normal (<100)', value: dataset.filter(d => d.plas < 100).length },
      { name: 'Pre-diabetes (100-125)', value: dataset.filter(d => d.plas >= 100 && d.plas < 126).length },
      { name: 'Diabetes (126+)', value: dataset.filter(d => d.plas >= 126).length }
    ]

    // 21. BMI Categories
    const bmiCategories = [
      { name: 'Underweight (<18.5)', value: dataset.filter(d => d.mass < 18.5 && d.mass > 0).length },
      { name: 'Normal (18.5-24.9)', value: dataset.filter(d => d.mass >= 18.5 && d.mass < 25).length },
      { name: 'Overweight (25-29.9)', value: dataset.filter(d => d.mass >= 25 && d.mass < 30).length },
      { name: 'Obese (30+)', value: dataset.filter(d => d.mass >= 30).length }
    ]

    // 22. Age vs BMI Scatter
    const ageBmiScatter = dataset.map(d => ({
      age: d.age,
      bmi: d.mass,
      outcome: d.class === 1 ? 'Diabetes' : 'No Diabetes'
    }))

    // 23. Blood Pressure vs Glucose Scatter
    const presGlucoseScatter = dataset.map(d => ({
      pressure: d.pres,
      glucose: d.plas,
      outcome: d.class === 1 ? 'Diabetes' : 'No Diabetes'
    }))

    // 24. Feature Box Plot Data (for advanced box plot visualization)
    const featureBoxData = features.map(f => {
      const noDiabetes = dataset.filter(d => d.class === 0).map(d => d[f])
      const diabetes = dataset.filter(d => d.class === 1).map(d => d[f])
      return {
        feature: featureLabels[f],
        'No Diabetes Q1': percentile(noDiabetes, 25),
        'No Diabetes Median': percentile(noDiabetes, 50),
        'No Diabetes Q3': percentile(noDiabetes, 75),
        'Diabetes Q1': percentile(diabetes, 25),
        'Diabetes Median': percentile(diabetes, 50),
        'Diabetes Q3': percentile(diabetes, 75)
      }
    })

    // 25. Funnel Chart - Data filtering stages
    const outcomeFunnelData = [
      { name: 'Total Records', value: dataset.length },
      { name: 'With Glucose Data', value: dataset.filter(d => d.plas > 0).length },
      { name: 'With BMI Data', value: dataset.filter(d => d.mass > 0).length },
      { name: 'With BP Data', value: dataset.filter(d => d.pres > 0).length },
      { name: 'Complete Records', value: dataset.filter(d => d.plas > 0 && d.mass > 0 && d.pres > 0).length },
      { name: 'Diabetes Cases', value: dataset.filter(d => d.class === 1).length }
    ]

    // 26. Radial Bar Chart - Glucose distribution by outcome
    const radialGlucoseData = [
      { name: 'No Diabetes Avg', value: dataset.filter(d => d.class === 0).reduce((sum, d) => sum + d.plas, 0) / dataset.filter(d => d.class === 0).length || 0 },
      { name: 'Diabetes Avg', value: dataset.filter(d => d.class === 1).reduce((sum, d) => sum + d.plas, 0) / dataset.filter(d => d.class === 1).length || 0 }
    ]

    // 27. Stacked Feature Data
    const stackedFeatureData = features.map(f => {
      const noDiabetes = dataset.filter(d => d.class === 0).map(d => d[f])
      const diabetes = dataset.filter(d => d.class === 1).map(d => d[f])
      return {
        feature: featureLabels[f],
        'No Diabetes': noDiabetes.reduce((a, b) => a + b, 0) / noDiabetes.length,
        'Diabetes': diabetes.reduce((a, b) => a + b, 0) / diabetes.length
      }
    })

    // 28. Treemap Data - Outcome distribution by age and glucose level
    const treemapData = [
      {
        name: 'No Diabetes',
        children: [
          { name: 'Low Glucose', value: dataset.filter(d => d.class === 0 && d.plas < 120).length },
          { name: 'Medium Glucose', value: dataset.filter(d => d.class === 0 && d.plas >= 120 && d.plas < 160).length },
          { name: 'High Glucose', value: dataset.filter(d => d.class === 0 && d.plas >= 160).length }
        ]
      },
      {
        name: 'Diabetes',
        children: [
          { name: 'Low Glucose', value: dataset.filter(d => d.class === 1 && d.plas < 120).length },
          { name: 'Medium Glucose', value: dataset.filter(d => d.class === 1 && d.plas >= 120 && d.plas < 160).length },
          { name: 'High Glucose', value: dataset.filter(d => d.class === 1 && d.plas >= 160).length }
        ]
      }
    ]

    // 29. Sankey Data - Flow from features to outcome
    // Simplified version: feature categories to outcome
    const sankeyNodes = [
      { name: 'Glucose' },
      { name: 'BMI' },
      { name: 'Age' },
      { name: 'Blood Pressure' },
      { name: 'No Diabetes' },
      { name: 'Diabetes' }
    ]
    
    // Calculate connections based on feature thresholds
    const highGlucose = dataset.filter(d => d.plas >= 126).length
    const highBMI = dataset.filter(d => d.mass >= 30).length
    const oldAge = dataset.filter(d => d.age >= 50).length
    const highBP = dataset.filter(d => d.pres >= 140).length
    
    const sankeyLinks = [
      { source: 0, target: 4, value: dataset.filter(d => d.class === 0 && d.plas >= 126).length },
      { source: 0, target: 5, value: dataset.filter(d => d.class === 1 && d.plas >= 126).length },
      { source: 1, target: 4, value: dataset.filter(d => d.class === 0 && d.mass >= 30).length },
      { source: 1, target: 5, value: dataset.filter(d => d.class === 1 && d.mass >= 30).length },
      { source: 2, target: 4, value: dataset.filter(d => d.class === 0 && d.age >= 50).length },
      { source: 2, target: 5, value: dataset.filter(d => d.class === 1 && d.age >= 50).length },
      { source: 3, target: 4, value: dataset.filter(d => d.class === 0 && d.pres >= 140).length },
      { source: 3, target: 5, value: dataset.filter(d => d.class === 1 && d.pres >= 140).length }
    ]

    setChartData({
      outcomeCount,
      glucoseDistribution,
      glucoseBoxPlot,
      bmiBoxPlot,
      scatterData,
      ageGlucoseScatter,
      correlationData: corrData,
      ageDistribution,
      presDistribution,
      massDistribution,
      pediDistribution,
      featureComparison,
      outcomeByAge,
      glucoseByAge: glucoseByAgeData,
      bmiByAge: bmiByAgeData,
      classDistribution: outcomeCount,
      // New data
      featureRadarData,
      glucoseTrendData,
      bmiTrendData,
      ageOutcomePie,
      glucoseCategories,
      bmiCategories,
      ageBmiScatter,
      presGlucoseScatter,
      featureBoxData,
      outcomeFunnelData,
      radialGlucoseData,
      stackedFeatureData,
      treemapData,
      sankeyData: { nodes: sankeyNodes, links: sankeyLinks }
    })
  }

  const percentile = (arr, p) => {
    const sorted = [...arr].sort((a, b) => a - b)
    const index = (p / 100) * (sorted.length - 1)
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    if (lower === upper) return sorted[lower]
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower)
  }

  const calculateCorrelation = (x, y) => {
    const n = x.length
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((a, b, i) => a + b * y[i], 0)
    const sumX2 = x.reduce((a, b) => a + b * b, 0)
    const sumY2 = y.reduce((a, b) => a + b * b, 0)
    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
    return denominator === 0 ? 0 : numerator / denominator
  }

  useEffect(() => {
    fetchData()
  }, [])

  const COLORS = ['#0d5c63', '#e74c3c', '#2ecc71', '#f39c12', '#3498db', '#9b59b6', '#1abc9c', '#e67e22']

  // Custom Heatmap Component
  const HeatmapChart = ({ data }) => {
    const features = ['plas', 'pres', 'mass', 'pedi', 'age']
    const featureLabels = {
      'plas': 'Glucose',
      'pres': 'Blood Pressure',
      'mass': 'BMI',
      'pedi': 'Pedigree',
      'age': 'Age'
    }
    
    const getColor = (value) => {
      const abs = Math.abs(value)
      if (value > 0.6) return '#0d5c63'
      if (value > 0.3) return '#1a7a82'
      if (value > 0) return '#4a9ca3'
      if (value > -0.3) return '#e8a0a0'
      if (value > -0.6) return '#d47070'
      return '#c04040'
    }

    const getTextColor = (value) => {
      return Math.abs(value) > 0.4 ? 'white' : '#333'
    }

    return (
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <table style={{ 
          borderCollapse: 'collapse', 
          margin: '0 auto',
          width: '100%',
          maxWidth: '600px'
        }}>
          <thead>
            <tr>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}></th>
              {features.map(f => (
                <th key={f} style={{ padding: '10px', border: '1px solid #ddd', background: '#f5f5f5' }}>
                  {featureLabels[f]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((f1, i) => (
              <tr key={f1}>
                <td style={{ padding: '10px', border: '1px solid #ddd', background: '#f5f5f5', fontWeight: 'bold' }}>
                  {featureLabels[f1]}
                </td>
                {features.map((f2, j) => {
                  const item = data.find(d => d.feature1 === f1 && d.feature2 === f2)
                  const value = item ? item.correlation : 0
                  return (
                    <td 
                      key={f2} 
                      style={{ 
                        padding: '10px', 
                        border: '1px solid #ddd',
                        background: getColor(value),
                        color: getTextColor(value),
                        textAlign: 'center',
                        fontWeight: 'bold',
                        minWidth: '60px'
                      }}
                    >
                      {value.toFixed(2)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ 
          marginTop: '10px', 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '20px',
          fontSize: '12px',
          color: '#666'
        }}>
          <span>🔵 Strong Positive</span>
          <span>⚪ Neutral</span>
          <span>🔴 Strong Negative</span>
        </div>
      </div>
    )
  }

  // Stats Card Component
  const StatsCard = ({ title, stats }) => {
    return (
      <div style={{ 
        background: 'white', 
        padding: '15px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '15px'
      }}>
        <h4 style={{ color: '#0d5c63', marginBottom: '10px' }}>{title}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              padding: '4px 8px',
              background: '#f8f9fa',
              borderRadius: '4px',
              fontSize: '13px'
            }}>
              <span style={{ color: '#666' }}>{key}:</span>
              <span style={{ fontWeight: '500', color: '#333' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    )
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ color: '#0d5c63' }}>Live Data Analysis & Visualization</h2>
          <p className="subtitle" style={{ color: '#0d5c63' }}>Pima Indians Diabetes Dataset</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            padding: '8px 20px',
            backgroundColor: loading ? '#BDBDBD' : '#0d5c63',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s ease'
          }}
          onMouseEnter={(e) => {
            if (!loading) e.target.style.backgroundColor = '#0a4a50'
          }}
          onMouseLeave={(e) => {
            if (!loading) e.target.style.backgroundColor = '#0d5c63'
          }}
        >
          {loading ? 'Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {error && (
        <div className="message error" style={{ marginBottom: '15px' }}>
          ❌ {error}
        </div>
      )}

      {/* Statistical Summary Cards */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ color: '#0d5c63', marginBottom: '15px' }}>📊 Statistical Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          {Object.entries(stats).filter(([key]) => key !== 'class').map(([key, value]) => (
            <StatsCard key={key} title={value.label} stats={{
              'Count': value.count,
              'Mean': value.mean,
              'Median': value.median,
              'Std Dev': value.stdDev,
              'Min': value.min,
              'Max': value.max,
              'Q1': value.q1,
              'Q3': value.q3,

            }} />
          ))}
          {stats.class && (
            <StatsCard title="Diabetes Outcome" stats={{
              'No Diabetes': stats.class.count0,
              'Diabetes': stats.class.count1,
              'No Diabetes %': `${stats.class.percentage0}%`,
              'Diabetes %': `${stats.class.percentage1}%`
            }} />
          )}
        </div>
      </div>

      {/* Charts Grid - All Charts in a Single Page */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
        {/* 1. Bar Chart: Diabetes Outcome Count */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#0d5c63', marginBottom: '15px' }}>📊 Diabetes Outcome Count</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.outcomeCount}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#0d5c63" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 2. Histogram: Glucose Distribution */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#0d5c63', marginBottom: '15px' }}>📈 Glucose Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.glucoseDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3498db" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 3. Histogram: Age Distribution */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#0d5c63', marginBottom: '15px' }}>📈 Age Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.ageDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#2ecc71" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 4. Histogram: BMI Distribution */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#0d5c63', marginBottom: '15px' }}>📈 BMI Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.massDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#f39c12" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 5. Box Plot: Glucose by Diabetes Outcome */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#0d5c63', marginBottom: '15px' }}>📦 Glucose by Diabetes Outcome</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData.glucoseBoxPlot}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area dataKey="q3" fill="#0d5c63" stroke="#0d5c63" />
              <Area dataKey="q1" fill="#3498db" stroke="#3498db" />
              <Line dataKey="median" stroke="#e74c3c" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 6. Box Plot: BMI by Diabetes Outcome */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#0d5c63', marginBottom: '15px' }}>📦 BMI by Diabetes Outcome</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData.bmiBoxPlot}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area dataKey="q3" fill="#2ecc71" stroke="#2ecc71" />
              <Area dataKey="q1" fill="#f39c12" stroke="#f39c12" />
              <Line dataKey="median" stroke="#e74c3c" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 7. Scatter Plot: Glucose vs BMI */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#0d5c63', marginBottom: '15px' }}>🔵 Glucose vs BMI</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="glucose" name="Glucose" />
              <YAxis dataKey="bmi" name="BMI" />
              <ZAxis range={[50, 200]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name="No Diabetes" data={chartData.scatterData.filter(d => d.outcome === 'No Diabetes')} fill="#0d5c63" />
              <Scatter name="Diabetes" data={chartData.scatterData.filter(d => d.outcome === 'Diabetes')} fill="#e74c3c" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* 8. Scatter Plot: Age vs Glucose */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#0d5c63', marginBottom: '15px' }}>🔵 Age vs Glucose</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="age" name="Age" />
              <YAxis dataKey="glucose" name="Glucose" />
              <ZAxis range={[50, 200]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name="No Diabetes" data={chartData.ageGlucoseScatter.filter(d => d.outcome === 'No Diabetes')} fill="#0d5c63" />
              <Scatter name="Diabetes" data={chartData.ageGlucoseScatter.filter(d => d.outcome === 'Diabetes')} fill="#e74c3c" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* 9. Radar Chart - Feature comparison */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#0d5c63', marginBottom: '15px' }}>🕸️ Feature Radar Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={chartData.featureRadarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="feature" />
              <PolarRadiusAxis domain={[0, 1]} />
              <Radar name="No Diabetes" dataKey="No Diabetes" stroke="#0d5c63" fill="#0d5c63" fillOpacity={0.6} />
              <Radar name="Diabetes" dataKey="Diabetes" stroke="#e74c3c" fill="#e74c3c" fillOpacity={0.6} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* 10. Pie Chart - Age Group Outcome */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#0d5c63', marginBottom: '15px' }}>🥧 Age Group Outcome Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.ageOutcomePie}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.ageOutcomePie.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 11. Line Chart - Glucose Trend */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#0d5c63', marginBottom: '15px' }}>📈 Glucose Trend by Age</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.glucoseTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ageRange" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgGlucose" stroke="#3498db" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 12. Line Chart - BMI Trend */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#0d5c63', marginBottom: '15px' }}>📈 BMI Trend by Age</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.bmiTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ageRange" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgBMI" stroke="#2ecc71" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 13. Pie Chart - Glucose Categories */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#0d5c63', marginBottom: '15px' }}>🍩 Glucose Risk Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.glucoseCategories}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.glucoseCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#2ecc71', '#f39c12', '#e74c3c'][index % 3]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 14. Pie Chart - BMI Categories */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#0d5c63', marginBottom: '15px' }}>🍩 BMI Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.bmiCategories}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.bmiCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#3498db', '#2ecc71', '#f39c12', '#e74c3c'][index % 4]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 15. Scatter Plot - Age vs BMI */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#0d5c63', marginBottom: '15px' }}>🔵 Age vs BMI</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="age" name="Age" />
              <YAxis dataKey="bmi" name="BMI" />
              <ZAxis range={[50, 200]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name="No Diabetes" data={chartData.ageBmiScatter.filter(d => d.outcome === 'No Diabetes')} fill="#0d5c63" />
              <Scatter name="Diabetes" data={chartData.ageBmiScatter.filter(d => d.outcome === 'Diabetes')} fill="#e74c3c" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* 16. Scatter Plot - Blood Pressure vs Glucose */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#0d5c63', marginBottom: '15px' }}>🔵 Blood Pressure vs Glucose</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="pressure" name="Blood Pressure" />
              <YAxis dataKey="glucose" name="Glucose" />
              <ZAxis range={[50, 200]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name="No Diabetes" data={chartData.presGlucoseScatter.filter(d => d.outcome === 'No Diabetes')} fill="#0d5c63" />
              <Scatter name="Diabetes" data={chartData.presGlucoseScatter.filter(d => d.outcome === 'Diabetes')} fill="#e74c3c" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* 17. Feature Comparison Chart */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', gridColumn: '1 / -1' }}>
          <h3 style={{ color: '#0d5c63', marginBottom: '15px' }}>📊 Feature Comparison by Outcome</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.featureComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="feature" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="No Diabetes" fill="#0d5c63" />
              <Bar dataKey="Diabetes" fill="#e74c3c" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 18. Outcome by Age Group */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', gridColumn: '1 / -1' }}>
          <h3 style={{ color: '#0d5c63', marginBottom: '15px' }}>📈 Diabetes Rate by Age Group</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.outcomeByAge}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ageRange" />
              <YAxis yAxisId="left" orientation="left" stroke="#0d5c63" />
              <YAxis yAxisId="right" orientation="right" stroke="#e74c3c" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="No Diabetes" fill="#0d5c63" />
              <Bar yAxisId="left" dataKey="Diabetes" fill="#e74c3c" />
              <Line yAxisId="right" type="monotone" dataKey="rate" stroke="#f39c12" strokeWidth={2} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 19. Radial Bar Chart */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#0d5c63', marginBottom: '15px' }}>🎯 Average Glucose by Outcome</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadialBarChart 
              cx="50%" 
              cy="50%" 
              innerRadius="20%" 
              outerRadius="80%" 
              data={chartData.radialGlucoseData}
              startAngle={180}
              endAngle={0}
            >
              <RadialBar minAngle={15} background clockWise={true} dataKey="value" />
              <Legend iconSize={10} width={120} height={140} layout="vertical" verticalAlign="middle" align="right" />
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        {/* 20. Funnel Chart */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#0d5c63', marginBottom: '15px' }}>🔽 Data Funnel Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <FunnelChart>
              <Tooltip />
              <Funnel
                dataKey="value"
                data={chartData.outcomeFunnelData}
                isAnimationActive
              >
                {chartData.outcomeFunnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Funnel>
              <Legend />
            </FunnelChart>
          </ResponsiveContainer>
        </div>

        {/* 21. Stacked Bar Chart */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', gridColumn: '1 / -1' }}>
          <h3 style={{ color: '#0d5c63', marginBottom: '15px' }}>📊 Stacked Feature Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.stackedFeatureData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="feature" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="No Diabetes" stackId="a" fill="#0d5c63" />
              <Bar dataKey="Diabetes" stackId="a" fill="#e74c3c" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 22. Correlation Heatmap */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', gridColumn: '1 / -1' }}>
          <h3 style={{ color: '#0d5c63', marginBottom: '15px' }}>🔥 Correlation Heatmap</h3>
          <HeatmapChart data={chartData.correlationData} />
        </div>
      </div>

      <div style={{
        marginTop: '15px',
        padding: '10px',
        background: '#E8EAF6',
        borderRadius: '8px',
        textAlign: 'center',
        color: '#0d5c63',
        fontSize: '14px',
        fontWeight: '500'
      }}>
        Total Records: {data.length} | Features: 8 | Target: Diabetes Outcome (Class)
      </div>
    </div>
  )
}

export default Data_Visualization