export const openCheckoutHtml = async ({
  faviconDataUrl,
  selectedProducts,
  medicinePlans,
  patientNotes,
  doctorNotes,
  patientName,
}) => {
  console.log('🔄 Pregătesc pagina de checkout...')
  const hasMedicines = selectedProducts.length > 0
  const hasPatientNotes = patientNotes && patientNotes.trim() !== ''
  const hasDoctorNotes = doctorNotes && doctorNotes.trim() !== ''

  const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <link rel="icon" type="image/svg+xml" href="${faviconDataUrl}">
          <title>Checkout rețetă</title>
          <style>
            * {
              box-sizing: border-box;
            }
            html, body {
              background-color: #ffffff !important;
              color: #333333 !important;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 28px;
              color: #333 !important;
              background-color: #ffffff !important;
            }
            .pdf-container {
              margin-top: 35px;
              padding: 24px 30px 36px;
              background-color: #ffffff !important;
            }
            .header {
              text-align: center;
              margin-bottom: 28px;
              border-bottom: 2px solid #1a3c7c;
              padding-bottom: 10px;
              background-color: #ffffff !important;
            }
            .header h1 {
              color: #1a3c7c !important;
              margin: 0;
              font-size: 24.5px;
            }
            .header p {
              margin: 6px 0 0 0;
              color: #666666 !important;
              font-size: 14px;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              background-color: #ffffff !important;
            }
            .table th {
              background-color: #f5f5f5 !important;
              color: #555555 !important;
              padding: 12px 10px;
              text-align: left;
              font-weight: 600;
              border-bottom: 1px solid #d0d7e4;
              font-size: 13.6px;
            }
            .table td {
              padding: 11px 9px;
              border-bottom: 1px solid #e1e5ed;
              font-size: 13px;
              color: #333333 !important;
              background-color: #ffffff !important;
            }
            .table td:nth-child(2),
            .table td:nth-child(3),
            .table td:nth-child(4) {
              font-size: 14.5px;
            }
            .table tr:nth-child(even) {
              background-color: #f9f9f9 !important;
            }
            .table tr:nth-child(even) td {
              background-color: #f9f9f9 !important;
            }
            .table tr:hover {
              background-color: #f0f8ff !important;
            }
            .table tr:hover td {
              background-color: #f0f8ff !important;
            }
            .patient-indications-section {
              margin-top: 30px;
              page-break-inside: avoid;
            }
            .patient-indications-section h2 {
              color: #1a3c7c !important;
              font-size: 18.2px;
              margin-bottom: 15px;
              border-bottom: 2px solid #1a3c7c;
              padding-bottom: 5px;
            }
            .patient-indications-content {
              background-color: #f8f9fa !important;
              border: 1px solid #e9ecef !important;
              border-radius: 5px;
              padding: 16px;
              font-size: 14.7px;
              line-height: 1.6;
              color: #333333 !important;
              white-space: pre-line;
              text-align: left;
              text-indent: 0 !important;
              margin: 0 !important;
              padding-left: 10px !important;
            }
            .patient-indications-content p {
              margin: 0 !important;
              padding: 0 !important;
              text-indent: 0 !important;
              color: #333333 !important;
            }
            .patient-indications-content::first-line {
              text-indent: 0 !important;
            }
            .doctor-indications-section {
              margin-top: 30px;
              page-break-inside: avoid;
            }
            .doctor-indications-section h2 {
              color: #1a3c7c !important;
              font-size: 18.2px;
              margin-bottom: 15px;
              border-bottom: 2px solid #1a3c7c;
              padding-bottom: 5px;
            }
            .doctor-indications-content {
              background-color: #f8f9fa !important;
              border: 1px solid #e9ecef !important;
              border-radius: 5px;
              padding: 16px;
              font-size: 14.7px;
              line-height: 1.6;
              color: #333333 !important;
              white-space: pre-line;
              text-align: left;
              text-indent: 0 !important;
              margin: 0 !important;
              padding-left: 10px !important;
            }
            .doctor-indications-content p {
              margin: 0 !important;
              padding: 0 !important;
              text-indent: 0 !important;
              color: #333333 !important;
            }
            .doctor-indications-content::first-line {
              text-indent: 0 !important;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12.5px;
              color: #666666 !important;
              border-top: 1px solid #dddddd;
              padding-top: 10px;
              background-color: #ffffff !important;
            }
            .footer p {
              color: #666666 !important;
            }
          </style>
        </head>
        <body>
          <div class="pdf-container">
            <div class="header">
              <h1>${hasMedicines ? 'Rețetă' : 'Notițe Medicale'}</h1>
              <p>Generat la: ${new Date().toLocaleString('ro-RO')}</p>
              ${hasMedicines ? `<p>Total medicamente: ${selectedProducts.length}</p>` : ''}
            </div>
            
            ${hasMedicines ? `
            <table class="table">
              <thead>
                <tr>
                  <th>Nr.</th>
                  <th>Denumire Medicament</th>
                  <th>Cod Medicament</th>
                  <th>Plan de Tratament</th>
                </tr>
              </thead>
              <tbody>
                ${selectedProducts.map((product, index) => {
                  const plan = medicinePlans[product['Cod medicament']] || {}
                  const planText = plan.duration ? `${plan.duration} ${plan.unit || 'zile'}, ${plan.frequency || '1x/zi'}` : ''
                  return `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${product['Denumire medicament'] || ''}</td>
                      <td>${product['Cod medicament'] || ''}</td>
                      <td>${planText}</td>
                    </tr>
                  `
                }).join('')}
              </tbody>
            </table>
            ` : ''}
            
            ${hasPatientNotes ? `
            <div class="patient-indications-section">
              <h2>Indicații Pacient</h2>
              <div class="patient-indications-content">
                ${patientName && patientName.trim() !== '' ? `Nume: ${patientName}\n\n` : ''}${patientNotes}
              </div>
            </div>
            ` : ''}
            
            ${hasDoctorNotes ? `
            <div class="doctor-indications-section">
              <h2>Indicații Medic</h2>
              <div class="doctor-indications-content">
                ${doctorNotes}
              </div>
            </div>
            ` : ''}
            
            <div class="footer">
              <p>Document generat automat de aplicația MedAI</p>
            </div>
          </div>
        </body>
      </html>
    `

  try {
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const blobUrl = URL.createObjectURL(blob)

    window.open(blobUrl, '_blank', 'noopener,noreferrer')

    setTimeout(() => URL.revokeObjectURL(blobUrl), 30000)
  } catch (error) {
    console.error('❌ Eroare la generarea PDF-ului:', error)
    alert('A apărut o eroare la generarea PDF-ului. Încearcă din nou.')
  }
}

