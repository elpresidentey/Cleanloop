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

  // Helper function to draw modern card (simplified rounded rectangle effect)
  private static drawModernCard(
    doc: jsPDF,
    x: number,
    y: number,
    width: number,
    height: number,
    fillColor: [number, number, number],
    borderColor: [number, number, number] | null = null
  ): void {
    // Fill
    doc.setFillColor(...fillColor)
    doc.rect(x, y, width, height, 'F')
    
    // Border if specified
    if (borderColor) {
      doc.setDrawColor(...borderColor)
      doc.setLineWidth(0.5)
      doc.rect(x, y, width, height, 'S')
    }
  }

  static generateReceiptPDF(data: ReceiptData): jsPDF {
    const doc = new jsPDF()
    const { payment, userInfo } = data
    const companyInfo = data.companyInfo || this.COMPANY_INFO

    // Premium color palette
    const primaryColor: [number, number, number] = [16, 185, 129] // Emerald-500
    const primaryDark: [number, number, number] = [5, 150, 105] // Emerald-600
    const primaryLight: [number, number, number] = [209, 250, 229] // Emerald-100
    const secondaryColor: [number, number, number] = [71, 85, 105] // Slate-600
    const lightGray: [number, number, number] = [248, 250, 252] // Slate-50
    const borderGray: [number, number, number] = [226, 232, 240] // Slate-200
    const accentBlue: [number, number, number] = [59, 130, 246] // Blue-500
    const textDark: [number, number, number] = [15, 23, 42] // Slate-900

    // Page dimensions
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 20
    let yPosition = 15

    // Premium Header with elegant design
    doc.setFillColor(...primaryDark)
    doc.rect(0, 0, pageWidth, 60, 'F')
    
    // Accent stripe
    doc.setFillColor(...primaryColor)
    doc.rect(0, 0, pageWidth, 4, 'F')

    // Company name - larger and more prominent
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(32)
    doc.setFont('helvetica', 'bold')
    doc.text(String(companyInfo.name), margin, 35)
    
    // Elegant tagline
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(209, 250, 229) // Emerald-100
    doc.text('Sustainable Waste Management Solutions', margin, 43)
    
    // Premium receipt badge with better styling
    const badgeWidth = 65
    const badgeHeight = 25
    const badgeX = pageWidth - margin - badgeWidth
    const badgeY = 20
    
    doc.setFillColor(255, 255, 255)
    doc.rect(badgeX, badgeY, badgeWidth, badgeHeight, 'F')
    doc.setDrawColor(...primaryColor)
    doc.setLineWidth(1.5)
    doc.rect(badgeX, badgeY, badgeWidth, badgeHeight, 'S')
    
    doc.setTextColor(...primaryDark)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('RECEIPT', badgeX + badgeWidth / 2, badgeY + 16, { align: 'center' })

    yPosition = 80

    // Premium Receipt Info Card with better spacing
    this.drawModernCard(doc, margin, yPosition, pageWidth - 2 * margin, 40, lightGray, borderGray)
    
    // Elegant section header
    doc.setFillColor(...primaryDark)
    doc.rect(margin + 1, yPosition + 1, pageWidth - 2 * margin - 2, 10, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('RECEIPT INFORMATION', margin + 10, yPosition + 8)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...textDark)
    
    const receiptDate = new Intl.DateTimeFormat('en-NG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(payment.createdAt)

    const receiptId = String(payment.id).substring(0, 8).toUpperCase()
    
    // Better formatted info
    doc.setFont('helvetica', 'bold')
    doc.text('Receipt ID:', margin + 10, yPosition + 22)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...secondaryColor)
    doc.text(receiptId, margin + 50, yPosition + 22)
    
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...textDark)
    doc.text('Date:', margin + 10, yPosition + 32)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...secondaryColor)
    doc.text(String(receiptDate), margin + 50, yPosition + 32)
    
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...textDark)
    doc.text('Reference:', pageWidth - margin - 10, yPosition + 22, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...secondaryColor)
    doc.text(String(payment.reference), pageWidth - margin - 10, yPosition + 22, { align: 'right' })
    
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...textDark)
    doc.text('Status:', pageWidth - margin - 10, yPosition + 32, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...primaryDark)
    doc.setFont('helvetica', 'bold')
    doc.text(String(payment.status).toUpperCase(), pageWidth - margin - 10, yPosition + 32, { align: 'right' })

    yPosition += 55

    // Premium Customer Information Card
    const cardWidth = (pageWidth - 2 * margin - 10) / 2
    this.drawModernCard(doc, margin, yPosition, cardWidth, 55, lightGray, borderGray)
    
    doc.setFillColor(...primaryDark)
    doc.rect(margin + 1, yPosition + 1, cardWidth - 2, 11, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('BILLED TO', margin + 10, yPosition + 9)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(...textDark)
    
    doc.setFont('helvetica', 'bold')
    doc.text(String(userInfo.name), margin + 10, yPosition + 22)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...secondaryColor)
    
    let customerY = yPosition + 30
    doc.text(String(userInfo.email), margin + 10, customerY)
    
    if (userInfo.phone) {
      customerY += 8
      doc.text(String(userInfo.phone), margin + 10, customerY)
    }
    
    if (userInfo.address) {
      customerY += 8
      const addressLines = doc.splitTextToSize(String(userInfo.address), cardWidth - 20)
      doc.text(addressLines, margin + 10, customerY)
    }

    // Premium Company Information Card
    const companyCardX = margin + cardWidth + 10
    this.drawModernCard(doc, companyCardX, yPosition, cardWidth, 55, lightGray, borderGray)
    
    doc.setFillColor(...accentBlue)
    doc.rect(companyCardX + 1, yPosition + 1, cardWidth - 2, 11, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('FROM', companyCardX + 10, yPosition + 9)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(...textDark)
    
    doc.setFont('helvetica', 'bold')
    doc.text(String(companyInfo.name), companyCardX + 10, yPosition + 22)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...secondaryColor)
    
    let companyY = yPosition + 30
    doc.text(String(companyInfo.address), companyCardX + 10, companyY)
    companyY += 8
    doc.text(String(companyInfo.phone), companyCardX + 10, companyY)
    companyY += 8
    doc.text(String(companyInfo.email), companyCardX + 10, companyY)

    yPosition += 70

    // Premium Payment Details Section
    doc.setFillColor(...primaryDark)
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 12, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('PAYMENT DETAILS', margin + 10, yPosition + 9)

    yPosition += 20

    // Premium table with elegant styling
    const tableData = [
      { label: 'Description', value: 'CleanLoop Waste Collection Service', highlight: false },
      { label: 'Payment Method', value: String(payment.paymentMethod).toUpperCase().replace('_', ' '), highlight: false },
      { label: 'Currency', value: String(payment.currency), highlight: false }
    ]

    doc.setFontSize(10)
    doc.setDrawColor(...borderGray)
    doc.setLineWidth(0.5)

    tableData.forEach((row, index) => {
      const rowY = yPosition + (index * 16)
      
      // Alternating row background
      if (index % 2 === 0) {
        doc.setFillColor(...lightGray)
        doc.rect(margin, rowY - 5, pageWidth - 2 * margin, 14, 'F')
      }
      
      // Elegant border line
      doc.setDrawColor(...borderGray)
      doc.line(margin, rowY + 5, pageWidth - margin, rowY + 5)
      
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...textDark)
      doc.text(row.label + ':', margin + 10, rowY + 3)
      
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...secondaryColor)
      doc.text(String(row.value), margin + 75, rowY + 3)
    })

    yPosition += tableData.length * 16 + 20

    // Premium Total Amount Box - more prominent
    doc.setFillColor(...primaryDark)
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 35, 'F')
    
    // Elegant double border
    doc.setDrawColor(...primaryColor)
    doc.setLineWidth(2.5)
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 35, 'S')
    
    // Inner highlight
    doc.setDrawColor(255, 255, 255)
    doc.setLineWidth(1)
    doc.rect(margin + 2, yPosition + 2, pageWidth - 2 * margin - 4, 31, 'S')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'normal')
    doc.text('TOTAL AMOUNT PAID', margin + 15, yPosition + 12)
    
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    doc.text(`₦${payment.amount.toLocaleString()}`, pageWidth - margin - 15, yPosition + 22, { align: 'right' })
    
    // Currency indicator with better styling
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(209, 250, 229) // Emerald-100
    doc.text(String(payment.currency), pageWidth - margin - 15, yPosition + 30, { align: 'right' })

    yPosition += 50

    // Premium Additional notes section
    if (payment.metadata?.notes) {
      const notes = typeof payment.metadata.notes === 'string' ? payment.metadata.notes : String(payment.metadata.notes)
      const splitNotes = doc.splitTextToSize(notes, pageWidth - 2 * margin - 20)
      const notesHeight = splitNotes.length * 6 + 25
      
      this.drawModernCard(doc, margin, yPosition, pageWidth - 2 * margin, notesHeight, lightGray, borderGray)
      
      doc.setFillColor(...accentBlue)
      doc.rect(margin + 1, yPosition + 1, pageWidth - 2 * margin - 2, 11, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('ADDITIONAL NOTES', margin + 10, yPosition + 9)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(...secondaryColor)
      doc.text(splitNotes, margin + 10, yPosition + 22)
      
      yPosition += notesHeight + 15
    }

    // Premium Footer with elegant design
    const footerY = pageHeight - 60
    
    // Decorative separator line
    doc.setDrawColor(...primaryColor)
    doc.setLineWidth(2)
    doc.line(margin, footerY - 8, pageWidth - margin, footerY - 8)
    
    // Thin accent line
    doc.setDrawColor(...borderGray)
    doc.setLineWidth(0.5)
    doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6)
    
    // Thank you message - more elegant
    doc.setTextColor(...primaryDark)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Thank you for choosing CleanLoop!', pageWidth / 2, footerY, { align: 'center' })
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...secondaryColor)
    doc.text('We appreciate your commitment to sustainable waste management', pageWidth / 2, footerY + 10, { align: 'center' })
    
    // Company contact information - better formatted
    doc.setFontSize(9)
    doc.setTextColor(...secondaryColor)
    const contactText = `${String(companyInfo.address)} • ${String(companyInfo.phone)} • ${String(companyInfo.email)}`
    doc.text(contactText, pageWidth / 2, footerY + 20, { align: 'center' })
    
    if (companyInfo.website) {
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...primaryDark)
      doc.text(String(companyInfo.website), pageWidth / 2, footerY + 28, { align: 'center' })
    }

    // Security/Watermark text - more subtle
    doc.setTextColor(180, 180, 180)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'italic')
    doc.text('This is a computer-generated receipt. No signature required.', pageWidth / 2, footerY + 36, { align: 'center' })
    
    // Receipt ID in footer - better positioned
    doc.setTextColor(...secondaryColor)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text(`Receipt ID: ${receiptId}`, margin, footerY + 36)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(`Generated: ${new Date().toLocaleString('en-NG')}`, pageWidth - margin, footerY + 36, { align: 'right' })

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