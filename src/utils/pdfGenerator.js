import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generatePredictionPDF = (userData, predictionData, healthData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Colors
    const primaryColor = [26, 35, 126]; // #1A237E
    const dangerColor = [229, 57, 53]; // #E53935
    const successColor = [67, 160, 71]; // #43A047
    const warningColor = [251, 140, 0]; // #FB8C00
    
    // ========== HEADER ==========
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('🩺 Diabetes Risk Predictor', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Prediction Report', pageWidth / 2, 32, { align: 'center' });
    
    // ========== REPORT INFO ==========
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const date = new Date();
    const dateStr = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    const timeStr = date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    doc.text(`Report Date: ${dateStr} at ${timeStr}`, 20, 55);
    doc.text(`Report ID: PRED-${predictionData.id || 'N/A'}-${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`, 20, 62);
    
    // ========== DIVIDER ==========
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 68, pageWidth - 20, 68);
    
    // ========== PATIENT INFORMATION ==========
    let yPos = 78;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Patient Information', 20, yPos);
    yPos += 8;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    
    const patientData = [
        ['Name:', userData.name || 'N/A'],
        ['Email:', userData.email || 'N/A'],
        ['Patient ID:', `#${userData.id || 'N/A'}`],
        ['Role:', (userData.role || 'patient').charAt(0).toUpperCase() + (userData.role || 'patient').slice(1)]
    ];
    
    patientData.forEach(([label, value]) => {
        doc.setTextColor(80, 80, 80);
        doc.setFont('helvetica', 'bold');
        doc.text(label, 20, yPos);
        doc.setTextColor(40, 40, 40);
        doc.setFont('helvetica', 'normal');
        doc.text(String(value), 70, yPos);
        yPos += 7;
    });
    
    yPos += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 8;
    
    // ========== PREDICTION RESULTS ==========
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Prediction Results', 20, yPos);
    yPos += 8;
    
    // Risk color
    const risk = predictionData.risk_percentage || 0;
    let riskColor = successColor;
    let riskText = 'Low Risk';
    if (risk >= 70) {
        riskColor = dangerColor;
        riskText = 'High Risk';
    } else if (risk >= 40) {
        riskColor = warningColor;
        riskText = 'Medium Risk';
    }
    
    const resultText = predictionData.result || 'N/A';
    const resultColor = resultText === 'Diabetic' ? dangerColor : successColor;
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(resultColor[0], resultColor[1], resultColor[2]);
    doc.text(`Result: ${resultText}`, 20, yPos);
    yPos += 10;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(`Risk Score: ${risk}%`, 20, yPos);
    yPos += 7;
    
    doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`Risk Level: ${riskText}`, 20, yPos);
    yPos += 7;
    
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(`Confidence: ${((predictionData.confidence || 0) * 100).toFixed(1)}%`, 20, yPos);
    yPos += 10;
    
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 8;
    
    // ========== HEALTH METRICS TABLE ==========
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Health Metrics', 20, yPos);
    yPos += 8;
    
    const metrics = [
        ['Metric', 'Value', 'Normal Range'],
        ['Glucose', `${healthData.glucose || 'N/A'} mg/dL`, '70-100 mg/dL'],
        ['Blood Pressure', `${healthData.blood_pressure || 'N/A'} mm Hg`, '90/60 - 120/80'],
        ['BMI', `${healthData.bmi || 'N/A'}`, '18.5 - 24.9'],
        ['Age', `${healthData.age || 'N/A'} years`, '—'],
        ['Insulin', `${healthData.insulin || 'N/A'} µIU/mL`, '—'],
        ['Skin Thickness', `${healthData.skin_thickness || 'N/A'} mm`, '—'],
        ['Pregnancies', `${healthData.pregnancies || 'N/A'}`, '—'],
        ['Diabetes Pedigree', `${healthData.diabetes_pedigree_function || 'N/A'}`, '—']
    ];
    
    doc.autoTable({
        startY: yPos,
        head: [metrics[0]],
        body: metrics.slice(1),
        theme: 'striped',
        headStyles: {
            fillColor: [26, 35, 126],
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold'
        },
        bodyStyles: {
            fontSize: 10
        },
        columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 50 },
            2: { cellWidth: 50 }
        },
        margin: { left: 20, right: 20 }
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
    
    // ========== RECOMMENDATIONS ==========
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Recommendations', 20, yPos);
    yPos += 8;
    
    let recommendations = [];
    if (risk >= 70) {
        recommendations = [
            '⚠️ High Risk - Please consult a healthcare provider immediately',
            '📋 Schedule a comprehensive diabetes screening',
            '🍎 Follow a strict diabetic diet plan',
            '🏃 Start regular exercise (at least 30 minutes daily)',
            '📊 Monitor blood glucose levels regularly'
        ];
    } else if (risk >= 40) {
        recommendations = [
            '⚡ Medium Risk - Consider lifestyle modifications',
            '🍽️ Adopt a balanced diet with reduced sugar intake',
            '🚶 Increase physical activity (walk 20-30 minutes daily)',
            '📈 Monitor your blood glucose levels',
            '🩺 Schedule a check-up with your healthcare provider'
        ];
    } else {
        recommendations = [
            '✅ Low Risk - Maintain healthy lifestyle',
            '🥗 Continue eating a balanced diet',
            '🏃 Stay physically active',
            '📊 Regular health check-ups recommended',
            '💪 Maintain healthy weight and BMI'
        ];
    }
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    recommendations.forEach((rec, index) => {
        doc.text(rec, 20, yPos);
        yPos += 6;
    });
    
    yPos += 5;
    
    // ========== FOOTER ==========
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 6;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text(
        'This report is generated by Diabetes Risk Predictor and is for informational purposes only.',
        pageWidth / 2,
        yPos,
        { align: 'center' }
    );
    yPos += 4;
    doc.text(
        'Please consult a healthcare professional for medical advice.',
        pageWidth / 2,
        yPos,
        { align: 'center' }
    );
    
    // ========== SAVE PDF ==========
    const fileName = `prediction_report_${userData.name}_${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}.pdf`;
    doc.save(fileName);
};