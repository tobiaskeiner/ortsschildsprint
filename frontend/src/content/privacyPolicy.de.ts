export interface PrivacyPolicySection {
  title: string;
  paragraphs: string[];
  listItems?: string[];
}

export const privacyPolicyUpdatedAt = "14. November 2026";

export const privacyPolicySections: PrivacyPolicySection[] = [
  {
    title: "1. Grundsätze",
    paragraphs: [
      "Verantwortlich für den Inhalt und die Datenverarbeitung auf dieser Website ist Tobias Keiner, Helmholtzstraße 2, 01069 Dresden, E-Mail: mail@ortsschildsprint.com.",
      "Der Betreiber von ortsschildsprint.com legt großen Wert auf den Schutz deiner Privatsphäre. Der Ablauf für Routendateien erstellt kein Konto und verwendet kein Tracking. Die optionale Strava-Verknüpfung erstellt jedoch eine serverseitige Verbindung und Sitzung, um Fahrten zu analysieren und eine persönliche Ortschild-Sammlung anzuzeigen.",
      "Notwendige First-Party-Cookies werden nur bei einer Strava-Verknüpfung eingesetzt: Kurzlebige OAuth-State-Cookies sichern den Verknüpfungsablauf, und ein Session-Cookie hält das verbundene Dashboard verfügbar. Sie werden nicht für Werbung oder websiteübergreifendes Tracking verwendet.",
    ],
  },
  {
    title: "2. Verarbeitete Daten",
    paragraphs: [
      "Für den Ablauf mit Routendateien werden geografische Koordinaten als Bounding Box verarbeitet, um Ortschild-Daten abzufragen. Die Routendateien selbst verbleiben dabei im Browser und werden nicht hochgeladen. Bounding-Box-Koordinaten werden nicht über den einzelnen Abruf hinaus gespeichert.",
      "Wenn du Strava freiwillig verbindest, speichert der Dienst deine Strava-Athleten-ID, den Anzeigenamen, die Profilbild-URL, erteilte Berechtigungen, verschlüsselte Zugriffs- und Refresh-Tokens, die Einstellung für Aktivitätszusammenfassungen, Session-IDs, Aktivitäts-IDs und -Zeitpunkte sowie die auf berechtigten Fahrten gesammelten Ortsschilder. Tokens werden verschlüsselt, bevor sie in die Datenbank geschrieben werden.",
      "Zum Schutz der öffentlichen Ortschild-Abfrage leitet die API aus der von Cloudflare übermittelten Client-IP-Adresse einen pseudonymen Rate-Limit-Schlüssel ab und speichert ihn zusammen mit Zeitfenster und Zähler. Diese Einträge werden durch einen geplanten Bereinigungslauf nach ungefähr 24 Stunden gelöscht.",
    ],
  },
  {
    title: "3. Hosting und Infrastruktur",
    paragraphs: [
      "Website und API (Cloudflare): Die Benutzeroberfläche unter ortsschildsprint.com sowie die API unter api.ortsschildsprint.com werden über Cloudflare gehostet (Cloudflare Pages bzw. Cloudflare Workers). Cloudflare ist ein US-amerikanisches Unternehmen, das als CDN-Anbieter eingesetzt wird. Im Rahmen des Hostings können durch Cloudflare technische Verbindungsdaten wie insbesondere IP-Adresse, Zeitpunkt des Zugriffs, angeforderte URL, HTTP-Statuscode, Referrer, Browsertyp, Betriebssystem und weitere für die Auslieferung und Absicherung notwendige Verbindungsmetadaten vorübergehend verarbeitet werden. Weitere Informationen findest du in der Datenschutzerklärung von Cloudflare: https://www.cloudflare.com/privacypolicy/",
      "Datenbank (Supabase): Die API nutzt eine bei Supabase gehostete PostgreSQL-Datenbank für Ortschild-Daten, Rate Limiting und die optionale Strava-Verknüpfung. Dazu gehören die oben beschriebenen Verbindungs-, Sitzungs-, Sammlungs- und Rate-Limit-Daten. Im Rahmen des technischen Betriebs können bei Supabase außerdem serverseitige Verbindungs- und Protokolldaten verarbeitet werden. Weitere Informationen findest du in der Datenschutzerklärung von Supabase: https://supabase.com/privacy",
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
      "Schriften und Anwendungsbilder werden direkt über ortsschildsprint.com ausgeliefert. In einem verbundenen Strava-Dashboard kann der Browser die von Strava bereitgestellte Profilbild-URL abrufen. Externe Schriftdienste wie Google Fonts werden nicht verwendet.",
    ],
  },
  {
    title: "6. Optionale Strava-Verknüpfung und externe Links",
    paragraphs: [
      "Bei einer Strava-Verknüpfung leitet Ortsschildsprint dich zur Autorisierung zu Strava weiter und ruft die für die Funktion benötigten Fahrten über die Strava-API ab. Die Street-View-Schaltfläche der Karte öffnet Google Maps erst, wenn du sie auswählst. Analyse-Tools, Werbenetzwerke und Social-Media-Plugins werden nicht eingesetzt.",
    ],
  },
  {
    title: "7. Deine Rechte",
    paragraphs: [
      "In Bezug auf personenbezogene Daten aus der optionalen Strava-Verknüpfung und dem Rate Limiting stehen dir gemäß DSGVO grundsätzlich folgende Rechte zu:",
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
