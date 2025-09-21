import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface PDFOptions {
  filename?: string
  format?: 'a4' | 'letter'
  orientation?: 'portrait' | 'landscape'
  margin?: number
}

// Helper function to sanitize CSS for html2canvas compatibility
function sanitizeElementForPDF(element: HTMLElement): HTMLElement {
  const clonedElement = element.cloneNode(true) as HTMLElement

  // Create a temporary container
  const tempContainer = document.createElement('div')
  tempContainer.style.position = 'absolute'
  tempContainer.style.left = '-9999px'
  tempContainer.style.top = '-9999px'
  tempContainer.style.width = element.offsetWidth + 'px'
  tempContainer.appendChild(clonedElement)
  document.body.appendChild(tempContainer)

  // Replace problematic CSS properties with compatible alternatives
  const allElements = clonedElement.querySelectorAll('*')
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement
    const computedStyle = window.getComputedStyle(htmlEl)

    // Convert modern color functions to hex/rgb
    const colorProperties = ['color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor']
    colorProperties.forEach(prop => {
      const value = computedStyle.getPropertyValue(prop)
      if (value && (value.includes('lab(') || value.includes('lch(') || value.includes('oklch(') || value.includes('oklab('))) {
        // Convert to RGB as fallback
        const tempDiv = document.createElement('div')
        tempDiv.style.color = value
        document.body.appendChild(tempDiv)
        const rgbValue = window.getComputedStyle(tempDiv).color
        document.body.removeChild(tempDiv)
        htmlEl.style.setProperty(prop, rgbValue, 'important')
      }
    })

    // Remove problematic CSS properties that html2canvas can't handle
    htmlEl.style.removeProperty('backdrop-filter')
    htmlEl.style.removeProperty('filter')
    htmlEl.style.removeProperty('mix-blend-mode')
    htmlEl.style.removeProperty('isolation')

    // Ensure text is visible
    if (computedStyle.color === 'transparent' || computedStyle.color === 'rgba(0, 0, 0, 0)') {
      htmlEl.style.color = '#000000'
    }

    // Ensure backgrounds are visible
    if (computedStyle.backgroundColor === 'transparent' || computedStyle.backgroundColor === 'rgba(0, 0, 0, 0)') {
      if (htmlEl.tagName === 'TH' || htmlEl.classList.contains('bg-gray-50') || htmlEl.classList.contains('bg-gray-100')) {
        htmlEl.style.backgroundColor = '#f9fafb'
      }
    }
  })

  return { element: clonedElement, container: tempContainer }
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

  let tempContainer: HTMLElement | null = null

  try {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`)
    }

    // Sanitize element for PDF generation
    const { element: sanitizedElement, container } = sanitizeElementForPDF(element)
    tempContainer = container

    // Create canvas from sanitized HTML element
    const canvas = await html2canvas(sanitizedElement, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false, // Disable logging to reduce console noise
      removeContainer: false,
      foreignObjectRendering: false, // Disable foreign object rendering for better compatibility
      ignoreElements: (element) => {
        // Ignore elements that might cause issues
        return element.classList.contains('no-pdf') ||
               element.tagName === 'SCRIPT' ||
               element.tagName === 'STYLE'
      }
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

    // Provide more specific error messages
    let errorMessage = 'Failed to generate PDF'
    if (error instanceof Error) {
      if (error.message.includes('lab(') || error.message.includes('lch(') || error.message.includes('oklch(')) {
        errorMessage = 'PDF generation failed due to unsupported color format. Please try again.'
      } else if (error.message.includes('canvas')) {
        errorMessage = 'PDF generation failed during canvas creation. Please check the content.'
      } else if (error.message.includes('not found')) {
        errorMessage = 'PDF generation failed: Content element not found.'
      } else {
        errorMessage = `PDF generation failed: ${error.message}`
      }
    }

    throw new Error(errorMessage)
  } finally {
    // Clean up temporary container
    if (tempContainer && tempContainer.parentNode) {
      tempContainer.parentNode.removeChild(tempContainer)
    }
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

/**
 * Generate PDF for quotations - MAIN USER FUNCTION
 *
 * This is the primary function used by the quotation detail page when users
 * click "Download PDF". It directly generates the PDF without any test suite
 * involvement and includes fallback methods for reliability.
 *
 * @param quotationData - The quotation data to generate PDF for
 */
export async function generateQuotationPDF(quotationData: any): Promise<void> {
  const filename = `quotation-${quotationData.quotationNumber}.pdf`

  try {
    // First attempt with the enhanced PDF generation
    await generatePDFFromElement('quotation-preview', {
      filename,
      format: 'a4',
      orientation: 'portrait'
    })
  } catch (error) {
    console.warn('Primary PDF generation failed, attempting fallback method:', error)

    // Fallback: Try with simplified options
    try {
      const element = document.getElementById('quotation-preview')
      if (!element) {
        throw new Error('Quotation preview element not found')
      }

      // Add PDF-compatible class if not already present
      if (!element.classList.contains('pdf-compatible')) {
        element.classList.add('pdf-compatible')
      }

      // Wait a moment for styles to apply
      await new Promise(resolve => setTimeout(resolve, 100))

      // Try again with more conservative settings
      const canvas = await html2canvas(element, {
        scale: 1.5, // Reduced scale for better compatibility
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        removeContainer: false,
        foreignObjectRendering: false,
        ignoreElements: (element) => {
          return element.classList.contains('no-pdf') ||
                 element.tagName === 'SCRIPT' ||
                 element.tagName === 'STYLE' ||
                 element.classList.contains('no-print')
        },
        onclone: (clonedDoc) => {
          // Additional cleanup on the cloned document
          const clonedElement = clonedDoc.getElementById('quotation-preview')
          if (clonedElement) {
            // Force all text to be black
            const allElements = clonedElement.querySelectorAll('*')
            allElements.forEach((el) => {
              const htmlEl = el as HTMLElement
              if (window.getComputedStyle(htmlEl).color === 'transparent') {
                htmlEl.style.color = '#000000'
              }
            })
          }
        }
      })

      const imgData = canvas.toDataURL('image/png')

      // Create PDF with simplified approach
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // Calculate dimensions to fit A4
      const pdfWidth = 210
      const pdfHeight = 297
      const margin = 10
      const availableWidth = pdfWidth - (margin * 2)
      const availableHeight = pdfHeight - (margin * 2)

      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(availableWidth / (imgWidth * 0.264583), availableHeight / (imgHeight * 0.264583))

      const scaledWidth = (imgWidth * 0.264583) * ratio
      const scaledHeight = (imgHeight * 0.264583) * ratio

      pdf.addImage(imgData, 'PNG', margin, margin, scaledWidth, scaledHeight)
      pdf.save(filename)

    } catch (fallbackError) {
      console.error('Fallback PDF generation also failed:', fallbackError)
      throw new Error('PDF generation failed. Please try refreshing the page and attempting again.')
    }
  }
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
