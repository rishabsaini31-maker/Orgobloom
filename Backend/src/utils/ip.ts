/**
 * Centralized client IP extraction utility
 * Handles proxied requests (X-Forwarded-For) and direct connections
 * Used by rate limiting, authentication, and logging
 */
export function getClientIP(req: any): string {
  // Check X-Forwarded-For first (for proxy scenarios like Render, CloudFlare)
  const forwardedFor = req.get("x-forwarded-for");
  if (forwardedFor) {
    // X-Forwarded-For can have multiple IPs, take the first one (client IP)
    const ips = forwardedFor.split(",").map((ip: string) => ip.trim());
    const clientIP = ips[0];
    if (clientIP && clientIP !== "unknown") {
      return clientIP;
    }
  }

  // Fallback to req.ip (works in most Express setups)
  if (req.ip && req.ip !== "unknown") {
    return req.ip;
  }

  // Fallback to socket remote address
  if (req.socket?.remoteAddress && req.socket.remoteAddress !== "unknown") {
    return req.socket.remoteAddress;
  }

  // Last resort
  return "unknown";
}

/**
 * Validate IP address format
 */
export function isValidIP(ip: string): boolean {
  if (ip === "unknown") return false;

  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Pattern.test(ip)) {
    const parts = ip.split(".").map(Number);
    return parts.every((part) => part >= 0 && part <= 255);
  }

  // IPv6 pattern (simplified)
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  return ipv6Pattern.test(ip);
}

/**
 * Get IP geo location info (stub for future enhancement)
 * Can be enhanced with GeoIP databases later
 */
export function getIPInfo(ip: string): { ip: string; country?: string; city?: string } {
  return {
    ip,
    // TODO: Integrate with MaxMind or similar service
    // country: geoip.country(ip),
    // city: geoip.city(ip),
  };
}
