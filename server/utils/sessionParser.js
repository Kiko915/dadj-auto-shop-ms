/**
 * Parse user agent string to extract device and browser information
 * @param {string} userAgent - The user agent string from request headers
 * @returns {Object} Parsed device and browser information
 */
export function parseUserAgent(userAgent) {
  if (!userAgent) {
    return {
      device: 'Unknown Device',
      browser: 'Unknown Browser'
    }
  }

  // Detect device/OS
  let device = 'Unknown Device'
  if (/Windows NT 10/i.test(userAgent)) device = 'Windows 10'
  else if (/Windows NT 11/i.test(userAgent)) device = 'Windows 11'
  else if (/Windows/i.test(userAgent)) device = 'Windows'
  else if (/Mac OS X/i.test(userAgent)) device = 'macOS'
  else if (/Linux/i.test(userAgent)) device = 'Linux'
  else if (/Android/i.test(userAgent)) device = 'Android'
  else if (/iPhone/i.test(userAgent)) device = 'iPhone'
  else if (/iPad/i.test(userAgent)) device = 'iPad'

  // Detect browser
  let browser = 'Unknown Browser'
  if (/Edg\//i.test(userAgent)) browser = 'Edge'
  else if (/Chrome/i.test(userAgent)) browser = 'Chrome'
  else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = 'Safari'
  else if (/Firefox/i.test(userAgent)) browser = 'Firefox'
  else if (/Opera|OPR/i.test(userAgent)) browser = 'Opera'

  return { device, browser }
}

/**
 * Get IP address from request, considering proxies
 * @param {Object} req - Express request object
 * @returns {string} IP address
 */
export function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         'Unknown'
}
