import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount)
}

export function calculateGST(amount: number, gstRate: number): number {
  return (amount * gstRate) / 100
}

export function calculateGSTBreakdown(amount: number, gstRate: number) {
  const gstAmount = calculateGST(amount, gstRate)
  const cgst = gstAmount / 2 // Central GST
  const sgst = gstAmount / 2 // State GST

  return {
    subtotal: amount,
    cgst: {
      rate: gstRate / 2,
      amount: cgst
    },
    sgst: {
      rate: gstRate / 2,
      amount: sgst
    },
    totalGst: gstAmount,
    totalAmount: amount + gstAmount
  }
}

export function calculateIGST(amount: number, gstRate: number) {
  // For inter-state transactions
  const igstAmount = calculateGST(amount, gstRate)

  return {
    subtotal: amount,
    igst: {
      rate: gstRate,
      amount: igstAmount
    },
    totalGst: igstAmount,
    totalAmount: amount + igstAmount
  }
}

export function generateQuotationNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  
  return `QUO-${year}${month}${day}-${random}`
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}
