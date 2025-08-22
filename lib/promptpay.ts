// Utility functions for PromptPay QR code generation
import generatePayload from "promptpay-qr";

/**
 * Format amount for PromptPay
 * @param amount - The amount to format
 * @returns Formatted amount string
 */
export function formatAmount(amount: number): string {
  // Convert to string with 2 decimal places
  return amount.toFixed(2);
}

/**
 * Generate PromptPay QR code data string
 * @param promptpayId - The PromptPay ID (phone number or ID)
 * @param amount - The amount to charge
 * @returns QR code data string
 */
export function generatePromptPayQRString(
  promptpayId: string,
  amount: number
): string {
  // Generate QR code payload using promptpay-qr library
  return generatePayload(promptpayId, { amount });
}

/**
 * Generate QR code URL using a QR code service
 * @param data - The data to encode in the QR code
 * @returns URL to the QR code image
 */
export function generateQRCodeImage(data: string): string {
  // Using a free QR code service (in production, you might want to host your own)
  const encodedData = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encodedData}&size=200x200`;
}
