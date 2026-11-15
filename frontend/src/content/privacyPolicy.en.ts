export interface PrivacyPolicySection {
  title: string;
  paragraphs: string[];
  listItems?: string[];
}

export const privacyPolicyUpdatedAt = "November 14, 2026";

export const privacyPolicySections: PrivacyPolicySection[] = [
  {
    title: "1. Principles",
    paragraphs: [
      "Tobias Keiner, Helmholtzstraße 2, 01069 Dresden, email: mail@ortsschildsprint.com, is responsible for the content of and data processing on this website.",
      "The operator of ortsschildsprint.com places great importance on protecting your privacy. The route-file workflow does not create an account or use tracking. The optional Strava integration creates a server-side connection and session so that it can analyse rides and display a personal sign collection.",
      "Necessary first-party cookies are used only when the Strava integration is connected: short-lived OAuth state cookies protect the connection flow, and a session cookie keeps the connected dashboard available. They are not used for advertising or cross-site tracking.",
    ],
  },
  {
    title: "2. Processed Data",
    paragraphs: [
      "For the route-file workflow, geographic coordinates are processed as a bounding box to query city-limit signs. Route files themselves remain in the browser and are not uploaded by this workflow. Bounding-box coordinates are not stored beyond the individual request.",
      "If you choose to connect Strava, the service stores your Strava athlete ID, display name, profile image URL, granted permissions, encrypted access and refresh tokens, your activity-summary preference, session identifiers, activity IDs and dates, and the city-limit signs collected from eligible rides. Tokens are encrypted before they are written to the database.",
      "To protect the public city-sign lookup, the API derives a pseudonymous rate-limit key from the Cloudflare client IP address and stores it with the request window and counter. These rows are removed after roughly 24 hours by scheduled cleanup.",
    ],
  },
  {
    title: "3. Hosting and Infrastructure",
    paragraphs: [
      "Website and API (Cloudflare): The user interface at ortsschildsprint.com and the API at api.ortsschildsprint.com are hosted via Cloudflare (Cloudflare Pages and Cloudflare Workers respectively). Cloudflare is a US-based company used here as a CDN provider. As part of hosting, Cloudflare may temporarily process technical connection data such as IP address, access time, requested URL, HTTP status code, referrer, browser type, operating system, and other connection metadata required for delivery and security. More information is available in Cloudflare's privacy policy: https://www.cloudflare.com/privacypolicy/",
      "Database (Supabase): The API uses a PostgreSQL database hosted by Supabase for city-sign data, rate limiting, and the optional Strava integration. This includes the connection, session, collection, and rate-limit data described above. As part of Supabase's technical operation, server-side connection and log data may also be processed. More information is available in Supabase's privacy policy: https://supabase.com/privacy",
    ],
  },
  {
    title: "4. Map Display (OpenFreeMap / MapLibre)",
    paragraphs: [
      "MapLibre GL JS is used to display maps. It is an open-source library that runs locally in the browser. OpenFreeMap is used as the map tile service (https://tiles.openfreemap.org). According to OpenFreeMap, IP addresses are not stored in regular server logs by default. No cookies or tracking technologies are used. Only anonymized technical logs such as browser type, operating system, and date/time may be collected. In the event of a security incident, OpenFreeMap may temporarily log IP addresses for up to 30 days. More information is available in OpenFreeMap's privacy policy: https://openfreemap.org",
    ],
  },
  {
    title: "5. Fonts and Media",
    paragraphs: [
      "Fonts and application images are served directly by ortsschildsprint.com. On a connected Strava dashboard, the browser may request the profile image URL supplied by Strava. No external font service such as Google Fonts is used.",
    ],
  },
  {
    title: "6. Optional Strava and External Links",
    paragraphs: [
      "When you connect Strava, Ortschildsprint redirects you to Strava for authorization and calls Strava's API to retrieve the rides needed for the feature. The map's Street View button opens Google Maps only after you choose it. No analytics, advertising networks, or social-media plugins are used.",
    ],
  },
  {
    title: "7. Your Rights",
    paragraphs: [
      "You generally have the following rights with respect to personal data processed by the optional Strava integration and rate limiting:",
      "If you have any questions or concerns, please contact: mail@ortsschildsprint.com",
    ],
    listItems: [
      "Right of access (Art. 15 GDPR)",
      "Right to rectification (Art. 16 GDPR)",
      "Right to erasure (Art. 17 GDPR)",
      "Right to restriction of processing (Art. 18 GDPR)",
      "Right to object (Art. 21 GDPR)",
      "Right to lodge a complaint with a supervisory authority (Art. 77 GDPR)",
    ],
  },
  {
    title: "8. Changes to This Privacy Policy",
    paragraphs: [
      `This privacy policy is dated ${privacyPolicyUpdatedAt}. It may be updated if necessary. The current version is always available on this page.`,
    ],
  },
];
