// Print utility functions

export function printElement(elementId: string) {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error(`Element with id "${elementId}" not found`)
    return
  }

  // Create a new window for printing
  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (!printWindow) {
    console.error('Failed to open print window')
    return
  }

  // Get all stylesheets from the current document
  const stylesheets = Array.from(document.styleSheets)
  let styles = ''

  // Extract CSS rules from stylesheets
  stylesheets.forEach(stylesheet => {
    try {
      if (stylesheet.cssRules) {
        Array.from(stylesheet.cssRules).forEach(rule => {
          styles += rule.cssText + '\n'
        })
      }
    } catch (e) {
      // Handle cross-origin stylesheets
      console.warn('Could not access stylesheet:', e)
    }
  })

  // Add print-specific styles
  const printStyles = `
    <style>
      /* Print-specific styles */
      @media print {
        body {
          margin: 0;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #000;
          background: white;
        }
        
        /* Hide elements that shouldn't be printed */
        .no-print,
        .print-hidden,
        button,
        .btn,
        nav,
        .navigation,
        .sidebar,
        .header-actions,
        .action-buttons {
          display: none !important;
        }
        
        /* Ensure content fits on page */
        .print-container {
          max-width: 100%;
          margin: 0;
          padding: 0;
        }
        
        /* Table styles for print */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        
        th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        
        /* Page breaks */
        .page-break {
          page-break-before: always;
        }
        
        .avoid-break {
          page-break-inside: avoid;
        }
        
        /* Headers and footers */
        .print-header {
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        
        .print-footer {
          margin-top: 30px;
          border-top: 1px solid #ddd;
          padding-top: 20px;
          font-size: 10px;
          color: #666;
        }
        
        /* Company logo and branding */
        .company-logo {
          max-height: 60px;
          max-width: 200px;
        }
        
        /* Quotation specific styles */
        .quotation-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
        }
        
        .quotation-details {
          text-align: right;
        }
        
        .quotation-number {
          font-size: 18px;
          font-weight: bold;
          color: #333;
        }
        
        .customer-info, .company-info {
          margin-bottom: 20px;
        }
        
        .info-label {
          font-weight: bold;
          color: #333;
        }
        
        .items-table th {
          background-color: #f8f9fa;
        }
        
        .total-section {
          margin-top: 20px;
          text-align: right;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
        }
        
        .total-row.final {
          border-top: 2px solid #333;
          font-weight: bold;
          font-size: 14px;
        }
        
        /* Ensure proper spacing */
        h1, h2, h3 {
          margin-top: 0;
          margin-bottom: 15px;
        }
        
        p {
          margin: 5px 0;
        }
        
        /* Status badges */
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .status-draft { background-color: #f3f4f6; color: #374151; }
        .status-sent { background-color: #dbeafe; color: #1e40af; }
        .status-accepted { background-color: #d1fae5; color: #065f46; }
        .status-rejected { background-color: #fee2e2; color: #991b1b; }
        .status-expired { background-color: #fed7aa; color: #9a3412; }
      }
      
      /* Screen styles for print preview */
      @media screen {
        .print-preview {
          max-width: 210mm;
          margin: 0 auto;
          padding: 20mm;
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
      }
    </style>
  `

  // Create the print document
  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Print Document</title>
        <style>${styles}</style>
        ${printStyles}
      </head>
      <body>
        <div class="print-container">
          ${element.innerHTML}
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

  // Write content to print window and trigger print
  printWindow.document.write(printContent)
  printWindow.document.close()
}

export function printQuotation(quotationData: any) {
  // Create a formatted quotation document for printing
  const printContent = createQuotationPrintHTML(quotationData)
  
  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (!printWindow) {
    console.error('Failed to open print window')
    return
  }

  printWindow.document.write(printContent)
  printWindow.document.close()
}

function createQuotationPrintHTML(quotation: any): string {
  const currentDate = new Date().toLocaleDateString()
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Quotation ${quotation.quotationNumber}</title>
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
            <h1>${quotation.company?.name || 'Your Company Name'}</h1>
            <div>${quotation.company?.address || ''}</div>
            <div>${quotation.company?.phone || ''}</div>
            <div>${quotation.company?.email || ''}</div>
            ${quotation.company?.gstNumber ? `<div>GST: ${quotation.company.gstNumber}</div>` : ''}
          </div>
          <div class="quotation-details">
            <div class="quotation-number">Quotation #${quotation.quotationNumber}</div>
            <div>Date: ${new Date(quotation.createdAt).toLocaleDateString()}</div>
            ${quotation.validUntil ? `<div>Valid Until: ${new Date(quotation.validUntil).toLocaleDateString()}</div>` : ''}
            <div>Status: ${quotation.status}</div>
          </div>
        </div>
        
        <div class="customer-section">
          <div class="section-title">Bill To:</div>
          <div><strong>${quotation.customer.name}</strong></div>
          ${quotation.customer.address ? `<div>${quotation.customer.address}</div>` : ''}
          ${quotation.customer.phone ? `<div>Phone: ${quotation.customer.phone}</div>` : ''}
          ${quotation.customer.email ? `<div>Email: ${quotation.customer.email}</div>` : ''}
          ${quotation.customer.gstNumber ? `<div>GST: ${quotation.customer.gstNumber}</div>` : ''}
        </div>
        
        ${quotation.title ? `<div class="section-title">${quotation.title}</div>` : ''}
        ${quotation.description ? `<div style="margin-bottom: 20px;">${quotation.description}</div>` : ''}
        
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
            ${quotation.items.map((item: any) => `
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
            <span>₹${quotation.subtotal.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>GST (${quotation.gstRate}%):</span>
            <span>₹${quotation.gstAmount.toFixed(2)}</span>
          </div>
          <div class="total-row final">
            <span>Total Amount:</span>
            <span>₹${quotation.totalAmount.toFixed(2)}</span>
          </div>
        </div>
        
        ${quotation.notes ? `
          <div class="notes-section">
            <div class="section-title">Notes:</div>
            <div>${quotation.notes}</div>
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
}
