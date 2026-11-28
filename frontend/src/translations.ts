export const supportedLocales = ["de", "en"] as const;

export type AppLocale = (typeof supportedLocales)[number];

export const messages: Record<AppLocale, Record<string, string>> = {
  de: {
    "navbar.logo": "ortsschildsprint",
    "navbar.logo.label": "Zu Startseite",
    "navbar.stepper.aria": "Fortschrittsanzeige",
    "navbar.navigation.aria": "Navigation",
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
      "Lade eine Routendatei hoch, um ihre Ortsschilder zu finden und für dein Navi zu exportieren.",
    "privacy.description":
      "Deine Routendatei bleibt im Browser – abgefragt wird nur der Kartenausschnitt der Route.",
    "upload.drop.hint": "oder Datei auf die Karte ziehen",
    "upload.drop.active": "Loslassen, um die Route zu laden",
    "upload.button": "Route auswählen",
    "upload.processing": "Route wird verarbeitet …",
    "upload.cancel": "Abbrechen",
    "error.dismiss": "Fehlermeldung schließen",
    "error.parse.rejectedFile":
      "Dieser Dateityp wird nicht unterstützt. Wähle eine GPX-, TCX- oder FIT-Datei.",
    "stepper.upload": "Hochladen",
    "stepper.edit": "Bearbeiten",
    "stepper.export": "Exportieren",
    "preview.action.button": "Schilder suchen",
    "preview.file.title": "Routendatei",
    "preview.file.format": "Format",
    "preview.file.points": "Trackpunkte",
    "preview.file.shape": "Verlauf",
    "preview.file.replace": "Datei ersetzen",
    "preview.shape.loop": "Rundkurs",
    "preview.shape.oneWay": "Von A nach B",
    "preview.stats.distance": "Distanz",
    "preview.stats.gain": "Anstieg",
    "preview.stats.highest": "Höchster Punkt",
    "preview.profile.title": "Höhenprofil",
    "preview.profile.titleFlat": "Distanz entlang der Route",
    "preview.profile.hint":
      "Profil abfahren, um die Stelle auf der Karte zu sehen",
    "preview.profile.hintFlat":
      "Leiste abfahren, um die Stelle auf der Karte zu sehen",
    "preview.profile.hintShort": "Ziehen zeigt die Stelle auf der Karte",
    "preview.profile.noElevation": "Diese Datei enthält keine Höhendaten.",
    "edit.intro":
      "Geh jedes Schild durch. Die Daten unterscheiden nicht zwischen Ortseingang und Ortsausgang, also lösch die Schilder, auf die du nicht sprintest.",
    "edit.list.title":
      "{count, plural, one {# Schild} other {# Schilder}} entlang der Route",
    "edit.intro.detected":
      "Ortsausgänge haben wir aus dem Export genommen, sie bleiben hier zum Wiederaufnehmen. Prüf die Schilder, deren Richtung unklar ist.",
    "edit.crossing.entry": "Ortseingang",
    "edit.crossing.exit": "Ortsausgang",
    "edit.crossing.unknown": "Richtung unklar, bitte prüfen",
    "edit.crossing.skipped": "Ortsausgang · nicht im Export",
    "edit.sign.restore": "Aufnehmen",
    "edit.sign.restore.label": "{name} wieder in den Export aufnehmen",
    "edit.sign.delete": "Löschen",
    "edit.pass.needed": "Durchfahrt wählen",
    "edit.pass.question":
      "Du passierst dieses Schild mehrmals. Bei welchen Durchfahrten willst du sprinten?",
    "edit.pass.label": "Durchfahrt {number}",
    "edit.pass.formats":
      "FIT übernimmt alle gewählten Durchfahrten, GPX und TCX nur die erste.",
    "edit.proceed.button": "Weiter zum Export",
    "edit.noSigns.title": "Keine Ortsschilder entlang dieser Route gefunden",
    "edit.noSigns.description":
      "In OpenStreetMap haben wir keine passenden Schilder gefunden. Wenn hier ein Schild stehen sollte, prüfe, ob es in OSM korrekt eingetragen ist. Sobald es dort erfasst ist, wird es bei künftigen Suchen gefunden.",
    "edit.noSigns.back": "Zurück zum Upload",
    "edit.noSigns.continue": "Trotzdem zum Export",
    "edit.proceed.warning.title": "Trotzdem fortfahren?",
    "edit.proceed.warning.description":
      "{count, plural, one {Bei # Schild ist noch keine Durchfahrt gewählt. Wenn du fortfährst, wird dort die erste Durchfahrt verwendet.} other {Bei # Schildern ist noch keine Durchfahrt gewählt. Wenn du fortfährst, wird dort jeweils die erste Durchfahrt verwendet.}}",
    "edit.proceed.warning.cancel": "Zurück zum Prüfen",
    "edit.proceed.warning.confirm": "Trotzdem fortfahren",
    "export.intro":
      "{count, plural, =0 {Keine Ortsschilder, die als Wegpunkte in die Datei kommen.} one {Deine Route mit # Ortsschild als Wegpunkt, bereit für deinen Radcomputer.} other {Deine Route mit # Ortsschildern als Wegpunkten, bereit für deinen Radcomputer.}}",
    "export.back": "Zurück zum Prüfen",
    "export.file.waypoints": "Wegpunkte",
    "export.file.signs": "Schilder",
    "export.file.distance": "Länge",
    "export.file.list": "Ortsschilder in dieser Datei",
    "export.pass.dropped": "(nicht in diesem Format)",
    "export.format.title": "Dateiformat",
    "export.format.fit.title": "Gemacht für Garmin-Geräte",
    "export.format.fit.description":
      "Jedes Schild wird mit seiner Distanz entlang der Route gespeichert und erscheint deshalb nicht erneut, wenn du in der Gegenrichtung vorbeifährst. Alle gewählten Durchfahrten bleiben erhalten.",
    "export.format.gpx.title": "Funktioniert auf jedem Gerät",
    "export.format.gpx.description":
      "Das Standardformat für Routen. Die Schilder werden als Wegpunkte ergänzt, bei zweimal passierten Schildern nur die erste Durchfahrt.",
    "export.format.tcx.title": "Strecke mit Abbiegehinweisen",
    "export.format.tcx.description":
      "Ein Kursformat für die Navigation. Die Schilder werden als Kurspunkte ergänzt, bei zweimal passierten Schildern nur die erste Durchfahrt.",
    "export.source.original":
      "Deine originale .{ext}-Datei, ergänzt um die Schilder.",
    "export.source.converted":
      "Aus deiner .{ext}-Datei erzeugt. Dabei können einige Metadaten verloren gehen.",
    "export.download": ".{ext} herunterladen",
    "export.empty.title": "Keine Schilder in dieser Datei",
    "export.empty.description":
      "Alle Schilder wurden entfernt oder entlang dieser Route wurden keine gefunden.",
    "export.empty.hint":
      "Ohne Ortsschilder gibt es nichts zu ergänzen. Entfernte Schilder kommen zurück, wenn du die Route erneut hochlädst.",
    "export.format.recommended": "Empfohlen",
    "export.facts.twice": "Zweimal passierte Schilder",
    "export.facts.passes": "Durchfahrten in der Datei",
    "export.facts.passes.all": "Alle gewählten",
    "export.facts.passes.first": "Nur die erste",
    "export.empty.action": "Route hochladen",
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
    "navbar.navigation.aria": "Navigation",
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
      "Upload a route file to find its signs and export them for your navigation device.",
    "privacy.description":
      "Your route file stays in the browser – only the route's map area is queried.",
    "upload.drop.hint": "or drop a file onto the map",
    "upload.drop.active": "Drop to load the route",
    "upload.button": "Select route",
    "upload.processing": "Processing route …",
    "upload.cancel": "Cancel",
    "error.dismiss": "Dismiss error",
    "error.parse.rejectedFile":
      "This file type is not supported. Choose a GPX, TCX, or FIT file.",
    "stepper.upload": "Upload",
    "stepper.edit": "Edit",
    "stepper.export": "Export",
    "preview.action.button": "Find signs",
    "preview.file.title": "Route file",
    "preview.file.format": "Format",
    "preview.file.points": "Track points",
    "preview.file.shape": "Shape",
    "preview.file.replace": "Replace file",
    "preview.shape.loop": "Loop",
    "preview.shape.oneWay": "Point to point",
    "preview.stats.distance": "Distance",
    "preview.stats.gain": "Elevation gain",
    "preview.stats.highest": "Highest point",
    "preview.profile.title": "Elevation profile",
    "preview.profile.titleFlat": "Distance along the route",
    "preview.profile.hint": "Move along the profile to see the spot on the map",
    "preview.profile.hintFlat": "Move along the bar to see the spot on the map",
    "preview.profile.hintShort": "Drag to find the spot on the map",
    "preview.profile.noElevation": "This file has no elevation data.",
    "edit.intro":
      "Go through every sign. The data can't tell town entries from exits, so delete the signs you won't sprint for.",
    "edit.list.title":
      "{count, plural, one {# sign} other {# signs}} along the route",
    "edit.intro.detected":
      "We've left town exits out of the export; they stay here so you can add them back. Check the signs whose direction is unclear.",
    "edit.crossing.entry": "Town entry",
    "edit.crossing.exit": "Town exit",
    "edit.crossing.unknown": "Direction unclear, please check",
    "edit.crossing.skipped": "Town exit · not exported",
    "edit.sign.restore": "Add back",
    "edit.sign.restore.label": "Add {name} back to the export",
    "edit.sign.delete": "Delete",
    "edit.pass.needed": "Choose a pass",
    "edit.pass.question":
      "You pass this sign more than once. Which passes do you want to sprint on?",
    "edit.pass.label": "Pass {number}",
    "edit.pass.formats":
      "FIT keeps every chosen pass. GPX and TCX keep only the first.",
    "edit.proceed.button": "Proceed to export",
    "edit.noSigns.title": "No city limit signs detected along this route",
    "edit.noSigns.description":
      "We couldn't find any matching signs in the OpenStreetMap database. If you know a sign should be here, please ensure it is correctly mapped in OSM. Once updated in OpenStreetMap, it will be available for future scans.",
    "edit.noSigns.back": "Back to Upload",
    "edit.noSigns.continue": "Continue to Export anyway",
    "edit.proceed.warning.title": "Continue anyway?",
    "edit.proceed.warning.description":
      "{count, plural, one {# sign still needs a pass chosen. If you continue, its first pass is used.} other {# signs still need a pass chosen. If you continue, their first pass is used.}}",
    "edit.proceed.warning.cancel": "Back to review",
    "edit.proceed.warning.confirm": "Continue anyway",
    "export.intro":
      "{count, plural, =0 {No city-limit signs to add to the file as waypoints.} one {Your route with # city-limit sign as a waypoint, ready for your bike computer.} other {Your route with # city-limit signs as waypoints, ready for your bike computer.}}",
    "export.back": "Back to review",
    "export.file.waypoints": "Waypoints",
    "export.file.signs": "Signs",
    "export.file.distance": "Distance",
    "export.file.list": "City-limit signs in this file",
    "export.pass.dropped": "(not in this format)",
    "export.format.title": "File format",
    "export.format.fit.title": "Made for Garmin devices",
    "export.format.fit.description":
      "Each sign is stored at its distance along the route, so it doesn't show up again when you pass it in the opposite direction. Every pass you chose is kept.",
    "export.format.gpx.title": "Works on every device",
    "export.format.gpx.description":
      "The standard route format. Signs are added as waypoints; for a sign you pass twice, only the first pass is kept.",
    "export.format.tcx.title": "Course with turn-by-turn navigation",
    "export.format.tcx.description":
      "A course format for navigation. Signs are added as course points; for a sign you pass twice, only the first pass is kept.",
    "export.source.original":
      "Your original .{ext} file, with the signs added.",
    "export.source.converted":
      "Built from your .{ext} file. Some of its metadata may be lost.",
    "export.download": "Download .{ext}",
    "export.empty.title": "No signs in this file",
    "export.empty.description":
      "Every sign was removed, or none were found along this route.",
    "export.empty.hint":
      "Without city-limit signs there is nothing to add. Removed signs come back when you upload the route again.",
    "export.format.recommended": "Recommended",
    "export.facts.twice": "Signs passed twice",
    "export.facts.passes": "Passes in this file",
    "export.facts.passes.all": "Every chosen pass",
    "export.facts.passes.first": "First pass only",
    "export.empty.action": "Upload a route",
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
