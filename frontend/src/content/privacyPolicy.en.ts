export interface PrivacyPolicySection {
  title: string;
  paragraphs: string[];
  listItems?: string[];
}

export const privacyPolicyUpdatedAt = "May 1, 2026";

export const privacyPolicySections: PrivacyPolicySection[] = [
  {
    title: "1. Principles",
    paragraphs: [
      "Tobias Keiner, Helmholtzstraße 2, 01069 Dresden, email: mail@ortsschildsprint.com, is responsible for the content of and data processing on this website.",
      "The operator of ortsschildsprint.com places great importance on protecting your privacy. This website does not collect personal data, does not use cookies, and does not use tracking. No user accounts are created and no personal information is stored.",
    ],
  },
  {
    title: "2. Processed Data",
    paragraphs: [
      "The only data processed when using this website are geographic coordinates in the form of a bounding box. These coordinates are created when you select a route locally on your device. They are used exclusively to query position and point data (points of interest) through the API at api.ortsschildsprint.com in order to enrich the selected route with relevant location information.",
      "These coordinates do not constitute personal data within the meaning of the GDPR because they cannot be assigned to a natural person. These coordinates are not stored beyond the individual request.",
    ],
  },
  {
    title: "3. Hosting and Infrastructure",
    paragraphs: [
      "Website and API (Cloudflare): The user interface at ortsschildsprint.com and the API at api.ortsschildsprint.com are hosted via Cloudflare (Cloudflare Pages and Cloudflare Workers respectively). Cloudflare is a US-based company used here as a CDN provider. As part of hosting, Cloudflare may temporarily process technical connection data such as IP address, access time, requested URL, HTTP status code, referrer, browser type, operating system, and other connection metadata required for delivery and security. More information is available in Cloudflare's privacy policy: https://www.cloudflare.com/privacypolicy/",
      "Database (Supabase): The API performs read-only database queries (SELECT) against a PostgreSQL database hosted by Supabase. These queries contain the bounding box coordinates described above. No personal data is stored in the database. As part of Supabase's technical operation, server-side connection and log data of the API-to-database communication may be processed, in particular request timestamps, technical error and event logs, and the bounding box coordinates transmitted by the API. The IP address of website visitors is not directly transmitted to Supabase through the database query. More information is available in Supabase's privacy policy: https://supabase.com/privacy",
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
      "All fonts and images are served directly by ortsschildsprint.com. No external services such as Google Fonts or comparable third-party providers are used. As a result, loading the page does not establish connections to external font servers.",
    ],
  },
  {
    title: "6. No Additional Third Parties",
    paragraphs: [
      "No additional third-party services, analytics tools, advertising networks, or social media plugins are used.",
    ],
  },
  {
    title: "7. Your Rights",
    paragraphs: [
      "Although this website does not collect personal data, you generally have the following rights under the GDPR:",
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
