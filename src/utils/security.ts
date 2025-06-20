
/**
 * Security utilities for input validation and sanitization
 */

// HTML sanitization to prevent XSS attacks
export const sanitizeHtml = (input: string): string => {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

// Content validation for email composition
export const validateEmailContent = (subject: string, content: string) => {
  const errors: string[] = [];
  
  if (!subject?.trim()) {
    errors.push('Subject is required');
  } else if (subject.length > 200) {
    errors.push('Subject must be less than 200 characters');
  }
  
  if (!content?.trim()) {
    errors.push('Content is required');
  } else if (content.length > 10000) {
    errors.push('Content must be less than 10,000 characters');
  }
  
  // Check for potentially dangerous content
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i
  ];
  
  const combinedText = `${subject} ${content}`;
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(combinedText)) {
      errors.push('Content contains potentially unsafe elements');
      break;
    }
  }
  
  return errors;
};

// Rate limiting helper (client-side)
export class RateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  
  isRateLimited(key: string, maxAttempts: number = 5, windowMs: number = 300000): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);
    
    if (!record) {
      this.attempts.set(key, { count: 1, lastAttempt: now });
      return false;
    }
    
    // Reset if window has passed
    if (now - record.lastAttempt > windowMs) {
      this.attempts.set(key, { count: 1, lastAttempt: now });
      return false;
    }
    
    // Increment attempt count
    record.count++;
    record.lastAttempt = now;
    
    return record.count > maxAttempts;
  }
  
  resetAttempts(key: string): void {
    this.attempts.delete(key);
  }
}

export const authRateLimiter = new RateLimiter();
