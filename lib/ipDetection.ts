// lib/ipDetection.ts

/**
 * Get client IP address
 * This is a client-side helper that attempts to detect the IP
 * For production, you should implement server-side IP detection
 */

export async function getClientIP(): Promise<string> {
  // Try to get IP from a public API
  try {
    const response = await fetch('https://api.ipify.org?format=json', {
      method: 'GET',
      // Add timeout
      signal: AbortSignal.timeout(3000),
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.ip || 'Unknown';
    }
  } catch (error) {
    console.warn('Failed to fetch IP from ipify:', error);
  }

  // Fallback: try another service
  try {
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.ip || 'Unknown';
    }
  } catch (error) {
    console.warn('Failed to fetch IP from ipapi:', error);
  }

  // Final fallback
  return 'Unknown';
}

/**
 * Get user agent string
 */
export function getUserAgent(): string {
  if (typeof window !== 'undefined' && window.navigator) {
    return window.navigator.userAgent;
  }
  return 'Unknown';
}

/**
 * Parse user agent for device and browser info (client-side)
 */
export function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();
  
  const deviceInfo = {
    type: 'Unknown',
    os: 'Unknown',
  };
  
  const browserInfo = {
    browser: 'Unknown',
    version: '',
  };

  // Detect OS
  if (ua.includes('windows')) {
    deviceInfo.os = 'Windows';
    deviceInfo.type = 'Windows PC';
  } else if (ua.includes('mac os')) {
    deviceInfo.os = 'macOS';
    deviceInfo.type = ua.includes('iphone') || ua.includes('ipad') ? 'iOS Device' : 'Mac';
  } else if (ua.includes('android')) {
    deviceInfo.os = 'Android';
    deviceInfo.type = 'Android Device';
  } else if (ua.includes('linux')) {
    deviceInfo.os = 'Linux';
    deviceInfo.type = 'Linux PC';
  } else if (ua.includes('iphone')) {
    deviceInfo.os = 'iOS';
    deviceInfo.type = 'iPhone';
  } else if (ua.includes('ipad')) {
    deviceInfo.os = 'iOS';
    deviceInfo.type = 'iPad';
  }

  // Detect Browser
  if (ua.includes('chrome') && !ua.includes('edge') && !ua.includes('edg')) {
    browserInfo.browser = 'Chrome';
    const match = ua.match(/chrome\/(\d+)/);
    if (match) browserInfo.version = match[1];
  } else if (ua.includes('firefox')) {
    browserInfo.browser = 'Firefox';
    const match = ua.match(/firefox\/(\d+)/);
    if (match) browserInfo.version = match[1];
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browserInfo.browser = 'Safari';
    const match = ua.match(/version\/(\d+)/);
    if (match) browserInfo.version = match[1];
  } else if (ua.includes('edg')) {
    browserInfo.browser = 'Edge';
    const match = ua.match(/edg\/(\d+)/);
    if (match) browserInfo.version = match[1];
  } else if (ua.includes('opera') || ua.includes('opr')) {
    browserInfo.browser = 'Opera';
    const match = ua.match(/(?:opera|opr)\/(\d+)/);
    if (match) browserInfo.version = match[1];
  }

  return { deviceInfo, browserInfo };
}

/**
 * Format device and browser info for display
 */
export function formatDeviceBrowser(userAgent: string): { device: string; browser: string } {
  const { deviceInfo, browserInfo } = parseUserAgent(userAgent);
  
  const device = deviceInfo.type;
  const browser = browserInfo.version 
    ? `${browserInfo.browser} ${browserInfo.version}`
    : browserInfo.browser;
  
  return { device, browser };
}