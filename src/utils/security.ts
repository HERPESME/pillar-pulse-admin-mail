/**
 * Enhanced security utilities for input validation and sanitization
 */

// Enhanced HTML sanitization to prevent XSS attacks
export const sanitizeHtml = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, ''')
    )
    .replace(/\//g, '/')
    .replace(/`/g, '`')
    .replace(/=/g, '&#x3D;')
    // Remove potentially dangerous protocols
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    // Remove script tags and event handlers
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^>\s]+/gi, '');
};

// Enhanced email validation with additional security checks
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string' || email.length > 254) {
    return false;
  }
  
  // Check for dangerous characters
  const dangerousChars = /[<>'"&\\]/;
  if (dangerousChars.test(email)) {
    return false;
  }
  
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

// Enhanced content validation for email composition
export const validateEmailContent = (subject: string, content: string): string[] => {
  const errors: string[] = [];
  
  // Subject validation
  if (!subject?.trim()) {
    errors.push('Subject is required');
  } else if (typeof subject !== 'string') {
    errors.push('Subject must be text');
  } else if (subject.length > 200) {
    errors.push('Subject must be less than 200 characters');
  }
  
  // Content validation
  if (!content?.trim()) {
    errors.push('Content is required');
  } else if (typeof content !== 'string') {
    errors.push('Content must be text');
  } else if (content.length > 10000) {
    errors.push('Content must be less than 10,000 characters');
  }
  
  // Enhanced security checks for potentially dangerous content
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<form/i,
    /data:/i,
    /vbscript:/i,
    /<link/i,
    /<meta/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
    /<svg/i,
    /<math/i,
    /xmlns/i,
    /xlink/i
  ];
  
  const combinedText = `${subject} ${content}`;
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(combinedText)) {
      errors.push('Content contains potentially unsafe elements');
      break;
    }
  }
  
  // Check for excessive special characters (potential obfuscation)
  // Fixed regex: escape the hyphen or move to start/end of character class
  const specialCharCount = (combinedText.match(/[^\w\s.,!?;:()\-]/g) || []).length;
  if (specialCharCount > combinedText.length * 0.1) {
    errors.push('Content contains too many special characters');
  }
  
  return errors;
};

// Enhanced rate limiting with memory cleanup
export class RateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    // Clean up old entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }
  
  private cleanup(): void {
    const now = Date.now();
    const fiveMinutesAgo = now - 300000;
    
    for (const [key, record] of this.attempts.entries()) {
      if (record.lastAttempt < fiveMinutesAgo) {
        this.attempts.delete(key);
      }
    }
  }
  
  isRateLimited(key: string, maxAttempts: number = 5, windowMs: number = 300000): boolean {
    if (!key || typeof key !== 'string') {
      return true; // Block invalid keys
    }
    
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
    if (key && typeof key === 'string') {
      this.attempts.delete(key);
    }
  }
  
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.attempts.clear();
  }
}

export const authRateLimiter = new RateLimiter();

// Input sanitization for database queries
export const sanitizeDbInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/['"\\]/g, '') // Remove quotes and backslashes
    .replace(/[;--]/g, '') // Remove SQL comment markers
    .replace(/\0/g, '') // Remove null bytes
    .trim()
    .substring(0, 1000); // Limit length
};

// Validate pillar names
export const validatePillarName = (pillar: string): boolean => {
  if (!pillar || typeof pillar !== 'string') return false;
  
  // Only allow alphanumeric characters, spaces, hyphens, and underscores
  const validPattern = /^[a-zA-Z0-9\s\-_]+$/;
  return validPattern.test(pillar) && pillar.length <= 100;
};

// Secure password validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common weak passwords
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common');
  }
  
  return { isValid: errors.length === 0, errors };
};

// Content Security Policy helper
export const getCSPHeader = (): string => {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://rkigicorocqvlwupabps.supabase.co wss://rkigicorocqvlwupabps.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
};