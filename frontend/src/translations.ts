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
    "strava.home.link": "Mit Strava verbinden",
    "strava.dashboard.loading.label": "Strava-Dashboard wird geladen",
    "strava.dashboard.loading.collection": "Deine Sammlung wird geladen",
    "strava.dashboard.error.title":
      "Deine Sammlung konnte nicht geladen werden",
    "strava.dashboard.error.description": "Bitte versuche es erneut.",
    "strava.dashboard.retry": "Erneut versuchen",
    "strava.dashboard.collection": "Deine Sammlung",
    "strava.error.importActivities":
      "Aktivitäten konnten nicht importiert werden.",
    "strava.error.savePreference":
      "Deine Einstellung konnte nicht gespeichert werden.",
    "strava.connect.title": "Strava verbinden",
    "strava.connect.description":
      "Sammle die Ortsschilder, die du auf Outdoor-Fahrten findest.",
    "strava.connect.summary.question":
      "Zusammenfassung zu Aktivitäten hinzufügen?",
    "strava.connect.summary.hint": "Du kannst dies später ändern.",
    "strava.connect.addSummary": "Zusammenfassung zu Schildern hinzufügen",
    "strava.connect.addSummary.description":
      "Neue Schilder werden als kurze Notiz zur Aktivität hinzugefügt.",
    "strava.connect.keepDescriptions": "Beschreibungen unverändert lassen",
    "strava.connect.keepDescriptions.description":
      "Deine Sammlung wird aktualisiert; Aktivitätsbeschreibungen bleiben unverändert.",
    "strava.connect.action": "Weiter zu Strava",
    "strava.connect.handoff": "Du bestätigst den Zugriff bei Strava.",
    "strava.preference.title": "Aktivitätsbeschreibungen",
    "strava.preference.enabled.description":
      "Neue Schilder einer Fahrt werden zur Aktivitätsbeschreibung hinzugefügt.",
    "strava.preference.disabled.description":
      "Aktivitätsbeschreibungen auf Strava werden nicht geändert.",
    "strava.preference.saving": "Wird gespeichert",
    "strava.preference.on": "An",
    "strava.preference.off": "Aus",
    "strava.preference.enable": "Schild-Zusammenfassung hinzufügen",
    "strava.preference.disable": "Keine Schild-Zusammenfassung hinzufügen",
    "strava.preference.reconnect":
      "Erneut verbinden, um Zusammenfassungen hinzuzufügen",
    "strava.preference.permission":
      "Zum Hinzufügen von Zusammenfassungen brauchst du die Schreibberechtigung für Strava-Aktivitäten.",
    "strava.history.title": "Ältere Fahrten prüfen",
    "strava.history.action.loadingRecent": "Letzte Fahrten werden geprüft …",
    "strava.history.action.searchFull": "Ältere Fahrten prüfen",
    "strava.history.action.checking": "Fahrten werden geprüft …",
    "strava.history.action.checkNext": "Weitere Fahrten prüfen",
    "strava.history.status.complete": "Alle Fahrten geprüft",
    "strava.history.status.running": "Ältere Fahrten werden geprüft",
    "strava.history.status.loadingRecent": "Letzte Fahrten werden geprüft",
    "strava.history.status.notScanned": "Ältere Fahrten nicht geprüft",
    "strava.history.description.complete":
      "Alle verfügbaren Fahrten im Freien wurden auf Schilder geprüft.",
    "strava.history.description.running":
      "Ältere Fahrten werden im Hintergrund auf Schilder geprüft.",
    "strava.history.description.loadingRecent":
      "Deine letzten Fahrten werden zuerst auf Schilder geprüft.",
    "strava.history.description.notScanned":
      "Prüfe ältere Fahrten, um deren Schilder zu deiner Sammlung hinzuzufügen.",
    "strava.history.ridesChecked":
      "{count, plural, one {# Fahrt im Freien geprüft} other {# Fahrten im Freien geprüft}}",
    "strava.history.ridesChecked.withTotal":
      "{processed, number} von {total, number} Fahrten im Freien geprüft",
    "strava.stats.label": "Sammlungsstatistiken",
    "strava.stats.signsCollected": "Gesammelte Schilder",
    "strava.stats.signsPerRide": "{count} Schilder pro geprüfter Fahrt.",
    "strava.stats.uniqueSign": "Jedes einzigartige Ortsschild.",
    "strava.stats.ridesChecked": "Geprüfte Fahrten",
    "strava.stats.ridesCheckedProgress":
      "{checked, number} von {total, number} Fahrten geprüft",
    "strava.stats.loadingRideCount": "Gesamtzahl der Fahrten wird geladen",
    "strava.stats.noOutdoorRides": "Noch keine Fahrten im Freien auf Strava.",
    "strava.stats.ridesCheckedPercent":
      "{progress} deiner Fahrten im Freien auf Strava geprüft.",
    "strava.stats.countingRides":
      "Die Anzahl deiner Fahrten im Freien auf Strava wird im Hintergrund ermittelt …",
    "strava.stats.lastThirtyDays": "Letzte 30 Tage",
    "strava.stats.signsThisMonth": "Diesen Monat neu entdeckte Schilder.",
    "strava.stats.namedPlaces": "Benannte Orte",
    "strava.stats.distinctNames": "Einzigartige Namen in deiner Sammlung.",
    "strava.map.defaultSign": "Ortsschild",
    "strava.map.title": "Sammlungskarte",
    "strava.map.empty":
      "Hier erscheinen Schilder, sobald eine Strava-Fahrt verarbeitet wurde.",
    "strava.map.heading": "Gesammelte Schilder",
    "strava.map.description":
      "Wähle, wie die Schilder deiner Sammlung auf der Karte angezeigt werden.",
    "strava.map.view": "Kartenansicht",
    "strava.map.view.signposts": "Schilder",
    "strava.map.view.heatmap": "Dichte",
    "strava.map.view.dots": "Punkte",
    "strava.map.closeSign": "Informationen zum Schild schließen",
    "strava.map.signId": "OSM-SCHILD-ID",
    "strava.map.coordinates": "BREITE / LÄNGE",
    "strava.map.streetView": "Street View",
    "legalnotice.title": "Impressum",
    "legalnotice.name": "Name und Anschrift",
    "legalnotice.contact": "Kontakt",
    "legal.privacyPolicy.title": "Datenschutzerklärung",
    "home.title": "Ortsschilder entlang deiner Route",
    "home.description":
      "Ortsschilder auf deiner Route finden und für die Navigation exportieren.",
    "privacy.description":
      "Deine Routendatei bleibt im Browser – abgefragt wird nur der Kartenausschnitt der Route.",
    "upload.title": "Route hochladen",
    "upload.drop.hint": "oder Datei hierher ziehen",
    "upload.button": "Route auswählen",
    "upload.processing": "Route wird verarbeitet …",
    "upload.cancel": "Abbrechen",
    "error.dismiss": "Fehlermeldung schließen",
    "error.parse.rejectedFile":
      "Dieser Dateityp wird nicht unterstützt. Wähle eine GPX-, TCX- oder FIT-Datei.",
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
      "Optimiert für moderne Garmin-Geräte. Empfohlen, da das Format Wegpunkte für definierte Distanzen speichern kann. So wird verhindert, dass Ortsschilder mehrmals angezeigt werden, wenn man in der Gegenrichtung an ihnen vorbeifährt.",
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
    "strava.home.link": "Connect Strava",
    "strava.dashboard.loading.label": "Loading Strava dashboard",
    "strava.dashboard.loading.collection": "Loading your collection",
    "strava.dashboard.error.title": "Could not load your collection",
    "strava.dashboard.error.description": "Please try again.",
    "strava.dashboard.retry": "Try again",
    "strava.dashboard.collection": "Your collection",
    "strava.error.importActivities": "Could not import activities.",
    "strava.error.savePreference": "Could not save your preference.",
    "strava.connect.title": "Connect Strava",
    "strava.connect.description":
      "Collect the city-limit signs you pass on outdoor rides.",
    "strava.connect.summary.question": "Add sign summaries to activities?",
    "strava.connect.summary.hint": "You can change this later.",
    "strava.connect.addSummary": "Add a sign summary",
    "strava.connect.addSummary.description":
      "Add a short note when a ride finds new signs.",
    "strava.connect.keepDescriptions": "Keep descriptions untouched",
    "strava.connect.keepDescriptions.description":
      "Your collection updates here; activity descriptions stay unchanged.",
    "strava.connect.action": "Continue to Strava",
    "strava.connect.handoff": "You’ll confirm access on Strava.",
    "strava.preference.title": "Activity descriptions",
    "strava.preference.enabled.description":
      "New signs from a ride are added to its Strava activity description.",
    "strava.preference.disabled.description":
      "Strava activity descriptions are not changed.",
    "strava.preference.saving": "Saving",
    "strava.preference.on": "On",
    "strava.preference.off": "Off",
    "strava.preference.enable": "Add a sign summary",
    "strava.preference.disable": "Do not add a sign summary",
    "strava.preference.reconnect": "Reconnect to add summaries",
    "strava.preference.permission":
      "Adding summaries requires permission to write Strava activities.",
    "strava.history.title": "Check older rides",
    "strava.history.action.loadingRecent": "Checking recent rides …",
    "strava.history.action.searchFull": "Check older rides",
    "strava.history.action.checking": "Checking rides …",
    "strava.history.action.checkNext": "Check more rides",
    "strava.history.status.complete": "All rides checked",
    "strava.history.status.running": "Checking older rides",
    "strava.history.status.loadingRecent": "Checking recent rides",
    "strava.history.status.notScanned": "Older rides not scanned",
    "strava.history.description.complete":
      "Every available outdoor ride has been checked for signs.",
    "strava.history.description.running":
      "Older rides are being checked for signs in the background.",
    "strava.history.description.loadingRecent":
      "Your recent rides are being checked for signs first.",
    "strava.history.description.notScanned":
      "Check older rides to add their signs to your collection.",
    "strava.history.ridesChecked":
      "{count, plural, one {# outdoor ride checked} other {# outdoor rides checked}}",
    "strava.history.ridesChecked.withTotal":
      "{processed, number} of {total, number} outdoor rides checked",
    "strava.stats.label": "Collection statistics",
    "strava.stats.signsCollected": "Signs collected",
    "strava.stats.signsPerRide": "{count} signs per checked ride.",
    "strava.stats.uniqueSign": "Every unique city limit sign.",
    "strava.stats.ridesChecked": "Rides checked",
    "strava.stats.ridesCheckedProgress":
      "{checked, number} of {total, number} rides checked",
    "strava.stats.loadingRideCount": "Loading total ride count",
    "strava.stats.noOutdoorRides": "No outdoor Strava rides yet.",
    "strava.stats.ridesCheckedPercent":
      "{progress} of your outdoor Strava rides checked.",
    "strava.stats.countingRides":
      "Counting your outdoor Strava rides in the background …",
    "strava.stats.lastThirtyDays": "Last 30 days",
    "strava.stats.signsThisMonth": "New signs discovered this month.",
    "strava.stats.namedPlaces": "Named places",
    "strava.stats.distinctNames": "Distinct names in your collection.",
    "strava.map.defaultSign": "City limit sign",
    "strava.map.title": "Collection map",
    "strava.map.empty":
      "Signs appear here after a Strava ride has been processed.",
    "strava.map.heading": "Collected signs",
    "strava.map.description":
      "Choose how to display the signs in your collection.",
    "strava.map.view": "Map view",
    "strava.map.view.signposts": "Signs",
    "strava.map.view.heatmap": "Density",
    "strava.map.view.dots": "Dots",
    "strava.map.closeSign": "Close sign information",
    "strava.map.signId": "OSM SIGN ID",
    "strava.map.coordinates": "LAT / LONG",
    "strava.map.streetView": "Street View",
    "legalnotice.title": "Legal Notice",
    "legalnotice.name": "Name and Address",
    "legalnotice.contact": "Contact",
    "legal.privacyPolicy.title": "Privacy Policy",
    "home.title": "City-limit signs along your route",
    "home.description":
      "Find the signs on your route and export them for navigation.",
    "privacy.description":
      "Your route file stays in the browser – only the route's map area is queried.",
    "upload.title": "Upload a route",
    "upload.drop.hint": "or drop a file here",
    "upload.button": "Select route",
    "upload.processing": "Processing route …",
    "upload.cancel": "Cancel",
    "error.dismiss": "Dismiss error",
    "error.parse.rejectedFile":
      "This file type is not supported. Choose a GPX, TCX, or FIT file.",
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
      "Optimized for modern Garmin devices. Recommended because the format stores waypoints at defined distances, so a sign is not displayed multiple times when you pass it in the opposite direction.",
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
