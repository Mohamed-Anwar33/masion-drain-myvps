// Simple in-memory rate limiter middleware
// NOTE: For production, prefer a distributed store (e.g., Redis)

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_SEARCH_REQUESTS = 60; // allow 60 search requests per minute per IP

const buckets = new Map();

function cleanupOldEntries(now) {
  for (const [key, entry] of buckets.entries()) {
    if (now - entry.windowStart >= WINDOW_MS) {
      buckets.delete(key);
    }
  }
}

function createLimiter(maxPerWindow) {
  return function limiter(req, res, next) {
    try {
      const now = Date.now();
      const ip = req.ip || req.connection?.remoteAddress || 'unknown';
      const key = `${ip}:search`;

      const bucket = buckets.get(key);
      if (!bucket) {
        buckets.set(key, { count: 1, windowStart: now });
        cleanupOldEntries(now);
        return next();
      }

      if (now - bucket.windowStart >= WINDOW_MS) {
        // reset window
        bucket.count = 1;
        bucket.windowStart = now;
        cleanupOldEntries(now);
        return next();
      }

      if (bucket.count >= maxPerWindow) {
        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.'
          }
        });
        return;
      }

      bucket.count += 1;
      return next();
    } catch (err) {
      // On limiter error, fail open
      return next();
    }
  };
}

const rateLimiter = {
  // Specific limiter for search endpoints
  search: createLimiter(MAX_SEARCH_REQUESTS),
};

module.exports = { rateLimiter };


