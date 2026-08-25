export const supportedLocales = ["de", "en"] as const;

export type AppLocale = (typeof supportedLocales)[number];

export const messages: Record<AppLocale, Record<string, string>> = {
  de: {
    "navbar.logo": "ortsschildsprint",
    "navbar.logo.label": "Zu Startseite",
    "navbar.stepper.aria": "Fortschrittsanzeige",
    "menu.title": "Menü",
    "menu.open": "Menü öffnen",
    "menu.close": "Menü schließen",
    "menu.languageSwitcher": "Sprache ändern",
    "menu.themeSwitcher": "Darstellungsmodus ändern",
    "menu.language.de": "Deutsch",
    "menu.language.en": "Englisch",
    "menu.theme.light": "Heller Modus",
    "menu.theme.dark": "Dunkler Modus",
    "menu.link.legalnotice": "Impressum",
    "menu.link.privacyPolicy": "Datenschutzerklärung",
    "menu.link.strava": "Strava",
    "menu.link.github": "GitHub Projekt",
    "legalnotice.title": "Impressum",
    "legalnotice.name": "Name und Anschrift",
    "legalnotice.contact": "Kontakt",
    "legal.privacyPolicy.title": "Datenschutzerklärung",
    "home.title":
      "<sentence>Starte{br}deinen</sentence><highlight>Sprint</highlight>",
    "home.description":
      "Lade eine GPX-, TCX- oder FIT-Datei hoch. Ortsschildsprint findet Ortseinfahrtsschilder entlang deiner Strecke und ergänzt deine Route für den Export im gewünschten Format.",
    "privacy.title": "Datenschutz geht vor",
    "privacy.description":
      "Deine Routendatei bleibt im Browser. Für die Suche nach Ortsschildern wird nur der benötigte Kartenausschnitt abgefragt.",
    "upload.title": "GPX, TCX oder FIT hochladen",
    "upload.subtitle": "Datei ablegen oder klicken, um eine Route auszuwählen",
    "upload.subtitle.mobile": "Tippe, um eine Route auszuwählen",
    "upload.button": "Route auswählen",
    "stepper.upload": "Hochladen",
    "stepper.edit": "Bearbeiten",
    "stepper.export": "Exportieren",
    "changeFile.title": "Datenquelle",
    "changeFile.description":
      "Huch, die falsche Route ausgewählt? Ändere deine ausgewählte Route hier.",
    "changeFile.button": "Datei ersetzen",
    "preview.action.title": "Nächster Schritt",
    "preview.action.description":
      "Ortschilder entlang der Route suchen und auswählen",
    "preview.action.button": "Zum Editor",
    "edit.hint.title": "Schilder prüfen",
    "edit.hint.description":
      "Es ist nicht möglich, zuverlässig automatisch zu erkennen, ob ein Schild für die Ortseinfahrt oder -ausfahrt steht. Bitte wähle die Schilder selbst aus.",
    "edit.proceed.button": "Weiter zum Export",
    "edit.proceed.warning.eyebrow": "Nicht alle Schilder geprüft",
    "edit.proceed.warning.title": "Trotzdem fortfahren?",
    "edit.proceed.warning.description":
      "{count, plural, one {# mehrdeutiges Schild hat noch keine eindeutige Zuordnung zur Route.} other {# mehrdeutige Schilder haben noch keine eindeutige Zuordnung zur Route.}} Wenn du jetzt fortfährst, werden diese Schilder im Export dem ersten Routenverlauf zugeordnet.",
    "edit.proceed.warning.cancel": "Zurück zum Prüfen",
    "edit.proceed.warning.confirm": "Trotzdem fortfahren",
    "info.distance": "Länge",
    "info.points": "Sprint Segmente",
    "info.signsAdded": "Schilder",
    "info.noSign": "Keine",
    "info.status": "Bereit",
    "export.title": "Export-Konfiguration",
    "export.description": "Wähle dein bevorzugtes Format für die Navigation.",
    "export.convert.hint":
      "Der Dateityp wird konvertiert, dabei können einige Metadaten verloren gehen",
    "export.gpx.label": "GPX (Universell)",
    "export.gpx.subtitle.original":
      "Die originale .gpx-Datei wird um Wegpunkte ergänzt",
    "export.gpx.description": "Standard-Routenformat für alle Geräte",
    "export.tcx.subtitle.original":
      "Die originale .tcx-Datei wird um Wegpunkte ergänzt",
    "export.tcx.description": "Abbiegehinweise für die Navigation",
    "export.fit.label": "FIT (Empfohlen)",
    "export.fit.description":
      "Optimiert für moderne Garmin-Geräte. Empfohlen, da das Format Wegpunkte für definierte Distanzen speichern kann, was verhindern kann das Ortsschilder mehrmals angezeigt werden falls man in einer anderen Richtung daran vorbei fährt.",
    "export.download": "Route herunterladen",
    "error.title": "Fehler:",
    "error.parse.generic":
      "Beim Verarbeiten der Datei ist ein Fehler aufgetreten.",
    "error.parse.invalidFit": "Keine gültige FIT-Datei.",
    "error.parse.fitIntegrity":
      "Die Integritätsprüfung der FIT-Datei ist fehlgeschlagen.",
    "error.parse.noFitPositionData":
      "In der FIT-Datei wurden keine Positionsdaten gefunden.",
    "error.export.noRouteUploaded": "Keine Route hochgeladen.",
    "error.export.generic": "Export fehlgeschlagen. Bitte versuche es erneut.",
    "error.export.noRouteData":
      "Es sind keine Routendaten für den Export verfügbar.",
    "error.export.noSigns":
      "Es sind keine Schilder verfügbar, die in den Export aufgenommen werden können.",
    "error.export.noResolvedSigns":
      "Es sind keine auf der Route aufgelösten Schildpositionen für den Export verfügbar.",
    "error.export.missingRouteXml": "Die Routen-XML ist nicht verfügbar.",
    "error.export.noLineString":
      "Die Route enthält keine LineString-Koordinaten.",
  },
  en: {
    "navbar.logo": "townsignsprint",
    "navbar.logo.label": "Go to Home",
    "navbar.stepper.aria": "Progress Stepper",
    "menu.title": "Menu",
    "menu.open": "Open menu",
    "menu.close": "Close menu",
    "menu.languageSwitcher": "Change language",
    "menu.themeSwitcher": "Change color mode",
    "menu.language.de": "German",
    "menu.language.en": "English",
    "menu.theme.light": "Light mode",
    "menu.theme.dark": "Dark mode",
    "menu.link.legalnotice": "Legal Notice",
    "menu.link.privacyPolicy": "Privacy Policy",
    "menu.link.strava": "Strava",
    "menu.link.github": "GitHub Project",
    "legalnotice.title": "Legal Notice",
    "legalnotice.name": "Name and Address",
    "legalnotice.contact": "Contact",
    "legal.privacyPolicy.title": "Privacy Policy",
    "home.title":
      "<sentence>Start{br}your</sentence><highlight>Sprint</highlight>",
    "home.description":
      "Upload a GPX, TCX, or FIT file. Townsignsprint finds city limit entry signs along your route and adds them to the export in your preferred format.",
    "privacy.title": "Privacy First",
    "privacy.description":
      "Your route file stays in the browser. Only the map area needed to look up nearby signs is requested.",
    "upload.title": "Upload GPX, TCX or FIT",
    "upload.subtitle": "Drop a file here or click to select a route",
    "upload.subtitle.mobile": "Tap to select a route",
    "upload.button": "Select route",
    "stepper.upload": "Upload",
    "stepper.edit": "Edit",
    "stepper.export": "Export",
    "changeFile.title": "Data Source",
    "changeFile.description":
      "Oops, selected the wrong route? Change your selected route here.",
    "changeFile.button": "Replace File",
    "preview.action.title": "Next Action",
    "preview.action.description": "Query and select City Limit Signs for route",
    "preview.action.button": "Go to Editor",
    "edit.hint.title": "Verify Signs",
    "edit.hint.description":
      "It is not possible to reliably automatically detect if a sign is for city entry or exit. Please select the signs yourself.",
    "edit.proceed.button": "Proceed to export",
    "edit.proceed.warning.eyebrow": "Not all signs reviewed",
    "edit.proceed.warning.title": "Continue anyway?",
    "edit.proceed.warning.description":
      "{count, plural, one {# ambiguous sign still has no clear route assignment.} other {# ambiguous signs still have no clear route assignment.}} If you continue now, those signs will be assigned to the first route pass in the export.",
    "edit.proceed.warning.cancel": "Back to review",
    "edit.proceed.warning.confirm": "Continue anyway",
    "info.distance": "Distance",
    "info.points": "Sprint Points",
    "info.signsAdded": "Signs Added",
    "info.noSign": "No",
    "info.status": "Ready",
    "export.title": "Export Configuration",
    "export.description":
      "Select your preferred format for turn-by-turn navigation.",
    "export.convert.hint": "File type is converted, some metadata may get lost",
    "export.gpx.label": "GPX (Universal)",
    "export.gpx.subtitle.original":
      "Original .gpx file is enriched with waypoints",
    "export.gpx.description": "Standard route format for all devices",
    "export.tcx.subtitle.original":
      "Original .tcx file is enriched with waypoints",
    "export.tcx.description": "Turn by turn navigation",
    "export.fit.label": "FIT (Recommended)",
    "export.fit.description":
      "Optimized for modern Garmin devices and preserves multiple route passes for the same sign. Recommended because format supports Waypoints on specified distances.",
    "export.download": "Download Enriched Route",
    "error.title": "Error:",
    "error.parse.generic": "Something went wrong while parsing the file.",
    "error.parse.invalidFit": "Not a valid FIT file.",
    "error.parse.fitIntegrity": "FIT file integrity check failed.",
    "error.parse.noFitPositionData": "No position data found in FIT file.",
    "error.export.noRouteUploaded": "No route uploaded.",
    "error.export.generic": "Export failed. Please try again.",
    "error.export.noRouteData": "No route data available for export.",
    "error.export.noSigns": "No signs available to include in the export.",
    "error.export.noResolvedSigns":
      "No resolved sign positions available for export.",
    "error.export.missingRouteXml": "Route XML does not exist.",
    "error.export.noLineString": "GeoJSON contains no LineString coordinates.",
  },
};

export function isAppLocale(value: string | null): value is AppLocale {
  return value !== null && supportedLocales.includes(value as AppLocale);
}
