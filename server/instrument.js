// server/instrument.js
import 'dotenv/config';
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

if (process.env.NEW_RELIC_LICENSE_KEY) {
    await import('newrelic');
} else {
    console.log('New Relic disabled: missing NEW_RELIC_LICENSE_KEY');
}

// Ensure Sentry is initialized before anything else
Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
        nodeProfilingIntegration(),
    ],
    // Tracing
    tracesSampleRate: 1.0, //  Capture 100% of the transactions

    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 1.0,
    sendDefaultPii: true,
});
