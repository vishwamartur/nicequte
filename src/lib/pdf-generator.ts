import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface PDFOptions {
  filename?: string
  format?: 'a4' | 'letter'
  orientation?: 'portrait' | 'landscape'
  margin?: number
}

export async function generatePDFFromElement(
  elementId: string, 
  options: PDFOptions = {}
): Promise<void> {
  const {
    filename = 'quotation.pdf',
    format = 'a4',
    orientation = 'portrait',
    margin = 10
  } = options

  try {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`)
    }

    // Create canvas from HTML element
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    })

    const imgData = canvas.toDataURL('image/png')
    
    // Calculate dimensions
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    
    // PDF dimensions (A4: 210 x 297 mm)
    const pdfWidth = format === 'a4' ? 210 : 216 // letter: 216 x 279 mm
    const pdfHeight = format === 'a4' ? 297 : 279
    
    const availableWidth = pdfWidth - (margin * 2)
    const availableHeight = pdfHeight - (margin * 2)
    
    // Calculate scaling to fit content
    const scaleX = availableWidth / (imgWidth * 0.264583) // Convert px to mm
    const scaleY = availableHeight / (imgHeight * 0.264583)
    const scale = Math.min(scaleX, scaleY)
    
    const scaledWidth = (imgWidth * 0.264583) * scale
    const scaledHeight = (imgHeight * 0.264583) * scale
    
    // Create PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format
    })

    // Add metadata
    pdf.setProperties({
      title: filename.replace('.pdf', ''),
      subject: 'Quotation Document',
      author: 'InvGen Quotation Generator',
      creator: 'InvGen',
      producer: 'InvGen',
      creationDate: new Date()
    })

    // Add image to PDF
    pdf.addImage(
      imgData,
      'PNG',
      margin,
      margin,
      scaledWidth,
      scaledHeight
    )

    // Save PDF
    pdf.save(filename)
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error('Failed to generate PDF')
  }
}

export function printElement(elementId: string): void {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`)
  }

  // Create a new window for printing
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    throw new Error('Failed to open print window')
  }

  // Get all stylesheets
  const stylesheets = Array.from(document.styleSheets)
    .map(sheet => {
      try {
        return Array.from(sheet.cssRules)
          .map(rule => rule.cssText)
          .join('\n')
      } catch (e) {
        // Handle cross-origin stylesheets
        return ''
      }
    })
    .join('\n')

  // Create print document
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Quotation</title>
        <style>
          ${stylesheets}
          @media print {
            body { margin: 0; }
            .print\\:hidden { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
      </body>
    </html>
  `)

  printWindow.document.close()
  
  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.print()
    printWindow.close()
  }
}

export async function generateQuotationPDF(quotationData: any): Promise<void> {
  const filename = `quotation-${quotationData.quotationNumber}.pdf`

  await generatePDFFromElement('quotation-preview', {
    filename,
    format: 'a4',
    orientation: 'portrait'
  })
}

// Enhanced print function for quotations
export function printQuotation(quotationData: any): void {
  // Create a formatted quotation document for printing
  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (!printWindow) {
    console.error('Failed to open print window')
    return
  }

  const currentDate = new Date().toLocaleDateString()

  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Quotation ${quotationData.quotationNumber}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
          }

          .quotation-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }

          .company-info h1 {
            margin: 0 0 10px 0;
            font-size: 24px;
            color: #333;
          }

          .quotation-details {
            text-align: right;
          }

          .quotation-number {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
          }

          .customer-section {
            margin: 30px 0;
          }

          .section-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 10px;
            color: #333;
          }

          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
          }

          .items-table th,
          .items-table td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
          }

          .items-table th {
            background-color: #f8f9fa;
            font-weight: bold;
          }

          .items-table .text-right {
            text-align: right;
          }

          .totals-section {
            margin-top: 30px;
            text-align: right;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #eee;
          }

          .total-row.final {
            border-top: 2px solid #333;
            border-bottom: 2px solid #333;
            font-weight: bold;
            font-size: 14px;
            margin-top: 10px;
            padding: 10px 0;
          }

          .notes-section {
            margin-top: 40px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }

          .print-footer {
            margin-top: 50px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }

          @media print {
            body { margin: 0; padding: 15px; }
            .page-break { page-break-before: always; }
            .avoid-break { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="quotation-header">
          <div class="company-info">
            <h1>${quotationData.company?.name || 'Your Company Name'}</h1>
            <div>${quotationData.company?.address || ''}</div>
            <div>${quotationData.company?.phone || ''}</div>
            <div>${quotationData.company?.email || ''}</div>
            ${quotationData.company?.gstNumber ? `<div>GST: ${quotationData.company.gstNumber}</div>` : ''}
          </div>
          <div class="quotation-details">
            <div class="quotation-number">Quotation #${quotationData.quotationNumber}</div>
            <div>Date: ${new Date(quotationData.createdAt).toLocaleDateString()}</div>
            ${quotationData.validUntil ? `<div>Valid Until: ${new Date(quotationData.validUntil).toLocaleDateString()}</div>` : ''}
            <div>Status: ${quotationData.status}</div>
          </div>
        </div>

        <div class="customer-section">
          <div class="section-title">Bill To:</div>
          <div><strong>${quotationData.customer.name}</strong></div>
          ${quotationData.customer.address ? `<div>${quotationData.customer.address}</div>` : ''}
          ${quotationData.customer.phone ? `<div>Phone: ${quotationData.customer.phone}</div>` : ''}
          ${quotationData.customer.email ? `<div>Email: ${quotationData.customer.email}</div>` : ''}
          ${quotationData.customer.gstNumber ? `<div>GST: ${quotationData.customer.gstNumber}</div>` : ''}
        </div>

        ${quotationData.title ? `<div class="section-title">${quotationData.title}</div>` : ''}
        ${quotationData.description ? `<div style="margin-bottom: 20px;">${quotationData.description}</div>` : ''}

        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Description</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${quotationData.items.map((item: any) => `
              <tr>
                <td>${item.product.name}</td>
                <td>${item.product.description || item.description || ''}</td>
                <td class="text-right">${item.quantity} ${item.product.unit}</td>
                <td class="text-right">₹${item.unitPrice.toFixed(2)}</td>
                <td class="text-right">₹${item.lineTotal.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>₹${quotationData.subtotal.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>GST (${quotationData.gstRate}%):</span>
            <span>₹${quotationData.gstAmount.toFixed(2)}</span>
          </div>
          <div class="total-row final">
            <span>Total Amount:</span>
            <span>₹${quotationData.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        ${quotationData.notes ? `
          <div class="notes-section">
            <div class="section-title">Notes:</div>
            <div>${quotationData.notes}</div>
          </div>
        ` : ''}

        <div class="print-footer">
          <div>This quotation was generated on ${currentDate}</div>
          <div>Thank you for your business!</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
    </html>
  `

  printWindow.document.write(printContent)
  printWindow.document.close()
}
