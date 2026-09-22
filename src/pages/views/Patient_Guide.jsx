import { useState, useEffect } from 'react'
import Groq from 'groq-sdk'
import jsPDF from 'jspdf'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const API_URL = import.meta.env.VITE_API_URL;

// ⚠️ Dev only — revoke & rotate before pushing to git or deploying
const GROQ_KEY = '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'

const groq = new Groq({
  apiKey: GROQ_KEY,
  dangerouslyAllowBrowser: true
});

function Patient_Guide({ user }) {
  const [predictions, setPredictions] = useState([])
  const [summary, setSummary] = useState('')
  const [diet, setDiet] = useState('')
  const [medicine, setMedicine] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('summary')

  useEffect(() => {
    fetchPredictions()
  }, [])

  const fetchPredictions = () => {
    const role = user?.role || 'patient'
    fetch(`${API_URL}/predictions?user_id=${user.id}`, {
      headers: { 'role': role }
    })
      .then(res => res.json())
      .then(data => {
        if (data.predictions) setPredictions(data.predictions)
      })
      .catch(err => console.error('Fetch predictions failed:', err))
  }

  const buildDataSummary = () => {
    const total = predictions.length
    const diabetic = predictions.filter(p => p.prediction_result === 1).length
    const nonDiabetic = total - diabetic
    const avgRisk = Math.round(
      predictions.reduce((s, p) => s + p.risk_percentage, 0) / total
    )
    const maxRisk = Math.max(...predictions.map(p => p.risk_percentage))
    const minRisk = Math.min(...predictions.map(p => p.risk_percentage))
    const latest = predictions[0]

    return {
      total, diabetic, nonDiabetic, avgRisk, maxRisk, minRisk,
      latest: latest ? {
        date: latest.created_at,
        risk: latest.risk_percentage,
        result: latest.prediction_result === 1 ? 'diabetic' : 'non-diabetic',
        glucose: latest.glucose,
        bmi: latest.bmi,
        blood_pressure: latest.blood_pressure,
        age: latest.age,
        insulin: latest.insulin
      } : null,
      recent5: predictions.slice(0, 5).map(p => ({
        date: new Date(p.created_at).toLocaleDateString(),
        risk: p.risk_percentage,
        result: p.prediction_result === 1 ? 'diabetic' : 'non-diabetic'
      }))
    }
  }

  const streamFromGroq = async (userPrompt, setter) => {
    const stream = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful, empathetic health assistant for a diabetes ' +
            'management app. Only use the data the user provides. Do not ' +
            'invent numbers. Keep answers concise, plain English, and ' +
            'structured with short sections. Always add a one-line reminder ' +
            'that this is not a substitute for professional medical advice.'
        },
        { role: 'user', content: userPrompt }
      ],
      model: 'openai/gpt-oss-120b',
      temperature: 0.3,
      max_completion_tokens: 2048,
      top_p: 1,
      stream: true,
      reasoning_effort: 'medium',
      stop: null
    })

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || ''
      if (delta) setter(prev => prev + delta)
    }
  }

  const generateAll = async () => {
    if (!predictions.length) {
      setError('No predictions to analyze')
      return
    }

    setLoading(true)
    setSummary('')
    setDiet('')
    setMedicine('')
    setError('')

    const data = buildDataSummary()
    const dataBlock = JSON.stringify(data, null, 2)

    try {
      await Promise.all([
        streamFromGroq(
          `Here is a patient's diabetes prediction summary in JSON:\n\n${dataBlock}\n\n` +
          `Write a friendly, plain-English summary of their risk trend. ` +
          `Mention whether risk is stable, rising, or falling, and what the ` +
          `latest result means. Use 3-5 short sentences.`,
          setSummary
        ),
        streamFromGroq(
          `Here is a patient's diabetes prediction summary in JSON:\n\n${dataBlock}\n\n` +
          `Provide a healthy eating plan tailored to this data. Use short bullet points ` +
          `under three headings: "Foods to Eat More Of", "Foods to Limit", and ` +
          `"Sample Daily Meal Plan". Be practical and specific.`,
          setDiet
        ),
        streamFromGroq(
          `Here is a patient's diabetes prediction summary in JSON:\n\n${dataBlock}\n\n` +
          `List general wellness and medication-awareness guidance for someone with ` +
          `this risk profile. IMPORTANT: do not prescribe specific drugs or doses. ` +
          `Instead, list categories of medicines a doctor might consider ` +
          `(e.g. metformin, insulin) and lifestyle/OTC supplements that may help ` +
          `(e.g. vitamin D, fiber). Use short bullet points. End with a clear ` +
          `reminder to consult a doctor before taking anything.`,
          setMedicine
        )
      ])
    } catch (err) {
      setError(err?.message || 'Groq request failed')
    } finally {
      setLoading(false)
    }
  }


