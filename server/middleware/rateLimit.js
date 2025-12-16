import crypto from 'crypto';

const rateLimitMap = new Map();
let cleanupTimer = null;

// Ensure cleanup on shutdown
const cleanup = () => {
    if (cleanupTimer) {
        clearInterval(cleanupTimer);
        cleanupTimer = null;
    }
};
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

/**
 * Basic in-memory rate limiter middleware.
 * @param {Object} options - { windowMs: number, max: number, message: string }
 */
export const rateLimiter = (options = {}) => {
    const windowMs = options.windowMs || 60 * 1000; // Default 1 minute
    const max = options.max || 10; // Default 10 requests
    const message = options.message || 'Too many requests, please try again later.';

    // Initialize cleanup interval once (singleton pattern)
    if (!cleanupTimer) {
        cleanupTimer = setInterval(() => {
            const now = Date.now();
            for (const [key, value] of rateLimitMap.entries()) {
                if (now - value.startTime > windowMs) {
                    rateLimitMap.delete(key);
                }
            }
        }, 10 * 60 * 1000);
        // Unref to not hold process open if needed, but standard interval is fine.
    }

    return (req, res, next) => {
        // Robust IP Extraction
        let ip = '';
        const forwarded = req.headers['x-forwarded-for'];

        if (forwarded) {
            ip = forwarded.split(',')[0].trim();
        } else {
            ip = req.ip || req.socket?.remoteAddress || '';
        }

        // Final Fallback to unique ID to prevent shared bucket
        if (!ip) {
            ip = req.headers['x-request-id'] || crypto.randomUUID();
        }

        const key = ip; // Normalized IP-based key

        const now = Date.now();
        const record = rateLimitMap.get(key);

        // Define reset time helper
        const getResetTimeSent = (startTime) => Math.ceil((startTime + windowMs) / 1000);

        if (!record) {
            // New record
            rateLimitMap.set(key, { count: 1, startTime: now });

            res.set('X-RateLimit-Limit', max);
            res.set('X-RateLimit-Remaining', max - 1);
            res.set('X-RateLimit-Reset', getResetTimeSent(now));

            return next();
        }

        if (now - record.startTime > windowMs) {
            // Window expired, reset
            record.count = 1;
            record.startTime = now;

            res.set('X-RateLimit-Limit', max);
            res.set('X-RateLimit-Remaining', max - 1);
            res.set('X-RateLimit-Reset', getResetTimeSent(now));

            return next();
        }

        // Within window
        if (record.count >= max) {
            const retryAfterSec = Math.ceil((record.startTime + windowMs - now) / 1000);

            res.set('X-RateLimit-Limit', max);
            res.set('X-RateLimit-Remaining', 0);
            res.set('X-RateLimit-Reset', getResetTimeSent(record.startTime));
            res.set('Retry-After', retryAfterSec);

            return res.status(429).json({ error: message });
        }

        // Increment
        record.count += 1;

        res.set('X-RateLimit-Limit', max);
        res.set('X-RateLimit-Remaining', max - record.count);
        res.set('X-RateLimit-Reset', getResetTimeSent(record.startTime));

        next();
    };
};
