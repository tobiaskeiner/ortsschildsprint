export interface PrivacyPolicySection {
  title: string;
  paragraphs: string[];
  listItems?: string[];
}

export const privacyPolicyUpdatedAt = "1. Mai 2026";

export const privacyPolicySections: PrivacyPolicySection[] = [
  {
    title: "1. Grundsätze",
    paragraphs: [
      "Verantwortlich für den Inhalt und die Datenverarbeitung auf dieser Website ist Tobias Keiner, Helmholtzstraße 2, 01069 Dresden, E-Mail: mail@ortsschildsprint.com.",
      "Der Betreiber von ortsschildsprint.com legt großen Wert auf den Schutz deiner Privatsphäre. Diese Website erhebt keine personenbezogenen Daten, verwendet keine Cookies und setzt kein Tracking ein. Es werden keine Nutzerkonten erstellt und keine personenbezogenen Informationen gespeichert.",
    ],
  },
  {
    title: "2. Verarbeitete Daten",
    paragraphs: [
      "Die einzigen Daten, die im Rahmen der Nutzung dieser Website verarbeitet werden, sind geografische Koordinaten in Form einer sogenannten Bounding Box. Diese Koordinaten entstehen, wenn du lokal auf deinem Gerät eine Route auswählst. Sie werden ausschließlich dazu verwendet, über die API unter api.ortsschildsprint.com Positions- und Punktdaten (Points of Interest) abzufragen, um die ausgewählte Route mit relevanten Ortsinformationen anzureichern.",
      "Diese Koordinaten stellen keine personenbezogenen Daten im Sinne der DSGVO dar, da sie keiner natürlichen Person zugeordnet werden können. Es erfolgt keine Speicherung dieser Koordinaten über den einzelnen Abruf hinaus.",
    ],
  },
  {
    title: "3. Hosting und Infrastruktur",
    paragraphs: [
      "Website und API (Cloudflare): Die Benutzeroberfläche unter ortsschildsprint.com sowie die API unter api.ortsschildsprint.com werden über Cloudflare gehostet (Cloudflare Pages bzw. Cloudflare Workers). Cloudflare ist ein US-amerikanisches Unternehmen, das als CDN-Anbieter eingesetzt wird. Im Rahmen des Hostings können durch Cloudflare technische Verbindungsdaten wie insbesondere IP-Adresse, Zeitpunkt des Zugriffs, angeforderte URL, HTTP-Statuscode, Referrer, Browsertyp, Betriebssystem und weitere für die Auslieferung und Absicherung notwendige Verbindungsmetadaten vorübergehend verarbeitet werden. Weitere Informationen findest du in der Datenschutzerklärung von Cloudflare: https://www.cloudflare.com/privacypolicy/",
      "Datenbank (Supabase): Die API führt lesende Datenbankabfragen (SELECT) auf eine PostgreSQL-Datenbank durch, die bei Supabase gehostet wird. Diese Abfragen enthalten die oben genannten Bounding-Box-Koordinaten. Es werden keine personenbezogenen Daten in der Datenbank gespeichert. Im Rahmen des technischen Betriebs von Supabase können serverseitige Verbindungs- und Protokolldaten der API-zu-Datenbank-Kommunikation verarbeitet werden, insbesondere Zeitpunkte von Anfragen, technische Fehler- und Ereignisprotokolle sowie die von der API übermittelten Bounding-Box-Koordinaten. Eine direkte Übermittlung der IP-Adresse von Website-Besuchern an Supabase erfolgt durch die Datenbankabfrage nicht. Weitere Informationen findest du in der Datenschutzerklärung von Supabase: https://supabase.com/privacy",
    ],
  },
  {
    title: "4. Kartendarstellung (OpenFreeMap / MapLibre)",
    paragraphs: [
      "Für die Kartendarstellung wird MapLibre GL JS verwendet, eine Open-Source-Bibliothek, die lokal im Browser ausgeführt wird. Als Kartenkacheldienst wird OpenFreeMap verwendet (https://openfreemap.org). OpenFreeMap speichert standardmäßig keine IP-Adressen in seinen Serverlogs. Es werden keine Cookies oder Tracking-Technologien eingesetzt. Lediglich anonymisierte technische Logs (Browsertyp, Betriebssystem, Datum/Uhrzeit) können erhoben werden. Im Falle eines Sicherheitsvorfalls kann OpenFreeMap IP-Adressen für maximal 30 Tage temporär protokollieren. Weitere Informationen findest du in der Datenschutzerklärung von OpenFreeMap: https://openfreemap.org/privacy/",
    ],
  },
  {
    title: "5. Schriften und Medien",
    paragraphs: [
      "Alle Schriften und Bilder werden direkt über die Website ortsschildsprint.com ausgeliefert. Es werden keine externen Dienste wie Google Fonts oder vergleichbare Drittanbieter genutzt. Dadurch werden beim Laden der Seite keine Verbindungen zu externen Servern hergestellt.",
    ],
  },
  {
    title: "6. Keine weiteren Drittanbieter",
    paragraphs: [
      "Es werden keine weiteren Drittanbieter-Dienste, Analyse-Tools, Werbenetzwerke oder Social-Media-Plugins eingesetzt.",
    ],
  },
  {
    title: "7. Deine Rechte",
    paragraphs: [
      "Obwohl diese Website keine personenbezogenen Daten erhebt, stehen dir gemäß DSGVO grundsätzlich folgende Rechte zu:",
      "Für Fragen und Anliegen wende dich bitte an: mail@ortsschildsprint.com",
    ],
    listItems: [
      "Recht auf Auskunft (Art. 15 DSGVO)",
      "Recht auf Berichtigung (Art. 16 DSGVO)",
      "Recht auf Löschung (Art. 17 DSGVO)",
      "Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)",
      "Recht auf Widerspruch (Art. 21 DSGVO)",
      "Recht auf Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO)",
    ],
  },
  {
    title: "8. Änderungen dieser Datenschutzerklärung",
    paragraphs: [
      `Diese Datenschutzerklärung hat den Stand ${privacyPolicyUpdatedAt}. Sie kann bei Bedarf aktualisiert werden. Die jeweils aktuelle Version ist auf dieser Seite abrufbar.`,
    ],
  },
];