const saveToPDF = () => {
  try {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 50
    const contentW = pageW - margin * 2
    let y = margin

    doc.setCharSpace(0)
    

    const ensureSpace = (needed) => {
      if (y + needed > pageH - margin - 30) {
        doc.addPage()
        y = margin
      }
    }

    const safe = (v) => (v === null || v === undefined ? '' : String(v))

    const cleanText = (text) =>
      safe(text)
        .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2')
        .replace(/\\\(|\\\)|\\\[|\\\]/g, '')
        .replace(/\\%/g, '%')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/^\s*#{1,6}\s+/gm, '')
        .replace(/\\/g, '')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()

    const wrapText = (text, fontStyle = 'normal', fontSize = 10.5, width = contentW) => {
      doc.setFont('helvetica', fontStyle)
      doc.setFontSize(fontSize)
      return doc.splitTextToSize(cleanText(text), width)
    }

    const drawHeaderBanner = (title, subtitle) => {
      doc.setFillColor(37, 99, 235)
      doc.rect(0, 0, pageW, 90, 'F')
      doc.setFillColor(124, 58, 237)
      doc.rect(0, 80, pageW, 10, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(22)
      doc.text(safe(title), margin, 45)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(safe(subtitle), margin, 64)

      y = 120
    }

    const drawSectionHeading = (title) => {
      ensureSpace(40)
      doc.setFillColor(37, 99, 235)
      doc.rect(margin, y - 12, 4, 18, 'F')
      doc.setTextColor(15, 23, 42)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text(safe(title), margin + 12, y)
      y += 22
    }

    const drawBody = (text) => {
      const lines = wrapText(text, 'normal', 10.5)
      doc.setTextColor(51, 65, 85)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10.5)
      lines.forEach((line) => {
        ensureSpace(15)
        doc.text(safe(line), margin, y)
        y += 15
      })
      y += 6
    }

    const drawBullets = (text) => {
      const raw = cleanText(text)
      const items = raw.split(/\n/).map(l => l.trim()).filter(Boolean)

      items.forEach((item) => {
        const isBullet = /^[-*•]\s+/.test(item)
        const isNumbered = /^\d+[.)]\s+/.test(item)
        const isHeadingLike =
          !isBullet && !isNumbered && item.length < 60 && !item.endsWith('.')

        if (isHeadingLike) {
          ensureSpace(20)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(11)
          doc.setTextColor(30, 64, 175)
          doc.text(safe(item), margin, y)
          y += 16
          return
        }

        const bullet = isNumbered ? item.match(/^\d+[.)]/)[0] : '•'
        const body = item.replace(/^([-*•]|\d+[.)])\s+/, '')
        const indent = 16
        const lines = wrapText(body, 'normal', 10.5, contentW - indent)

        ensureSpace(lines.length * 14 + 4)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10.5)

        doc.setTextColor(37, 99, 235)
        doc.text(bullet, margin + 4, y)

        doc.setTextColor(51, 65, 85)
        lines.forEach((line, i) => {
          if (i > 0) ensureSpace(14)
          doc.text(safe(line), margin + indent, y)
          y += 14
        })
        y += 3
      })
      y += 6
    }

    const drawStatRow = (stats) => {
      const boxH = 58
      const gap = 10
      const count = stats.length
      const boxW = (contentW - gap * (count - 1)) / count

      ensureSpace(boxH + 10)

      stats.forEach((s, i) => {
        const x = margin + i * (boxW + gap)
        doc.setFillColor(241, 245, 249)
        doc.roundedRect(x, y, boxW, boxH, 6, 6, 'F')

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(100, 116, 139)
        doc.text(safe(s.label).toUpperCase(), x + 10, y + 18)

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(16)
        doc.setTextColor(15, 23, 42)
        doc.text(safe(s.value), x + 10, y + 42)
      })
      y += boxH + 18
    }

    const drawDivider = () => {
      ensureSpace(14)
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.5)
      doc.line(margin, y, pageW - margin, y)
      y += 14
    }

    const drawFooter = () => {
      const total = doc.getNumberOfPages()
      for (let i = 1; i <= total; i++) {
        doc.setPage(i)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(148, 163, 184)
        doc.text(
          `Page ${i} of ${total} — AI-generated, not a substitute for professional medical advice.`,
          margin,
          pageH - 20
        )
      }
    }

    const data = buildDataSummary()

    drawHeaderBanner(
      'Diabetes AI Report',
      `Patient: ${user?.name || user?.email || 'N/A'}  •  Generated ${new Date().toLocaleString()}`
    )

    drawStatRow([
      { label: 'Total', value: data.total },
      { label: 'Diabetic', value: data.diabetic },
      { label: 'Non-diabetic', value: data.nonDiabetic },
      { label: 'Avg Risk', value: `${data.avgRisk}%` }
    ])

    drawStatRow([
      { label: 'Highest Risk', value: `${data.maxRisk}%` },
      { label: 'Lowest Risk', value: `${data.minRisk}%` }
    ])

    if (summary) {
      drawSectionHeading('Risk Summary')
      drawBody(summary)
      drawDivider()
    }

    if (diet) {
      drawSectionHeading('Healthy Diet Plan')
      drawBullets(diet)
      drawDivider()
    }

    if (medicine) {
      drawSectionHeading('Medicine & Wellness Awareness')
      drawBullets(medicine)
      drawDivider()
    }

    ensureSpace(70)
    doc.setFillColor(254, 249, 195)
    doc.roundedRect(margin, y, contentW, 58, 6, 6, 'F')
    doc.setFillColor(202, 138, 4)
    doc.rect(margin, y, 4, 58, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(120, 53, 15)
    doc.text('Important Disclaimer', margin + 12, y + 16)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const disc = doc.splitTextToSize(
      'This report is AI-generated for educational purposes only and is not a substitute for professional medical advice. Always consult a qualified healthcare provider before making any changes to medication, diet, or treatment.',
      contentW - 24
    )
    disc.forEach((line, i) => {
      doc.text(safe(line), margin + 12, y + 32 + i * 12)
    })

    drawFooter()
    doc.save(`diabetes-report-${Date.now()}.pdf`)
  } catch (err) {
    console.error('PDF generation failed:', err)
    alert('PDF failed: ' + err.message)
  }
}

  const tabs = [
    { id: 'summary',  label: '📊 Risk Summary',  content: summary },
    { id: 'diet',     label: '🥗 Healthy Diet',  content: diet },
    { id: 'medicine', label: '💊 Medicine',      content: medicine }
  ]

  const hasAnyContent = summary || diet || medicine
  const activeContent = tabs.find(t => t.id === activeTab)?.content

  return (
    <div className="pg-container">
      <style>{`
        .pg-container {
          max-width: 900px;
          margin: 40px auto;
          padding: 28px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: #f8fafc;
          min-height: 100vh;
        }
        .pg-header {
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          color: white;
          padding: 24px 28px;
          border-radius: 16px;
          margin-bottom: 24px;
          box-shadow: 0 10px 24px rgba(37, 99, 235, 0.25);
        }
        .pg-header h2 { margin: 0 0 6px; font-size: 24px; font-weight: 700; }
        .pg-header p { margin: 0; opacity: 0.9; font-size: 14px; }
        .pg-stats { display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap; }
        .pg-stat {
          background: rgba(255, 255, 255, 0.18);
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          backdrop-filter: blur(6px);
        }
        .pg-actions { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
        .pg-btn {
          padding: 12px 22px;
          border-radius: 10px;
          border: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .pg-btn-primary {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
        }
        .pg-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.45);
        }
        .pg-btn-secondary {
          background: white;
          color: #2563eb;
          border: 2px solid #2563eb;
        }
        .pg-btn-secondary:hover:not(:disabled) { background: #eff6ff; }
        .pg-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .pg-error {
          background: #fef2f2;
          color: #b91c1c;
          padding: 12px 16px;
          border-radius: 10px;
          border-left: 4px solid #ef4444;
          margin-bottom: 20px;
          font-size: 14px;
        }
        .pg-tabs { display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap; }
        .pg-tab {
          padding: 10px 18px;
          border-radius: 10px;
          border: none;
          background: white;
          color: #475569;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .pg-tab:hover { background: #eff6ff; }
        .pg-tab.active {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }
        .pg-card {
          background: white;
          border-radius: 14px;
          padding: 26px;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
          min-height: 220px;
        }
        .pg-card h3 { margin: 0 0 16px; color: #1e293b; font-size: 17px; }
        .pg-content {
          line-height: 1.7;
          color: #334155;
          font-size: 14.5px;
        }
        .pg-content p { margin: 10px 0; }
        .pg-content ul, .pg-content ol { padding-left: 22px; margin: 10px 0; }
        .pg-content li { margin: 4px 0; }
        .pg-content h1, .pg-content h2, .pg-content h3, .pg-content h4 {
          color: #1e293b;
          margin: 16px 0 8px;
          font-size: 15px;
          font-weight: 700;
        }
        .pg-content strong { color: #0f172a; font-weight: 700; }
        .pg-content code {
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 13px;
        }
        .pg-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 14px 0;
          font-size: 13.5px;
        }
        .pg-content th, .pg-content td {
          border: 1px solid #e2e8f0;
          padding: 8px 12px;
          text-align: left;
        }
        .pg-content th {
          background: #f1f5f9;
          font-weight: 600;
        }
        .pg-placeholder {
          color: #94a3b8;
          font-style: italic;
          text-align: center;
          padding: 60px 20px;
        }
        .pg-spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: white;
          border-radius: 50%;
          animation: pgspin 0.7s linear infinite;
          margin-right: 8px;
          vertical-align: middle;
        }
        @keyframes pgspin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="pg-header">
        <h2>🤖 AI Health Guidance</h2>
        <p>Personalized insights based on your prediction history</p>
        <div className="pg-stats">
          <span className="pg-stat">📋 {predictions.length} predictions</span>
          {predictions.length > 0 && (
            <span className="pg-stat">
              ⚠️ Avg risk: {Math.round(predictions.reduce((s, p) => s + p.risk_percentage, 0) / predictions.length)}%
            </span>
          )}
        </div>
      </div>

      <div className="pg-actions">
        <button
          className="pg-btn pg-btn-primary"
          onClick={generateAll}
          disabled={loading || predictions.length === 0}
        >
          {loading && <span className="pg-spinner"></span>}
          {loading ? 'Analyzing...' : hasAnyContent ? '🔄 Regenerate' : '✨ Generate AI Report'}
        </button>

        <button
          className="pg-btn pg-btn-secondary"
          onClick={saveToPDF}
          disabled={!hasAnyContent}
        >
          📄 Save as PDF
        </button>
      </div>

      {error && <div className="pg-error">⚠️ {error}</div>}

      <div className="pg-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`pg-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="pg-card">
        <h3>{tabs.find(t => t.id === activeTab)?.label}</h3>
        {activeContent ? (
          <div className="pg-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {activeContent}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="pg-placeholder">
            {loading
              ? 'Generating...'
              : 'Click "Generate AI Report" to see personalized guidance'}
          </div>
        )}
      </div>
    </div>
  )
}

export default Patient_Guide