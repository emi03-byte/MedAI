import html2pdf from 'html2pdf.js'

export const downloadPrescriptionPDF = async ({ prescription, faviconDataUrl }) => {
  console.log('🔄 Generez PDF pentru rețeta din istoric:', prescription.id)

  const hasMedicines = prescription.medicamente && prescription.medicamente.length > 0
  const hasPatientNotes = prescription.indicatii_pacient && prescription.indicatii_pacient.trim() !== ''
  const hasDoctorNotes = prescription.indicatii_medic && prescription.indicatii_medic.trim() !== ''
  const planuriTratament = prescription.planuri_tratament || {}

  const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <link rel="icon" type="image/svg+xml" href="${faviconDataUrl}">
          <title>Rețetă ${prescription.nume_pacient || ''}</title>
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
              <p>Generat la: ${new Date(prescription.data_creare).toLocaleString('ro-RO')}</p>
              ${hasMedicines ? `<p>Total medicamente: ${prescription.medicamente.length}</p>` : ''}
            </div>
            
            ${
              hasMedicines
                ? `
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
                ${prescription.medicamente
                  .map((product, index) => {
                    const medicineCode = product['Cod medicament'] || product.cod_medicament
                    const plan =
                      planuriTratament[medicineCode] ||
                      planuriTratament[product['Denumire medicament']] ||
                      planuriTratament[product.denumire_medicament]
                    let planDescription = 'Fără plan'

                    if (plan) {
                      const parts = []

                      if (plan.duration) {
                        parts.push(plan.duration === '1' ? '1 zi' : `${plan.duration} zile`)
                      }

                      if (plan.frequency) {
                        if (plan.isCustomFrequency) {
                          parts.push(`${plan.frequency} ori pe zi`)
                        } else {
                          const frequencyMap = {
                            '1': 'o dată pe zi',
                            '2': 'de două ori pe zi',
                            '3': 'de trei ori pe zi',
                            '4': 'de patru ori pe zi',
                          }
                          parts.push(frequencyMap[plan.frequency] || `${plan.frequency} ori pe zi`)
                        }
                      }

                      if (plan.times && plan.times.length > 0) {
                        const timesText = plan.times
                          .map((time) => {
                            const timeMap = {
                              dimineata: 'dimineața',
                              amiaza: 'amiaza',
                              seara: 'seara',
                              noaptea: 'noaptea',
                              la4ore: 'la 4 ore',
                              la6ore: 'la 6 ore',
                              la8ore: 'la 8 ore',
                              la12ore: 'la 12 ore',
                            }
                            return timeMap[time] || time
                          })
                          .join(', ')
                        parts.push(timesText)
                      }

                      planDescription = parts.join(', ')
                    }

                    const denumire = product['Denumire medicament'] || product.denumire_medicament || ''
                    const cod = product['Cod medicament'] || product.cod_medicament || ''

                    return `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${denumire}</td>
                      <td>${cod}</td>
                      <td>${planDescription}</td>
                    </tr>
                  `
                  })
                  .join('')}
              </tbody>
            </table>
            `
                : ''
            }
            
            ${
              hasPatientNotes
                ? `
            <div class="patient-indications-section">
              <h2>Indicații Pacient</h2>
              <div class="patient-indications-content">
                ${
                  prescription.nume_pacient && prescription.nume_pacient.trim() !== ''
                    ? `Nume: ${prescription.nume_pacient}\n\n`
                    : ''
                }${prescription.indicatii_pacient}
              </div>
            </div>
            `
                : ''
            }
            
            ${
              hasDoctorNotes
                ? `
            <div class="doctor-indications-section">
              <h2>Indicații Medic</h2>
              <div class="doctor-indications-content">
                ${prescription.indicatii_medic}
              </div>
            </div>
            `
                : ''
            }
            
            <div class="footer">
              <p>Document generat automat de aplicația MedAI</p>
            </div>
          </div>
        </body>
      </html>
    `

  const dateStr = new Date(prescription.data_creare)
    .toISOString()
    .slice(0, 19)
    .replace(/[:T]/g, '-')
  const filename = `reteta-${
    prescription.nume_pacient ? prescription.nume_pacient.replace(/\s+/g, '-') : 'pacient'
  }-${dateStr}.pdf`

  try {
    const worker = html2pdf()
      .set({
        margin: 0,
        filename,
        html2canvas: { scale: 2, dpi: 192, letterRendering: true, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(htmlContent)
      .toPdf()

    await worker.save()

    const pdfBlob = await worker.output('blob')
    const blobUrl = URL.createObjectURL(pdfBlob)

    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    link.click()

    window.open(blobUrl, '_blank', 'noopener,noreferrer')

    setTimeout(() => URL.revokeObjectURL(blobUrl), 30000)
  } catch (error) {
    console.error('❌ Eroare la generarea PDF-ului:', error)
    alert('A apărut o eroare la generarea PDF-ului. Încearcă din nou.')
  }
}

