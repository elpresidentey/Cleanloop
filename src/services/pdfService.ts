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

    // Set up colors
    const primaryColor: [number, number, number] = [34, 197, 94] // Green-500
    const secondaryColor: [number, number, number] = [75, 85, 99] // Gray-600
    const lightGray: [number, number, number] = [243, 244, 246] // Gray-100

    // Page dimensions
    const pageWidth = doc.internal.pageSize.width
    const margin = 20
    let yPosition = 20

    // Header with company logo area
    doc.setFillColor(...primaryColor)
    doc.rect(0, 0, pageWidth, 40, 'F')

    // Company name
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text(String(companyInfo.name), margin, 25)

    // Receipt title
    doc.setFontSize(16)
    doc.setFont('helvetica', 'normal')
    doc.text('PAYMENT RECEIPT', pageWidth - margin, 25, { align: 'right' })

    yPosition = 60

    // Receipt information box
    doc.setFillColor(...lightGray)
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 30, 'F')
    
    doc.setTextColor(...secondaryColor)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Receipt Details', margin + 10, yPosition + 10)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    const receiptDate = new Intl.DateTimeFormat('en-NG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(payment.createdAt)

    doc.text(`Receipt ID: ${String(payment.id)}`, margin + 10, yPosition + 20)
    doc.text(`Date: ${String(receiptDate)}`, margin + 10, yPosition + 25)

    yPosition += 50

    // Customer Information
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Customer Information', margin, yPosition)
    
    yPosition += 10
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...secondaryColor)
    
    doc.text(`Name: ${String(userInfo.name)}`, margin, yPosition)
    yPosition += 8
    doc.text(`Email: ${String(userInfo.email)}`, margin, yPosition)
    
    if (userInfo.phone) {
      yPosition += 8
      doc.text(`Phone: ${String(userInfo.phone)}`, margin, yPosition)
    }
    
    if (userInfo.address) {
      yPosition += 8
      doc.text(`Address: ${String(userInfo.address)}`, margin, yPosition)
    }

    yPosition += 20

    // Payment Details Section
    doc.setFillColor(...primaryColor)
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Payment Details', margin + 5, yPosition + 6)

    yPosition += 20

    // Payment details table
    const tableData = [
      ['Description', 'CleanLoop Waste Collection Service'],
      ['Amount', `₦${payment.amount.toLocaleString()}`],
      ['Payment Method', String(payment.paymentMethod).toUpperCase().replace('_', ' ')],
      ['Reference', String(payment.reference)],
      ['Status', String(payment.status).toUpperCase()],
      ['Currency', String(payment.currency)]
    ]

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(11)

    tableData.forEach(([label, value], index) => {
      const rowY = yPosition + (index * 12)
      
      // Alternate row background
      if (index % 2 === 0) {
        doc.setFillColor(...lightGray)
        doc.rect(margin, rowY - 3, pageWidth - 2 * margin, 10, 'F')
      }
      
      doc.setFont('helvetica', 'bold')
      doc.text(String(label) + ':', margin + 5, rowY + 3)
      
      doc.setFont('helvetica', 'normal')
      doc.text(String(value), margin + 80, rowY + 3)
    })

    yPosition += tableData.length * 12 + 20

    // Total amount highlight
    doc.setFillColor(...primaryColor)
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 20, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL PAID:', margin + 10, yPosition + 10)
    doc.text(`₦${payment.amount.toLocaleString()}`, pageWidth - margin - 10, yPosition + 10, { align: 'right' })

    yPosition += 40

    // Additional notes if available
    if (payment.metadata?.notes) {
      doc.setTextColor(...secondaryColor)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Notes:', margin, yPosition)
      
      yPosition += 8
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      
      // Handle long notes with text wrapping
      const notes = typeof payment.metadata.notes === 'string' ? payment.metadata.notes : String(payment.metadata.notes)
      const splitNotes = doc.splitTextToSize(notes, pageWidth - 2 * margin)
      doc.text(splitNotes, margin, yPosition)
      yPosition += splitNotes.length * 5 + 10
    }

    // Footer
    const footerY = doc.internal.pageSize.height - 40
    
    // Company contact information
    doc.setFillColor(...lightGray)
    doc.rect(0, footerY - 10, pageWidth, 50, 'F')
    
    doc.setTextColor(...secondaryColor)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Contact Information', margin, footerY)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`${String(companyInfo.address)} | ${String(companyInfo.phone)}`, margin, footerY + 8)
    doc.text(String(companyInfo.email), margin, footerY + 15)
    
    if (companyInfo.website) {
      doc.text(String(companyInfo.website), margin, footerY + 22)
    }

    // Thank you message
    doc.setTextColor(...primaryColor)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Thank you for choosing CleanLoop!', pageWidth / 2, footerY + 15, { align: 'center' })

    // Watermark/Security text
    doc.setTextColor(200, 200, 200)
    doc.setFontSize(8)
    doc.text('This is a computer-generated receipt', pageWidth - margin, footerY + 25, { align: 'right' })

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