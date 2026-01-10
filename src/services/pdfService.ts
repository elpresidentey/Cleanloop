import jsPDF from 'jspdf'
import { Payment } from '../types'

export interface ReceiptData {
  payment: Payment
  userInfo: {
    name: string
    email: string
    phone?: string
    address?: string
  }
  companyInfo?: {
    name: string
    address: string
    phone: string
    email: string
    website?: string
  }
}

export class PDFService {
  private static readonly COMPANY_INFO = {
    name: 'CleanLoop Waste Management',
    address: 'Lagos, Nigeria',
    phone: '+234 800 CLEANLOOP',
    email: 'support@cleanloop.ng',
    website: 'www.cleanloop.ng'
  }

  static generateReceiptPDF(data: ReceiptData): jsPDF {
    const doc = new jsPDF()
    const { payment, userInfo } = data
    const companyInfo = data.companyInfo || this.COMPANY_INFO

    // Modern, professional color palette
    const primaryGreen: [number, number, number] = [16, 185, 129] // Emerald-500
    const darkGreen: [number, number, number] = [5, 150, 105] // Emerald-600
    const textDark: [number, number, number] = [17, 24, 39] // Gray-900
    const textGray: [number, number, number] = [75, 85, 99] // Gray-600
    const borderGray: [number, number, number] = [229, 231, 235] // Gray-200
    const bgLight: [number, number, number] = [249, 250, 251] // Gray-50

    // Page dimensions
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 25
    let yPosition = 20

    // Modern Header with gradient effect
    doc.setFillColor(...primaryGreen)
    doc.rect(0, 0, pageWidth, 50, 'F')

    // Subtle accent line
    doc.setFillColor(...darkGreen)
    doc.rect(0, 0, pageWidth, 3, 'F')

    // Company name - larger, more prominent
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    doc.text(companyInfo.name, margin, 28)

    // Tagline - elegant spacing
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(220, 252, 231) // Lighter green for tagline
    doc.text('Sustainable Waste Management Solutions', margin, 38)

    // Receipt badge - modern design with better positioning
    const badgeWidth = 60
    const badgeHeight = 18
    const badgeX = pageWidth - margin - badgeWidth
    const badgeY = 18
    
    // Badge background
    doc.setFillColor(255, 255, 255)
    doc.rect(badgeX, badgeY, badgeWidth, badgeHeight, 'F')
    
    // Badge border
    doc.setDrawColor(255, 255, 255)
    doc.setLineWidth(1)
    doc.rect(badgeX, badgeY, badgeWidth, badgeHeight, 'S')
    
    // Badge text
    doc.setTextColor(...primaryGreen)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('RECEIPT', badgeX + badgeWidth / 2, badgeY + 13, { align: 'center' })

    yPosition = 65

    // Receipt Information Section - Modern card design
    doc.setFillColor(...bgLight)
    doc.rect(margin - 5, yPosition - 5, pageWidth - 2 * margin + 10, 30, 'F')
    
    doc.setDrawColor(...borderGray)
    doc.setLineWidth(0.5)
    doc.rect(margin - 5, yPosition - 5, pageWidth - 2 * margin + 10, 30, 'S')

    const receiptId = String(payment.id).substring(0, 8).toUpperCase()
    const receiptDate = new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(payment.createdAt)

    // Left side - Receipt ID and Date
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...textGray)
    doc.text('Receipt ID', margin, yPosition)
    
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...textDark)
    doc.setFontSize(10)
    doc.text(receiptId, margin + 25, yPosition)
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...textGray)
    doc.text('Date', margin, yPosition + 8)
    
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...textDark)
    doc.text(receiptDate, margin + 25, yPosition + 8)

    // Right side - Reference and Status
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...textGray)
    doc.text('Reference', pageWidth - margin, yPosition, { align: 'right' })
    
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...textDark)
    doc.setFontSize(9)
    doc.text(payment.reference, pageWidth - margin, yPosition + 4, { align: 'right' })
    
    // Status badge - modern pill shape
    const statusWidth = 40
    const statusHeight = 10
    const statusX = pageWidth - margin - statusWidth
    const statusY = yPosition + 11
    
    doc.setFillColor(...primaryGreen)
    doc.rect(statusX, statusY, statusWidth, statusHeight, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text(payment.status.toUpperCase(), statusX + statusWidth / 2, statusY + 7, { align: 'center' })

    yPosition += 40

    // Customer and Company Information - Modern side-by-side cards
    const cardWidth = (pageWidth - 2 * margin - 20) / 2
    const cardHeight = 60

    // Billed To Card
    doc.setFillColor(255, 255, 255)
    doc.rect(margin, yPosition, cardWidth, cardHeight, 'F')
    
    doc.setDrawColor(...borderGray)
    doc.setLineWidth(1)
    doc.rect(margin, yPosition, cardWidth, cardHeight, 'S')
    
    // Card header with accent
    doc.setFillColor(...bgLight)
    doc.rect(margin, yPosition, cardWidth, 12, 'F')
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...textGray)
    doc.text('BILLED TO', margin + 10, yPosition + 9)
    
    // Customer name
    doc.setFontSize(12)
    doc.setTextColor(...textDark)
    doc.setFont('helvetica', 'bold')
    doc.text(userInfo.name, margin + 10, yPosition + 25)
    
    // Customer details
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...textGray)
    
    let detailY = yPosition + 33
    doc.text(userInfo.email, margin + 10, detailY)
    
    if (userInfo.phone) {
      detailY += 8
      doc.text(userInfo.phone, margin + 10, detailY)
    }
    
    if (userInfo.address) {
      detailY += 8
      const addressLines = doc.splitTextToSize(userInfo.address, cardWidth - 20)
      doc.text(addressLines, margin + 10, detailY)
    }

    // Company Card
    const companyCardX = margin + cardWidth + 20
    doc.setFillColor(255, 255, 255)
    doc.rect(companyCardX, yPosition, cardWidth, cardHeight, 'F')
    
    doc.setDrawColor(...borderGray)
    doc.setLineWidth(1)
    doc.rect(companyCardX, yPosition, cardWidth, cardHeight, 'S')
    
    // Card header with accent
    doc.setFillColor(...bgLight)
    doc.rect(companyCardX, yPosition, cardWidth, 12, 'F')
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...textGray)
    doc.text('FROM', companyCardX + 10, yPosition + 9)
    
    // Company name
    doc.setFontSize(12)
    doc.setTextColor(...textDark)
    doc.setFont('helvetica', 'bold')
    doc.text(companyInfo.name, companyCardX + 10, yPosition + 25)
    
    // Company details
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...textGray)
    
    detailY = yPosition + 33
    doc.text(companyInfo.address, companyCardX + 10, detailY)
    detailY += 8
    doc.text(companyInfo.phone, companyCardX + 10, detailY)
    detailY += 8
    doc.text(companyInfo.email, companyCardX + 10, detailY)

    yPosition += cardHeight + 25

    // Payment Details Section - Modern table design
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...textDark)
    doc.text('Payment Details', margin, yPosition)

    yPosition += 12

    // Modern table with better styling
    const tableData = [
      { label: 'Description', value: 'CleanLoop Waste Collection Service' },
      { label: 'Payment Method', value: String(payment.paymentMethod).toUpperCase().replace('_', ' ') },
      { label: 'Currency', value: String(payment.currency) }
    ]

    // Table container
    doc.setFillColor(255, 255, 255)
    doc.rect(margin, yPosition, pageWidth - 2 * margin, tableData.length * 16 + 4, 'F')
    
    doc.setDrawColor(...borderGray)
    doc.setLineWidth(1)
    doc.rect(margin, yPosition, pageWidth - 2 * margin, tableData.length * 16 + 4, 'S')

    doc.setFontSize(9)
    doc.setDrawColor(...borderGray)
    doc.setLineWidth(0.3)

    tableData.forEach((row, index) => {
      const rowY = yPosition + 2 + (index * 16)
      
      // Alternating row background
      if (index % 2 === 0) {
        doc.setFillColor(...bgLight)
        doc.rect(margin + 1, rowY - 6, pageWidth - 2 * margin - 2, 14, 'F')
      }
      
      // Label
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...textDark)
      doc.text(`${row.label}:`, margin + 8, rowY)
      
      // Value
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...textGray)
      doc.text(String(row.value), margin + 55, rowY)
      
      // Row divider
      if (index < tableData.length - 1) {
        doc.setDrawColor(...borderGray)
        doc.line(margin + 5, rowY + 3, pageWidth - margin - 5, rowY + 3)
      }
    })

    yPosition += tableData.length * 16 + 20

    // Total Amount - Modern prominent design
    doc.setFillColor(...primaryGreen)
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 30, 'F')
    
    // Subtle border
    doc.setDrawColor(...darkGreen)
    doc.setLineWidth(1)
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 30, 'S')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('TOTAL AMOUNT PAID', margin + 12, yPosition + 10)
    
    doc.setFontSize(26)
    doc.setFont('helvetica', 'bold')
    doc.text(`₦${payment.amount.toLocaleString()}`, pageWidth - margin - 12, yPosition + 22, { align: 'right' })

    yPosition += 45

    // Additional Notes Section (if any)
    if (payment.metadata?.notes) {
      const notes = typeof payment.metadata.notes === 'string' ? payment.metadata.notes : String(payment.metadata.notes)
      const splitNotes = doc.splitTextToSize(notes, pageWidth - 2 * margin - 20)
      const notesHeight = splitNotes.length * 6 + 25
      
      doc.setFillColor(255, 255, 255)
      doc.rect(margin, yPosition, pageWidth - 2 * margin, notesHeight, 'F')
      
      doc.setDrawColor(...borderGray)
      doc.setLineWidth(1)
      doc.rect(margin, yPosition, pageWidth - 2 * margin, notesHeight, 'S')
      
      // Notes header
      doc.setFillColor(...bgLight)
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 12, 'F')
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...textGray)
      doc.text('ADDITIONAL NOTES', margin + 10, yPosition + 9)
      
      // Notes content
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...textDark)
      doc.text(splitNotes, margin + 10, yPosition + 22)
      
      yPosition += notesHeight + 15
    }

    // Modern Footer Design
    const footerY = pageHeight - 65
    
    // Decorative top border
    doc.setDrawColor(...borderGray)
    doc.setLineWidth(1)
    doc.line(margin, footerY - 20, pageWidth - margin, footerY - 20)

    // Thank you message - prominent
    doc.setTextColor(...textDark)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Thank you for choosing CleanLoop!', pageWidth / 2, footerY - 10, { align: 'center' })
    
    // Subtitle
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...textGray)
    doc.text('We appreciate your commitment to sustainable waste management', pageWidth / 2, footerY, { align: 'center' })
    
    // Company contact information - well formatted
    doc.setFontSize(8)
    doc.setTextColor(...textGray)
    const contactInfo = `${companyInfo.address}  •  ${companyInfo.phone}  •  ${companyInfo.email}`
    doc.text(contactInfo, pageWidth / 2, footerY + 8, { align: 'center' })
    
    // Website
    if (companyInfo.website) {
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...primaryGreen)
      doc.setFontSize(9)
      doc.text(companyInfo.website, pageWidth / 2, footerY + 16, { align: 'center' })
    }
    
    // Receipt metadata at bottom
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...textGray)
    doc.text(`Receipt ID: ${receiptId}`, margin, footerY + 26)
    doc.text(`Generated: ${new Date().toLocaleString('en-NG')}`, pageWidth - margin, footerY + 26, { align: 'right' })

    return doc
  }

  static downloadReceiptPDF(data: ReceiptData): void {
    const doc = this.generateReceiptPDF(data)
    const filename = `CleanLoop_Receipt_${data.payment.reference}_${data.payment.createdAt.toISOString().split('T')[0]}.pdf`
    doc.save(filename)
  }

  static getReceiptPDFBlob(data: ReceiptData): Blob {
    const doc = this.generateReceiptPDF(data)
    return doc.output('blob')
  }

  static getReceiptPDFDataURL(data: ReceiptData): string {
    const doc = this.generateReceiptPDF(data)
    return doc.output('dataurlstring')
  }

  // Method to generate receipt for email attachment
  static getReceiptPDFBuffer(data: ReceiptData): ArrayBuffer {
    const doc = this.generateReceiptPDF(data)
    return doc.output('arraybuffer')
  }

  // Method to directly print the PDF receipt
  static printReceiptPDF(data: ReceiptData): void {
    const doc = this.generateReceiptPDF(data)
    
    // Create a blob URL and open in new window for printing
    const blob = new Blob([doc.output('blob')], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    
    const printWindow = window.open(url, '_blank')
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print()
        // Clean up after printing
        setTimeout(() => {
          printWindow.close()
          URL.revokeObjectURL(url)
        }, 1000)
      }
    }
  }
}
