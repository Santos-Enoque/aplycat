// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

// Sentry client instrumentation disabled for deployment
// import * as Sentry from "@sentry/nextjs";

// Sentry.init({
//   dsn: "https://f80f2ee4ca859374f9c45856212d59e1@o4509446714032128.ingest.us.sentry.io/4509446716325888",

//   // Add optional integrations for additional features
//   integrations: [
//     Sentry.replayIntegration(),
//   ],

//   // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
//   tracesSampleRate: 1,

//   // Define how likely Replay events are sampled.
//   // This sets the sample rate to be 10%. You may want this to be 100% while
//   // in development and sample at a lower rate in production
//   replaysSessionSampleRate: 0.1,

//   // Define how likely Replay events are sampled when an error occurs.
//   replaysOnErrorSampleRate: 1.0,

//   // Setting this option to true will print useful information to the console while you're setting up Sentry.
//   debug: false,
// });

// export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;