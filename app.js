/* ============================================================
   TalkCard — vanilla JS app logic
   - 4 languages (NL / EN / DE / FR)
   - Step-by-step wizard (each step can be skipped)
   - Custom free fields at the end (own question + answer)
   - Photo upload (downscaled + stored locally)
   - Builds the poster only from answers that were filled in
   - Offline QR code (qrcode-generator) -> data URL
   - High-resolution PNG export via SVG <foreignObject>
   ============================================================ */
(function () {
  "use strict";

  /* -------- where the QR code points (change this later to the
     statically hosted URL of this tool) -------- */
  var QR_TARGET = "https://rderks88.github.io/talk-card/";

  var STORAGE_KEY = "praatkaart_v1";
  var LANGS = ["nl", "en", "de", "fr"];

  /* ---------- Wizard structure (order + input type) ----------
     The visible text for every step lives in I18N[lang].steps[id]. */
  var STEP_DEFS = [
    { id: "name", kind: "text" },
    { id: "birth", kind: "date" },
    { id: "photo", kind: "photo" },
    { id: "born", kind: "textarea" },
    { id: "partner", kind: "text" },
    { id: "children", kind: "textarea" },
    { id: "siblings", kind: "textarea" },
    { id: "visitors", kind: "textarea" },
    { id: "enjoys", kind: "textarea" },
    { id: "hobbies", kind: "textarea" },
    { id: "highlights", kind: "textarea" },
    { id: "important", kind: "textarea" },
    { id: "annoying", kind: "textarea" },
    { id: "work", kind: "textarea" },
    { id: "education", kind: "textarea" },
    { id: "living", kind: "text" },
    { id: "custom", kind: "custom" }
  ];

  /* Order of predefined bubbles on the poster (mirrors the reference). */
  var BUBBLE_ORDER = [
    "visitors", "born", "partner", "children", "siblings",
    "enjoys", "annoying", "highlights", "important",
    "work", "hobbies", "living", "education"
  ];

  /* =========================================================
     TRANSLATIONS
     ========================================================= */
  var I18N = {
    nl: {
      htmlTitle: "TalkCard — een gesprekskaart voor je dierbare",
      brand_sub: "Een hulpkaart voor fijne gesprekken",
      intro_title: "Maak een persoonlijke TalkCard",
      intro_lead: "Een overzichtskaart met de belangrijkste dingen over je dierbare, zodat verzorgers, familie en bezoekers makkelijker een fijn, betekenisvol gesprek kunnen voeren met iemand met dementie of alzheimer.",
      tribute: "Gemaakt als eerbetoon aan mijn oom Will",
      feedback: "Heb je feedback om dit voor anderen te verbeteren? Mail me op {email}.",
      intro_s1_t: "Beantwoord een paar vragen",
      intro_s1_d: "Naam, partner, kinderen, hobby's, werk… Vragen die niet passen sla je gewoon over.",
      intro_s2_t: "Voeg een foto toe",
      intro_s2_d: "Een duidelijke, vrolijke foto van je dierbare.",
      intro_s3_t: "Download & print de kaart",
      intro_s3_d: "Je krijgt een kaart in hoge resolutie die je kunt printen of delen.",
      start: "Beginnen",
      resume_text: "We hebben je eerdere antwoorden bewaard.",
      resume_link: "Opnieuw beginnen",
      step_word: "Stap",
      back: "Vorige", skip: "Overslaan", next: "Volgende", viewcard: "Bekijk kaart",
      example_label: "Voorbeeld:",
      date_shows_as: "Wordt op de kaart getoond als:",
      autosave: "Je antwoorden worden automatisch op dit apparaat bewaard (en nergens anders).",
      photo_click: "Klik om een foto te kiezen",
      photo_drag: "of sleep een foto hierheen — JPG of PNG",
      photo_remove: "Foto verwijderen",
      photo_invalid: "Kies een afbeelding (JPG of PNG).",
      custom_add: "+ Onderwerp toevoegen",
      custom_title_ph: "Kop (bijv. HUISDIER)",
      custom_text_ph: "Tekst die op de kaart komt",
      custom_remove: "Verwijderen",
      custom_empty: "Nog geen eigen onderwerpen. Klik op ‘Onderwerp toevoegen’.",
      prev_title: "Je TalkCard",
      edit: "Aanpassen", print: "Printen", download: "Download als afbeelding",
      prev_hint: "Tip: gebruik <b>Download als afbeelding</b> voor een scherpe versie in hoge resolutie (groter dan je scherm). Of gebruik <b>Printen</b> om op te slaan als PDF.",
      reorder_title: "Volgorde van de kaartjes",
      reorder_hint: "Sleep de kaartjes op de kaart om de volgorde te veranderen.",
      reorder_list_label: "Liever met een lijst? (handig op tablet)",
      reorder_up: "Omhoog", reorder_down: "Omlaag",
      busy: "Bezig…",
      export_fail: "Het downloaden lukte niet automatisch. Gebruik de knop ‘Printen’ en kies ‘Opslaan als PDF’, of maak een schermafbeelding van de kaart.",
      sheet_title: "OVER {name} in het kort",
      sheet_title_noname: "deze persoon",
      placeholder_name: "Naam",
      foot: "<b>TalkCard</b> — een hulpmiddel voor fijne, betekenisvolle gesprekken.",
      qr_caption: "Scan om zelf een TalkCard te maken",
      steps: {
        name: { q: "Voor wie maak je deze kaart?", hint: "De naam van je dierbare. Deze komt groot bij de foto te staan.", placeholder: "Bijv. Will", example: "Will" },
        birth: { q: "Geboortedatum", hint: "Kies de geboortedatum in de kalender." },
        photo: { q: "Voeg een foto toe", hint: "Een duidelijke, vrolijke foto van het gezicht werkt het best." },
        custom: { q: "Eigen onderwerpen toevoegen", hint: "Mis je iets? Voeg je eigen vraag en antwoord toe. Deze komen als extra wolkjes op de kaart." },
        born: { title: "GEBOREN", q: "Waar en in wat voor gezin is hij/zij geboren?", hint: "Geboorteplaats, het gezin, de achtergrond.", placeholder: "…in Oostrum bij Venray. De tweede zoon uit een katholiek gezin van 8 kinderen." },
        partner: { title: "PARTNER", q: "Wie is de partner?", hint: "De naam van de partner of geliefde.", placeholder: "Bijv. Annelies" },
        children: { title: "KINDEREN", q: "Hoe heten de kinderen?", hint: "De namen van de kinderen.", placeholder: "Bijv. Sanne, Tom en Lisa" },
        siblings: { title: "BROERS & ZUSSEN", q: "Broers en zussen?", hint: "Namen van broers en zussen.", placeholder: "Bijv. Jan, Marie en Theo" },
        visitors: { title: "BEZOEKERS", q: "Wie komen er op bezoek?", hint: "Familie en vrienden die langskomen — fijn om bij naam te kunnen noemen.", placeholder: "Bijv. Annelies, Hubertine en Jeroen, Richard en Karin, en mijn vrienden en vriendinnen" },
        enjoys: { title: "IK GENIET VAN…", q: "Waar geniet hij/zij van?", hint: "Dingen die rust, plezier of een glimlach geven.", placeholder: "Bijv. luisteren naar muziek en samen muziek maken, wandelen, fietsen en lekker eten" },
        hobbies: { title: "HOBBY'S", q: "Wat zijn de hobby's?", hint: "Bezigheden en interesses.", placeholder: "Bijv. muziek maken, wandelen, fietsen, mountainbiken" },
        highlights: { title: "HOOGTEPUNTEN", q: "Wat zijn de hoogtepunten in zijn/haar leven?", hint: "Mooie momenten, trotse momenten, bijzondere gebeurtenissen.", placeholder: "Bijv. het trouwen met Annelies, de vele reizen en de uitgave van een eigen muziekboek" },
        important: { title: "WAT IK BELANGRIJK VIND", q: "Wat vindt hij/zij belangrijk?", hint: "Waar iemand zich prettig bij voelt.", placeholder: "Bijv. een rustige omgeving zonder te veel prikkels, en fijne muziek om naar te luisteren" },
        annoying: { title: "VERVELEND IS", q: "Wat vindt hij/zij juist vervelend?", hint: "Dingen om te vermijden, zodat een gesprek prettig blijft.", placeholder: "Bijv. ruzie maken, drukke mensen en veel prikkels" },
        work: { title: "WERK", q: "Wat voor werk heeft hij/zij gedaan?", hint: "Beroep(en) en loopbaan.", placeholder: "Bijv. docent muziek, geschiedenis en economie op een middelbare school" },
        education: { title: "OPLEIDINGEN", q: "Welke opleidingen of scholen?", hint: "Studies en opleidingen.", placeholder: "Bijv. Universiteit Nijmegen, Conservatorium Arnhem" },
        living: { title: "WONEN", q: "Waar woont hij/zij?", hint: "Adres of plaats.", placeholder: "Bijv. Krayenhofflaan 46, Nijmegen" }
      }
    },

    en: {
      htmlTitle: "TalkCard — a conversation card for your loved one",
      brand_sub: "A helper card for warm conversations",
      intro_title: "Make a personal TalkCard",
      intro_lead: "An overview card with the most important things about your loved one, so carers, family and visitors can more easily have a warm, meaningful conversation with someone living with dementia or Alzheimer's.",
      tribute: "Built in tribute to my uncle Will",
      feedback: "If you have feedback to improve this for others, please email me at {email}.",
      intro_s1_t: "Answer a few questions",
      intro_s1_d: "Name, partner, children, hobbies, work… Just skip any question that doesn't fit.",
      intro_s2_t: "Add a photo",
      intro_s2_d: "A clear, cheerful photo of your loved one.",
      intro_s3_t: "Download & print the card",
      intro_s3_d: "You'll get a high-resolution card you can print or share.",
      start: "Get started",
      resume_text: "We saved your earlier answers.",
      resume_link: "Start over",
      step_word: "Step",
      back: "Back", skip: "Skip", next: "Next", viewcard: "View card",
      example_label: "Example:",
      date_shows_as: "Shown on the card as:",
      autosave: "Your answers are saved automatically on this device (and nowhere else).",
      photo_click: "Click to choose a photo",
      photo_drag: "or drag a photo here — JPG or PNG",
      photo_remove: "Remove photo",
      photo_invalid: "Please choose an image (JPG or PNG).",
      custom_add: "+ Add topic",
      custom_title_ph: "Heading (e.g. PET)",
      custom_text_ph: "Text to show on the card",
      custom_remove: "Remove",
      custom_empty: "No topics of your own yet. Click ‘Add topic’.",
      prev_title: "Your TalkCard",
      edit: "Edit", print: "Print", download: "Download as image",
      prev_hint: "Tip: use <b>Download as image</b> for a sharp, high-resolution version (larger than your screen). Or use <b>Print</b> to save as PDF.",
      reorder_title: "Order of the cards",
      reorder_hint: "Drag the cards on the sheet to change the order.",
      reorder_list_label: "Prefer a list? (handy on a tablet)",
      reorder_up: "Up", reorder_down: "Down",
      busy: "Working…",
      export_fail: "The download didn't start automatically. Use the ‘Print’ button and choose ‘Save as PDF’, or take a screenshot of the card.",
      sheet_title: "ABOUT {name} in brief",
      sheet_title_noname: "this person",
      placeholder_name: "Name",
      foot: "<b>TalkCard</b> — a tool for warm, meaningful conversations.",
      qr_caption: "Scan to make your own TalkCard",
      steps: {
        name: { q: "Who is this card for?", hint: "The name of your loved one. It appears large next to the photo.", placeholder: "e.g. Will", example: "Will" },
        birth: { q: "Date of birth", hint: "Pick the date of birth from the calendar." },
        photo: { q: "Add a photo", hint: "A clear, cheerful photo of the face works best." },
        custom: { q: "Add your own topics", hint: "Missing something? Add your own question and answer. These appear as extra bubbles on the card." },
        born: { title: "BORN", q: "Where and into what kind of family were they born?", hint: "Place of birth, the family, the background.", placeholder: "…in Oostrum near Venray. The second son in a Catholic family of 8 children." },
        partner: { title: "PARTNER", q: "Who is the partner?", hint: "The name of the partner or loved one.", placeholder: "e.g. Annelies" },
        children: { title: "CHILDREN", q: "What are the children's names?", hint: "The names of the children.", placeholder: "e.g. Sanne, Tom and Lisa" },
        siblings: { title: "SIBLINGS", q: "Brothers and sisters?", hint: "Names of brothers and sisters.", placeholder: "e.g. Jan, Marie and Theo" },
        visitors: { title: "VISITORS", q: "Who comes to visit?", hint: "Family and friends who drop by — helpful to be able to name them.", placeholder: "e.g. Annelies, Hubertine and Jeroen, Richard and Karin, and my friends" },
        enjoys: { title: "I ENJOY…", q: "What do they enjoy?", hint: "Things that bring calm, joy or a smile.", placeholder: "e.g. listening to and making music, walking, cycling and good food" },
        hobbies: { title: "HOBBIES", q: "What are the hobbies?", hint: "Activities and interests.", placeholder: "e.g. making music, walking, cycling, mountain biking" },
        highlights: { title: "HIGHLIGHTS", q: "What are the highlights of their life?", hint: "Lovely moments, proud moments, special events.", placeholder: "e.g. marrying Annelies, the many travels and publishing a music book" },
        important: { title: "WHAT MATTERS TO ME", q: "What is important to them?", hint: "What helps someone feel at ease.", placeholder: "e.g. a calm environment without too many stimuli, and nice music to listen to" },
        annoying: { title: "WHAT I DISLIKE", q: "What do they find unpleasant?", hint: "Things to avoid, to keep a conversation pleasant.", placeholder: "e.g. arguments, busy people and too many stimuli" },
        work: { title: "WORK", q: "What work did they do?", hint: "Profession(s) and career.", placeholder: "e.g. teacher of music, history and economics at a secondary school" },
        education: { title: "EDUCATION", q: "Which studies or schools?", hint: "Studies and education.", placeholder: "e.g. Radboud University Nijmegen, Conservatory of Arnhem" },
        living: { title: "LIVES AT", q: "Where do they live?", hint: "Address or town.", placeholder: "e.g. Krayenhofflaan 46, Nijmegen" }
      }
    },

    de: {
      htmlTitle: "TalkCard — eine Gesprächskarte für einen lieben Menschen",
      brand_sub: "Eine Hilfekarte für schöne Gespräche",
      intro_title: "Erstellen Sie eine persönliche TalkCard",
      intro_lead: "Eine Übersichtskarte mit den wichtigsten Dingen über Ihren lieben Menschen, damit Pflegende, Familie und Besucher leichter ein schönes, bedeutungsvolles Gespräch mit jemandem mit Demenz oder Alzheimer führen können.",
      tribute: "Erstellt als Hommage an meinen Onkel Will",
      feedback: "Haben Sie Anregungen, um dies für andere zu verbessern? Schreiben Sie mir an {email}.",
      intro_s1_t: "Beantworten Sie ein paar Fragen",
      intro_s1_d: "Name, Partner, Kinder, Hobbys, Beruf… Fragen, die nicht passen, überspringen Sie einfach.",
      intro_s2_t: "Fügen Sie ein Foto hinzu",
      intro_s2_d: "Ein klares, fröhliches Foto Ihres lieben Menschen.",
      intro_s3_t: "Karte herunterladen & drucken",
      intro_s3_d: "Sie erhalten eine Karte in hoher Auflösung zum Drucken oder Teilen.",
      start: "Loslegen",
      resume_text: "Wir haben Ihre früheren Antworten gespeichert.",
      resume_link: "Neu beginnen",
      step_word: "Schritt",
      back: "Zurück", skip: "Überspringen", next: "Weiter", viewcard: "Karte ansehen",
      example_label: "Beispiel:",
      date_shows_as: "Wird auf der Karte angezeigt als:",
      autosave: "Ihre Antworten werden automatisch auf diesem Gerät gespeichert (und nirgendwo sonst).",
      photo_click: "Klicken, um ein Foto zu wählen",
      photo_drag: "oder ziehen Sie ein Foto hierher — JPG oder PNG",
      photo_remove: "Foto entfernen",
      photo_invalid: "Bitte wählen Sie ein Bild (JPG oder PNG).",
      custom_add: "+ Thema hinzufügen",
      custom_title_ph: "Überschrift (z. B. HAUSTIER)",
      custom_text_ph: "Text für die Karte",
      custom_remove: "Entfernen",
      custom_empty: "Noch keine eigenen Themen. Klicken Sie auf ‚Thema hinzufügen‘.",
      prev_title: "Ihre TalkCard",
      edit: "Bearbeiten", print: "Drucken", download: "Als Bild herunterladen",
      prev_hint: "Tipp: Nutzen Sie <b>Als Bild herunterladen</b> für eine scharfe Version in hoher Auflösung (größer als Ihr Bildschirm). Oder <b>Drucken</b>, um als PDF zu speichern.",
      reorder_title: "Reihenfolge der Kärtchen",
      reorder_hint: "Ziehen Sie die Kärtchen auf der Karte, um die Reihenfolge zu ändern.",
      reorder_list_label: "Lieber eine Liste? (praktisch am Tablet)",
      reorder_up: "Nach oben", reorder_down: "Nach unten",
      busy: "Wird erstellt…",
      export_fail: "Der Download startete nicht automatisch. Nutzen Sie ‚Drucken‘ und wählen Sie ‚Als PDF speichern‘, oder machen Sie einen Screenshot der Karte.",
      sheet_title: "ÜBER {name} in Kürze",
      sheet_title_noname: "diese Person",
      placeholder_name: "Name",
      foot: "<b>TalkCard</b> — ein Hilfsmittel für schöne, bedeutungsvolle Gespräche.",
      qr_caption: "Scannen, um selbst eine TalkCard zu erstellen",
      steps: {
        name: { q: "Für wen ist diese Karte?", hint: "Der Name Ihres lieben Menschen. Er erscheint groß neben dem Foto.", placeholder: "z. B. Will", example: "Will" },
        birth: { q: "Geburtsdatum", hint: "Wählen Sie das Geburtsdatum im Kalender." },
        photo: { q: "Foto hinzufügen", hint: "Ein klares, fröhliches Foto des Gesichts wirkt am besten." },
        custom: { q: "Eigene Themen hinzufügen", hint: "Fehlt etwas? Fügen Sie Ihre eigene Frage und Antwort hinzu. Diese erscheinen als zusätzliche Sprechblasen auf der Karte." },
        born: { title: "GEBOREN", q: "Wo und in welcher Familie wurde er/sie geboren?", hint: "Geburtsort, Familie, Herkunft.", placeholder: "…in Oostrum bei Venray. Der zweite Sohn in einer katholischen Familie mit 8 Kindern." },
        partner: { title: "PARTNER", q: "Wer ist der Partner / die Partnerin?", hint: "Der Name des Partners oder der geliebten Person.", placeholder: "z. B. Annelies" },
        children: { title: "KINDER", q: "Wie heißen die Kinder?", hint: "Die Namen der Kinder.", placeholder: "z. B. Sanne, Tom und Lisa" },
        siblings: { title: "GESCHWISTER", q: "Brüder und Schwestern?", hint: "Namen der Geschwister.", placeholder: "z. B. Jan, Marie und Theo" },
        visitors: { title: "BESUCHER", q: "Wer kommt zu Besuch?", hint: "Familie und Freunde, die vorbeikommen — schön, sie beim Namen zu nennen.", placeholder: "z. B. Annelies, Hubertine und Jeroen, Richard und Karin, und meine Freunde" },
        enjoys: { title: "ICH GENIESSE…", q: "Was genießt er/sie?", hint: "Dinge, die Ruhe, Freude oder ein Lächeln schenken.", placeholder: "z. B. Musik hören und zusammen musizieren, spazieren, Rad fahren und gutes Essen" },
        hobbies: { title: "HOBBYS", q: "Was sind die Hobbys?", hint: "Beschäftigungen und Interessen.", placeholder: "z. B. musizieren, wandern, Rad fahren, Mountainbiken" },
        highlights: { title: "HÖHEPUNKTE", q: "Was sind die Höhepunkte im Leben?", hint: "Schöne Momente, stolze Momente, besondere Ereignisse.", placeholder: "z. B. die Hochzeit mit Annelies, die vielen Reisen und ein eigenes Musikbuch" },
        important: { title: "WAS MIR WICHTIG IST", q: "Was ist ihm/ihr wichtig?", hint: "Was jemandem ein gutes Gefühl gibt.", placeholder: "z. B. eine ruhige Umgebung ohne zu viele Reize und schöne Musik zum Zuhören" },
        annoying: { title: "WAS MICH STÖRT", q: "Was findet er/sie unangenehm?", hint: "Dinge, die man vermeiden sollte, damit ein Gespräch angenehm bleibt.", placeholder: "z. B. Streit, hektische Menschen und zu viele Reize" },
        work: { title: "ARBEIT", q: "Welchen Beruf hatte er/sie?", hint: "Beruf(e) und Werdegang.", placeholder: "z. B. Lehrer für Musik, Geschichte und Wirtschaft an einer weiterführenden Schule" },
        education: { title: "AUSBILDUNG", q: "Welche Ausbildungen oder Schulen?", hint: "Studium und Ausbildung.", placeholder: "z. B. Universität Nijmegen, Konservatorium Arnheim" },
        living: { title: "WOHNORT", q: "Wo wohnt er/sie?", hint: "Adresse oder Ort.", placeholder: "z. B. Krayenhofflaan 46, Nijmegen" }
      }
    },

    fr: {
      htmlTitle: "TalkCard — une carte de conversation pour un proche",
      brand_sub: "Une carte d'aide pour de belles conversations",
      intro_title: "Créez une TalkCard personnelle",
      intro_lead: "Une carte de synthèse reprenant l'essentiel sur votre proche, pour que les aidants, la famille et les visiteurs puissent plus facilement avoir une conversation chaleureuse et riche de sens avec une personne atteinte de démence ou d'Alzheimer.",
      tribute: "Créé en hommage à mon oncle Will",
      feedback: "Vous avez des suggestions pour l'améliorer pour d'autres ? Écrivez-moi à {email}.",
      intro_s1_t: "Répondez à quelques questions",
      intro_s1_d: "Nom, partenaire, enfants, loisirs, travail… Passez simplement les questions qui ne conviennent pas.",
      intro_s2_t: "Ajoutez une photo",
      intro_s2_d: "Une photo nette et souriante de votre proche.",
      intro_s3_t: "Téléchargez & imprimez la carte",
      intro_s3_d: "Vous obtenez une carte en haute résolution à imprimer ou à partager.",
      start: "Commencer",
      resume_text: "Nous avons enregistré vos réponses précédentes.",
      resume_link: "Recommencer",
      step_word: "Étape",
      back: "Précédent", skip: "Passer", next: "Suivant", viewcard: "Voir la carte",
      example_label: "Exemple :",
      date_shows_as: "Affiché sur la fiche comme :",
      autosave: "Vos réponses sont enregistrées automatiquement sur cet appareil (et nulle part ailleurs).",
      photo_click: "Cliquez pour choisir une photo",
      photo_drag: "ou glissez une photo ici — JPG ou PNG",
      photo_remove: "Supprimer la photo",
      photo_invalid: "Veuillez choisir une image (JPG ou PNG).",
      custom_add: "+ Ajouter un sujet",
      custom_title_ph: "Titre (p. ex. ANIMAL)",
      custom_text_ph: "Texte à afficher sur la carte",
      custom_remove: "Supprimer",
      custom_empty: "Pas encore de sujets personnels. Cliquez sur « Ajouter un sujet ».",
      prev_title: "Votre TalkCard",
      edit: "Modifier", print: "Imprimer", download: "Télécharger en image",
      prev_hint: "Astuce : utilisez <b>Télécharger en image</b> pour une version nette en haute résolution (plus grande que votre écran). Ou <b>Imprimer</b> pour enregistrer en PDF.",
      reorder_title: "Ordre des cartes",
      reorder_hint: "Faites glisser les cartes sur la fiche pour changer l'ordre.",
      reorder_list_label: "Préférez une liste ? (pratique sur tablette)",
      reorder_up: "Monter", reorder_down: "Descendre",
      busy: "En cours…",
      export_fail: "Le téléchargement ne s'est pas lancé automatiquement. Utilisez « Imprimer » puis « Enregistrer en PDF », ou faites une capture d'écran de la carte.",
      sheet_title: "À PROPOS DE {name} en bref",
      sheet_title_noname: "cette personne",
      placeholder_name: "Nom",
      foot: "<b>TalkCard</b> — un outil pour des échanges chaleureux et riches de sens.",
      qr_caption: "Scannez pour créer votre propre TalkCard",
      steps: {
        name: { q: "Pour qui créez-vous cette carte ?", hint: "Le nom de votre proche. Il apparaît en grand à côté de la photo.", placeholder: "p. ex. Will", example: "Will" },
        birth: { q: "Date de naissance", hint: "Choisissez la date de naissance dans le calendrier." },
        photo: { q: "Ajouter une photo", hint: "Une photo nette et souriante du visage fonctionne le mieux." },
        custom: { q: "Ajouter vos propres sujets", hint: "Il manque quelque chose ? Ajoutez votre propre question et réponse. Elles apparaîtront comme des bulles supplémentaires sur la carte." },
        born: { title: "NAISSANCE", q: "Où et dans quelle famille est-il/elle né(e) ?", hint: "Lieu de naissance, la famille, les origines.", placeholder: "…à Oostrum près de Venray. Le deuxième fils d'une famille catholique de 8 enfants." },
        partner: { title: "PARTENAIRE", q: "Qui est le/la partenaire ?", hint: "Le nom du/de la partenaire ou de l'être cher.", placeholder: "p. ex. Annelies" },
        children: { title: "ENFANTS", q: "Comment s'appellent les enfants ?", hint: "Les prénoms des enfants.", placeholder: "p. ex. Sanne, Tom et Lisa" },
        siblings: { title: "FRÈRES & SŒURS", q: "Frères et sœurs ?", hint: "Prénoms des frères et sœurs.", placeholder: "p. ex. Jan, Marie et Theo" },
        visitors: { title: "VISITEURS", q: "Qui vient lui rendre visite ?", hint: "La famille et les amis qui passent — utile de pouvoir les nommer.", placeholder: "p. ex. Annelies, Hubertine et Jeroen, Richard et Karin, et mes amis" },
        enjoys: { title: "J'AIME…", q: "Qu'est-ce qu'il/elle aime ?", hint: "Ce qui apporte du calme, de la joie ou un sourire.", placeholder: "p. ex. écouter et faire de la musique, marcher, faire du vélo et bien manger" },
        hobbies: { title: "LOISIRS", q: "Quels sont les loisirs ?", hint: "Activités et centres d'intérêt.", placeholder: "p. ex. faire de la musique, marcher, faire du vélo, du VTT" },
        highlights: { title: "MOMENTS FORTS", q: "Quels sont les moments forts de sa vie ?", hint: "Beaux moments, fiertés, événements particuliers.", placeholder: "p. ex. son mariage avec Annelies, ses nombreux voyages et la publication d'un livre de musique" },
        important: { title: "CE QUI COMPTE POUR MOI", q: "Qu'est-ce qui est important pour lui/elle ?", hint: "Ce qui aide à se sentir à l'aise.", placeholder: "p. ex. un environnement calme sans trop de stimuli, et une belle musique à écouter" },
        annoying: { title: "CE QUI ME DÉRANGE", q: "Qu'est-ce qu'il/elle trouve désagréable ?", hint: "Les choses à éviter, pour que la conversation reste agréable.", placeholder: "p. ex. les disputes, les gens agités et trop de stimuli" },
        work: { title: "TRAVAIL", q: "Quel métier a-t-il/elle exercé ?", hint: "Profession(s) et parcours.", placeholder: "p. ex. professeur de musique, d'histoire et d'économie au lycée" },
        education: { title: "FORMATION", q: "Quelles études ou écoles ?", hint: "Études et formation.", placeholder: "p. ex. Université de Nimègue, Conservatoire d'Arnhem" },
        living: { title: "DOMICILE", q: "Où habite-t-il/elle ?", hint: "Adresse ou ville.", placeholder: "p. ex. Krayenhofflaan 46, Nijmegen" }
      }
    }
  };

  /* ---------- state ---------- */
  var state = { lang: null, answers: {}, custom: [], photo: null, step: 0, order: [] };
  // Ultimate fallback when the browser's languages don't match any we support.
  var DEFAULT_LANG = "nl";

  function t(key) {
    var L = I18N[state.lang] || I18N.nl;
    return (key in L) ? L[key] : (I18N.nl[key] != null ? I18N.nl[key] : key);
  }
  function ts(id) {
    var L = I18N[state.lang] || I18N.nl;
    return (L.steps && L.steps[id]) || I18N.nl.steps[id] || {};
  }

  function load() {
    var storedLang = null;
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var d = JSON.parse(raw);
        if (d && typeof d === "object") {
          state.answers = d.answers || {};
          state.custom = Array.isArray(d.custom) ? d.custom : [];
          state.order = Array.isArray(d.order) ? d.order : [];
          state.photo = d.photo || null;
          if (LANGS.indexOf(d.lang) >= 0) storedLang = d.lang;
        }
      }
    } catch (e) { /* ignore corrupt storage */ }
    // A previously-saved choice wins; otherwise pick from the browser.
    state.lang = storedLang || detectLang();
  }
  // Pick the first browser-preferred language we support. navigator.languages is
  // the client-side equivalent of the Accept-Language header (same preference
  // list, in order); we also fall back to the older single-value properties.
  function detectLang() {
    var prefs = [];
    if (navigator.languages && navigator.languages.length) prefs = prefs.concat(navigator.languages);
    if (navigator.language) prefs.push(navigator.language);
    if (navigator.userLanguage) prefs.push(navigator.userLanguage); // legacy IE/Edge
    for (var i = 0; i < prefs.length; i++) {
      var code = String(prefs[i] || "").slice(0, 2).toLowerCase();
      if (LANGS.indexOf(code) >= 0) return code;
    }
    return DEFAULT_LANG;
  }
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        lang: state.lang, answers: state.answers, custom: state.custom, photo: state.photo, order: state.order
      }));
    } catch (e) { /* storage full / unavailable — non fatal */ }
  }
  function clearAll() {
    var lang = state.lang;
    state = { lang: lang, answers: {}, custom: [], photo: null, step: 0, order: [] };
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    save();
  }

  function hasAnyAnswers() {
    if (state.photo) return true;
    if (state.custom.some(function (c) { return (c.title && c.title.trim()) || (c.text && c.text.trim()); })) return true;
    return Object.keys(state.answers).some(function (k) {
      return state.answers[k] && String(state.answers[k]).trim();
    });
  }

  /* ---------- tiny helpers ---------- */
  function $(sel) { return document.querySelector(sel); }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function multiline(s) { return esc(s).replace(/\r?\n/g, "<br>"); }
  function slug(s) {
    var out = String(s || "kaart").toLowerCase();
    try { out = out.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch (e) {}
    out = out.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return out || "kaart";
  }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }
  var DATE_LOCALE = { nl: "nl", en: "en-GB", de: "de", fr: "fr" };
  // ISO "1953-07-08" -> localised long date ("8 juli 1953"); anything else
  // (e.g. legacy free-text) is returned unchanged.
  function formatBirth(v) {
    v = String(v || "").trim();
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    if (!m) return v;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);   // local, avoids UTC off-by-one
    if (isNaN(d.getTime())) return v;
    try {
      return new Intl.DateTimeFormat(DATE_LOCALE[state.lang] || "nl",
        { day: "numeric", month: "long", year: "numeric" }).format(d);
    } catch (e) { return v; }
  }
  function initials(name) {
    var parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    var s = parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "");
    return s.toUpperCase();
  }

  /* ---------- apply language to static chrome ---------- */
  function applyLang() {
    document.documentElement.setAttribute("lang", state.lang);
    document.title = t("htmlTitle");
    var selEl = document.getElementById("lang-select");
    if (selEl) selEl.value = state.lang;
    document.querySelectorAll("[data-i18n]").forEach(function (node) {
      node.textContent = t(node.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (node) {
      node.innerHTML = t(node.getAttribute("data-i18n-html"));
    });
    renderFeedback();
  }

  /* Fill [data-feedback] elements with the translated invite. The address is
     assembled here (never written whole in the HTML/source) to deter scrapers. */
  function renderFeedback() {
    var nodes = document.querySelectorAll("[data-feedback]");
    if (!nodes.length) return;
    var addr = ["r.derks88", "gmail.com"].join("@");
    var link = '<a href="mailto:' + addr + '?subject=TalkCard">' + addr + "</a>";
    nodes.forEach(function (n) {
      n.innerHTML = esc(t("feedback")).replace("{email}", function () { return link; });
    });
  }

  /* ---------- screen switching ---------- */
  function activeScreen() {
    if (document.getElementById("screen-preview").classList.contains("is-active")) return "preview";
    if (document.getElementById("screen-wizard").classList.contains("is-active")) return "wizard";
    return "intro";
  }
  function show(screenId) {
    ["screen-intro", "screen-wizard", "screen-preview"].forEach(function (id) {
      document.getElementById(id).classList.toggle("is-active", id === screenId);
    });
    window.scrollTo(0, 0);
  }

  /* =========================================================
     WIZARD
     ========================================================= */
  var qcard, progFill, progLabel, progCount, btnBack, btnSkip, btnNext;

  function currentStep() { return STEP_DEFS[state.step]; }

  function renderStep() {
    var s = currentStep();
    var st = ts(s.id);
    var total = STEP_DEFS.length;
    progLabel.textContent = t("step_word") + " " + (state.step + 1);
    progCount.textContent = (state.step + 1) + " / " + total;
    progFill.style.width = (state.step / total * 100) + "%";

    var html = "<h2>" + esc(st.q) + "</h2>";
    if (st.hint) html += '<p class="hint">' + esc(st.hint) + "</p>";

    var val = (s.kind === "photo" || s.kind === "custom") ? "" : (state.answers[s.id] || "");
    if (s.kind === "photo") {
      html += renderPhotoField();
    } else if (s.kind === "custom") {
      html += renderCustomField();
    } else if (s.kind === "date") {
      var isoVal = /^\d{4}-\d{2}-\d{2}$/.test(val) ? val : "";
      html += '<div class="field"><input type="date" id="answer" value="' + esc(isoVal) + '" min="1900-01-01" max="' + esc(todayISO()) + '">';
      html += '<div class="ex" id="date-preview">' + (isoVal ? esc(t("date_shows_as")) + " <b>" + esc(formatBirth(isoVal)) + "</b>" : "") + "</div>";
      html += "</div>";
    } else if (s.kind === "textarea") {
      html += '<div class="field"><textarea id="answer" placeholder="' + esc(st.placeholder || "") + '">' + esc(val) + "</textarea>";
      if (st.example) html += '<div class="ex"><b>' + esc(t("example_label")) + '</b> ' + esc(st.example) + "</div>";
      html += "</div>";
    } else {
      html += '<div class="field"><input type="text" id="answer" placeholder="' + esc(st.placeholder || "") + '" value="' + esc(val) + '">';
      if (st.example) html += '<div class="ex"><b>' + esc(t("example_label")) + '</b> ' + esc(st.example) + "</div>";
      html += "</div>";
    }
    qcard.innerHTML = html;

    btnBack.textContent = t("back");
    btnSkip.textContent = t("skip");
    btnBack.style.visibility = state.step === 0 ? "hidden" : "visible";
    btnNext.textContent = state.step === STEP_DEFS.length - 1 ? t("viewcard") : t("next");

    if (s.kind === "photo") {
      wirePhotoField();
    } else if (s.kind === "custom") {
      wireCustomField();
    } else {
      var input = document.getElementById("answer");
      if (input) {
        input.focus();
        input.addEventListener("input", function () {
          state.answers[s.id] = input.value; save();
          if (s.kind === "date") {
            var pv = document.getElementById("date-preview");
            if (pv) pv.innerHTML = input.value ? esc(t("date_shows_as")) + " <b>" + esc(formatBirth(input.value)) + "</b>" : "";
          }
        });
        input.addEventListener("keydown", function (e) {
          if (s.kind === "text" && e.key === "Enter") { e.preventDefault(); goNext(); }
        });
      }
    }
  }

  function captureCurrent() {
    var s = currentStep();
    if (s.kind === "photo") return;
    if (s.kind === "custom") { captureCustom(); return; }
    var input = document.getElementById("answer");
    if (input) { state.answers[s.id] = input.value; save(); }
  }

  function goNext() {
    captureCurrent();
    if (state.step < STEP_DEFS.length - 1) { state.step++; renderStep(); }
    else gotoPreview();
  }
  function goBack() {
    captureCurrent();
    if (state.step > 0) { state.step--; renderStep(); }
  }
  function goSkip() {
    var s = currentStep();
    if (s.kind === "photo") state.photo = null;
    else if (s.kind === "custom") state.custom = [];
    else state.answers[s.id] = "";
    save();
    if (state.step < STEP_DEFS.length - 1) { state.step++; renderStep(); }
    else gotoPreview();
  }

  /* ---------- photo field ---------- */
  function renderPhotoField() {
    var h = '<div class="uploader" id="uploader">' +
      '<div class="uploader__icon">📷</div>' +
      "<div><b>" + esc(t("photo_click")) + "</b></div>" +
      '<div class="uploader__hint">' + esc(t("photo_drag")) + "</div>" +
      '<input type="file" id="file" accept="image/*" style="display:none">' +
      "</div>";
    h += '<div id="photo-preview-wrap">' + (state.photo ? photoPreviewHTML() : "") + "</div>";
    return h;
  }
  function photoPreviewHTML() {
    return '<div class="photo-preview"><img src="' + esc(state.photo) + '" alt="">' +
      '<button class="btn btn--ghost" id="btn-remove-photo" type="button">' + esc(t("photo_remove")) + "</button></div>";
  }
  function wirePhotoField() {
    var uploader = document.getElementById("uploader");
    var file = document.getElementById("file");
    var wrap = document.getElementById("photo-preview-wrap");

    uploader.addEventListener("click", function () { file.click(); });
    file.addEventListener("change", function () {
      if (file.files && file.files[0]) handlePhoto(file.files[0]);
    });
    ["dragenter", "dragover"].forEach(function (ev) {
      uploader.addEventListener(ev, function (e) { e.preventDefault(); uploader.classList.add("is-drag"); });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      uploader.addEventListener(ev, function (e) { e.preventDefault(); uploader.classList.remove("is-drag"); });
    });
    uploader.addEventListener("drop", function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) handlePhoto(f);
    });

    function bindRemove() {
      var rm = document.getElementById("btn-remove-photo");
      if (rm) rm.addEventListener("click", function () { state.photo = null; save(); wrap.innerHTML = ""; });
    }
    bindRemove();

    function handlePhoto(f) {
      if (!/^image\//.test(f.type)) { alert(t("photo_invalid")); return; }
      downscaleImage(f, 1000, function (dataUrl) {
        state.photo = dataUrl; save();
        wrap.innerHTML = photoPreviewHTML();
        bindRemove();
      });
    }
  }

  function downscaleImage(file, maxSide, cb) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight;
        var scale = Math.min(1, maxSide / Math.max(w, h));
        var cw = Math.round(w * scale), ch = Math.round(h * scale);
        var c = document.createElement("canvas");
        c.width = cw; c.height = ch;
        c.getContext("2d").drawImage(img, 0, 0, cw, ch);
        var out;
        try { out = c.toDataURL("image/jpeg", 0.85); } catch (e) { out = reader.result; }
        cb(out);
      };
      img.onerror = function () { cb(reader.result); };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /* ---------- custom (free) fields ---------- */
  function renderCustomField() {
    var rows = state.custom.map(function (c, i) { return customRowHTML(c, i); }).join("");
    var emptyStyle = state.custom.length ? ' style="display:none"' : "";
    return '<div id="custom-list">' + rows + "</div>" +
      '<p class="ex" id="custom-empty"' + emptyStyle + ">" + esc(t("custom_empty")) + "</p>" +
      '<button type="button" class="btn btn--subtle" id="btn-add-custom">' + esc(t("custom_add")) + "</button>";
  }
  function customRowHTML(c, i) {
    return '<div class="custom-row" data-i="' + i + '">' +
      '<input type="text" class="cf-title" placeholder="' + esc(t("custom_title_ph")) + '" value="' + esc(c.title || "") + '">' +
      '<textarea class="cf-text" placeholder="' + esc(t("custom_text_ph")) + '">' + esc(c.text || "") + "</textarea>" +
      '<div class="custom-row__foot"><button type="button" class="btn btn--ghost cf-remove">' + esc(t("custom_remove")) + "</button></div>" +
      "</div>";
  }
  function captureCustom() {
    var rows = document.querySelectorAll("#custom-list .custom-row");
    var arr = [];
    rows.forEach(function (row) {
      arr.push({
        title: row.querySelector(".cf-title").value,
        text: row.querySelector(".cf-text").value
      });
    });
    state.custom = arr;
    save();
  }
  function wireCustomField() {
    var list = document.getElementById("custom-list");
    var addBtn = document.getElementById("btn-add-custom");

    list.addEventListener("input", function (e) {
      if (e.target.classList.contains("cf-title") || e.target.classList.contains("cf-text")) {
        captureCustom();
      }
    });
    list.addEventListener("click", function (e) {
      var rm = e.target.closest(".cf-remove");
      if (!rm) return;
      var row = rm.closest(".custom-row");
      var idx = parseInt(row.getAttribute("data-i"), 10);
      captureCustom();
      state.custom.splice(idx, 1);
      save();
      renderStep();
    });
    addBtn.addEventListener("click", function () {
      captureCustom();
      state.custom.push({ title: "", text: "" });
      save();
      renderStep();
      var titles = document.querySelectorAll("#custom-list .cf-title");
      if (titles.length) titles[titles.length - 1].focus();
    });
  }

  /* =========================================================
     QR CODE -> data URL (offline, no external request)
     ========================================================= */
  function makeQRDataURL(text, pixels) {
    if (typeof qrcode === "undefined") return null;
    try {
      var qr = qrcode(0, "M");
      qr.addData(text);
      qr.make();
      var count = qr.getModuleCount();
      var quiet = 4;
      var total = count + quiet * 2;
      var cell = Math.max(1, Math.floor(pixels / total));
      var dim = cell * total;
      var c = document.createElement("canvas");
      c.width = dim; c.height = dim;
      var ctx = c.getContext("2d");
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, dim, dim);
      ctx.fillStyle = "#222a33";
      for (var r = 0; r < count; r++) {
        for (var col = 0; col < count; col++) {
          if (qr.isDark(r, col)) ctx.fillRect((col + quiet) * cell, (r + quiet) * cell, cell, cell);
        }
      }
      return c.toDataURL("image/png");
    } catch (e) { return null; }
  }

  /* =========================================================
     CARD ORDER (predefined + custom), honouring the user's drag order
     ========================================================= */
  function activeCards() {
    var cards = [];
    BUBBLE_ORDER.forEach(function (id) {
      var text = (state.answers[id] || "").trim();
      if (text) cards.push({ key: id, title: ts(id).title, text: text });
    });
    state.custom.forEach(function (c, i) {
      var text = (c.text || "").trim();
      if (text) cards.push({ key: "custom:" + i, title: (c.title || "").trim(), text: text });
    });
    return cards;
  }
  // Returns the active cards ordered by state.order; reconciles state.order so
  // it always reflects exactly the currently-active cards (new ones appended).
  function orderedCards() {
    var cards = activeCards();
    var byKey = {};
    cards.forEach(function (c) { byKey[c.key] = c; });
    var result = [];
    (state.order || []).forEach(function (k) {
      if (byKey[k]) { result.push(byKey[k]); delete byKey[k]; }
    });
    cards.forEach(function (c) { if (byKey[c.key]) result.push(c); });
    state.order = result.map(function (c) { return c.key; });
    return result;
  }
  function snippet(s, n) {
    s = String(s || "").replace(/\s+/g, " ").trim();
    n = n || 26;
    return s.length > n ? s.slice(0, n).replace(/\s\S*$/, "") + "…" : s;
  }

  /* =========================================================
     BUILD THE POSTER
     ========================================================= */
  function buildSheet() {
    var name = (state.answers.name || "").trim();
    var birth = (state.answers.birth || "").trim();
    var firstName = name ? name.split(/\s+/)[0] : t("placeholder_name");
    var nameForTitle = name || t("sheet_title_noname");

    var sheet = el("div", "sheet");

    // header: title with the name emphasised (page number omitted, per the design)
    var head = el("div", "sheet__head");
    var titleHTML = esc(t("sheet_title")).replace("{name}", function () { return "<b>" + esc(nameForTitle) + "</b>"; });
    head.appendChild(el("div", "sheet__title", titleHTML));
    sheet.appendChild(head);

    // person hero: big first name + date + framed photo (or initials)
    var person = el("div", "person");
    person.appendChild(el("h1", "person__name", esc(firstName)));
    var birthDisplay = formatBirth(birth);
    if (birthDisplay) person.appendChild(el("div", "person__date", esc(birthDisplay)));
    var frame = el("div", "person__frame");
    if (state.photo) {
      var img = el("img", "person__photo");
      img.src = state.photo; img.alt = firstName;
      frame.appendChild(img);
    } else {
      frame.appendChild(el("div", "person__photo--placeholder", esc(initials(name))));
    }
    person.appendChild(frame);
    sheet.appendChild(person);

    // bubbles (predefined + custom), in the user-chosen order, one masonry container
    var bubbles = orderedCards();

    var stageEl = el("div", "sheet__stage");
    stageEl.innerHTML = bubbles.map(function (b) {
      var titleHTML = b.title ? '<div class="bubble__title">' + esc(b.title) + "</div>" : "";
      return '<div class="bubble" data-key="' + esc(b.key) + '">' +
        titleHTML + '<div class="bubble__body">' + multiline(b.text) + "</div></div>";
    }).join("");
    sheet.appendChild(stageEl);

    // footer: note (left) + QR (right)
    var footer = el("div", "sheet__footer");
    footer.appendChild(el("div", "sheet__foot", t("foot")));
    var qrWrap = el("div", "sheet__qr");
    qrWrap.appendChild(el("span", "cap", t("qr_caption")));
    var qrData = makeQRDataURL(QR_TARGET, 512);
    if (qrData) {
      var qimg = el("img");
      qimg.src = qrData; qimg.alt = "QR";
      qrWrap.appendChild(qimg);
    }
    footer.appendChild(qrWrap);
    sheet.appendChild(footer);

    return sheet;
  }

  /* =========================================================
     PREVIEW
     ========================================================= */
  var stage, stageInner;

  function gotoPreview() {
    showPreview();
    show("screen-preview");
  }
  function showPreview() {
    rebuildSheet();
    renderReorder();
  }
  function rebuildSheet() {
    stageInner.innerHTML = "";
    var sheet = buildSheet();
    stageInner.appendChild(sheet);
    wireSheetDrag(sheet.querySelector(".sheet__stage"));
    requestAnimationFrame(function () { requestAnimationFrame(fitStage); });
    setTimeout(fitStage, 250);
  }

  /* Drag the actual card tiles on the poster to reorder them.
     Pointer-based (not native HTML5 drag) so it works reliably with mouse and
     touch, and despite the preview being CSS-scaled — pointer coordinates and
     elementFromPoint both operate in screen space, so the maths stays correct. */
  function wireSheetDrag(stageEl) {
    if (!stageEl) return;
    var dragEl = null, startX = 0, startY = 0, active = false;
    var THRESHOLD = 6;

    function onMove(e) {
      if (!dragEl) return;
      if (!active) {
        if (Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY) < THRESHOLD) return;
        active = true;
        dragEl.classList.add("dragging");     // fades it + sets pointer-events:none
        document.body.style.userSelect = "none";
      }
      e.preventDefault();
      var under = document.elementFromPoint(e.clientX, e.clientY);
      var target = under && under.closest ? under.closest(".bubble") : null;
      if (!target || target === dragEl || target.parentNode !== stageEl) return;
      var box = target.getBoundingClientRect();
      var before = (e.clientY - box.top) < box.height / 2;
      if (before) { if (target.previousSibling !== dragEl) stageEl.insertBefore(dragEl, target); }
      else { if (target.nextSibling !== dragEl) stageEl.insertBefore(dragEl, target.nextSibling); }
    }
    function onUp() {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      document.body.style.userSelect = "";
      var wasActive = active;
      if (dragEl && active) dragEl.classList.remove("dragging");
      dragEl = null; active = false;
      if (wasActive) {
        state.order = [].map.call(stageEl.querySelectorAll(".bubble"), function (b) { return b.getAttribute("data-key"); });
        save();
        rebuildSheet();   // re-balance masonry cleanly + refit + re-wire the fresh tiles
      }
    }
    stageEl.addEventListener("pointerdown", function (e) {
      if (e.button != null && e.button !== 0) return;   // primary button / touch only
      var b = e.target.closest && e.target.closest(".bubble");
      if (!b || b.parentNode !== stageEl) return;
      dragEl = b; startX = e.clientX; startY = e.clientY; active = false;
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);
    });
  }

  /* A slim hint above the card telling people they can drag the tiles. */
  function renderReorder() {
    var panel = document.getElementById("reorder");
    if (!panel) return;
    if (orderedCards().length < 2) { panel.style.display = "none"; panel.innerHTML = ""; return; }
    panel.style.display = "";
    panel.innerHTML =
      '<span class="reorder__ico" aria-hidden="true">↕</span> ' + esc(t("reorder_hint"));
  }
  function fitStage() {
    var sheet = stageInner.querySelector(".sheet");
    if (!sheet) return;
    sheet.style.transform = "none";
    var w = 1080, h = sheet.offsetHeight;
    var scale = Math.min(1, stage.clientWidth / w);
    sheet.style.transformOrigin = "top left";
    sheet.style.transform = "scale(" + scale + ")";
    stageInner.style.width = (w * scale) + "px";
    stageInner.style.height = (h * scale) + "px";
  }

  /* =========================================================
     Render the poster to a high-res <canvas> (SVG foreignObject -> canvas).
     Both "download" and "print" use this, so what you print is exactly what
     you download — one crisp image, never sliced across page edges.
     ========================================================= */
  function renderSheetToCanvas(onReady, onFail) {
    var live = stageInner.querySelector(".sheet");
    if (!live) { if (onFail) onFail(); return; }
    var w = 1080, h = live.offsetHeight;
    var clone = live.cloneNode(true);
    clone.style.transform = "none";
    clone.style.margin = "0";
    var css = document.getElementById("appcss").textContent;
    var xml = new XMLSerializer().serializeToString(clone);
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '">' +
        '<foreignObject x="0" y="0" width="' + w + '" height="' + h + '">' +
          '<div xmlns="http://www.w3.org/1999/xhtml">' +
            "<style><![CDATA[" + css + "]]></style>" + xml +
          "</div>" +
        "</foreignObject></svg>";
    var scale = 2;
    var url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    var img = new Image();
    img.onload = function () {
      try {
        var canvas = document.createElement("canvas");
        canvas.width = w * scale; canvas.height = h * scale;
        var ctx = canvas.getContext("2d");
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.drawImage(img, 0, 0);
        onReady(canvas);
      } catch (e) { if (onFail) onFail(e); }
    };
    img.onerror = function () { if (onFail) onFail(); };
    img.src = url;
  }

  function exportPNG() {
    var btn = document.getElementById("btn-download");
    btn.textContent = t("busy"); btn.disabled = true;
    function done() { btn.textContent = t("download"); btn.disabled = false; }
    function fail() { done(); alert(t("export_fail")); }
    renderSheetToCanvas(function (canvas) {
      canvas.toBlob(function (blob) {
        if (!blob) { fail(); return; }
        var u = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = u; a.download = "talkcard-" + slug(state.answers.name) + ".png";
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
        done();
      }, "image/png");
    }, fail);
  }

  /* Print the poster as a single image that fits one A4 page (no sliced tiles,
     colours always print). See #print-holder + @media print in the CSS. */
  function printCard() {
    var btn = document.getElementById("btn-print");
    var holder = document.getElementById("print-holder");
    btn.textContent = t("busy"); btn.disabled = true;
    function restore() { btn.textContent = t("print"); btn.disabled = false; }
    function fail() { restore(); alert(t("export_fail")); }
    renderSheetToCanvas(function (canvas) {
      var dataUrl;
      try { dataUrl = canvas.toDataURL("image/png"); } catch (e) { dataUrl = null; }
      if (!dataUrl) { fail(); return; }
      holder.innerHTML = "";
      var pimg = new Image();
      pimg.alt = "";
      pimg.onload = function () {
        restore();
        var cleanup = function () { holder.innerHTML = ""; window.removeEventListener("afterprint", cleanup); };
        window.addEventListener("afterprint", cleanup);
        window.print();
        setTimeout(cleanup, 60000);
      };
      pimg.onerror = function () { fail(); };
      holder.appendChild(pimg);
      pimg.src = dataUrl;
    }, fail);
  }

  /* =========================================================
     HOMEPAGE EXAMPLES — three sample cards (fictional people, AI-generated
     photos of non-existent faces) scattered on the intro to show the result.
     Uses the real .sheet markup/CSS, scaled down, so they always match output.
     ========================================================= */
  var EXAMPLES = [
    { lang: "nl", name: "Willem", date: "12 maart 1948", photo: "example-1.jpg", bubbles: [
      { title: "PARTNER", text: "Greet" },
      { title: "KINDEREN", text: "Bart en Sanne" },
      { title: "IK GENIET VAN…", text: "Voetbal op tv, een borrel op zondag en de kleinkinderen" },
      { title: "WERK", text: "Timmerman, en later klusjesman in het dorp" },
      { title: "HOBBY'S", text: "Tuinieren, kaarten en fietsen" }
    ] },
    { lang: "fr", name: "Jeanne", date: "3 mai 1945", photo: "example-2.jpg", bubbles: [
      { title: "PARTENAIRE", text: "Henri (†2018)" },
      { title: "ENFANTS", text: "Thomas et Julie" },
      { title: "J'AIME…", text: "La musique au piano, le café gourmand et les visites des petits-enfants" },
      { title: "LOISIRS", text: "Le tricot, les mots croisés, s'asseoir au jardin" },
      { title: "DOMICILE", text: "Résidence Les Tilleuls, chambre 7" }
    ] },
    { lang: "en", name: "Eleanor", date: "22 June 1950", photo: "example-3.jpg", bubbles: [
      { title: "PARTNER", text: "George" },
      { title: "CHILDREN", text: "Michael and Claire" },
      { title: "I ENJOY…", text: "Old jazz records, tea in the garden, and painting" },
      { title: "WORK", text: "Primary-school teacher for 30 years" },
      { title: "HOBBIES", text: "Watercolours, crosswords and birdwatching" }
    ] }
  ];

  function buildExampleSheet(ex) {
    var L = I18N[ex.lang] || I18N.nl;
    var sheet = el("div", "sheet sheet--example");
    var head = el("div", "sheet__head");
    head.appendChild(el("div", "sheet__title",
      esc(L.sheet_title).replace("{name}", function () { return "<b>" + esc(ex.name) + "</b>"; })));
    sheet.appendChild(head);
    var person = el("div", "person");
    person.appendChild(el("h1", "person__name", esc(ex.name)));
    if (ex.date) person.appendChild(el("div", "person__date", esc(ex.date)));
    var frame = el("div", "person__frame");
    var img = el("img", "person__photo"); img.src = ex.photo; img.alt = ""; frame.appendChild(img);
    person.appendChild(frame); sheet.appendChild(person);
    var stageEl = el("div", "sheet__stage");
    stageEl.innerHTML = ex.bubbles.map(function (b) {
      return '<div class="bubble"><div class="bubble__title">' + esc(b.title) + "</div>" +
        '<div class="bubble__body">' + esc(b.text) + "</div></div>";
    }).join("");
    sheet.appendChild(stageEl);
    var footer = el("div", "sheet__footer");
    footer.appendChild(el("div", "sheet__foot", L.foot));
    var qrWrap = el("div", "sheet__qr");
    qrWrap.appendChild(el("span", "cap", L.qr_caption));
    var qr = makeQRDataURL(QR_TARGET, 256);
    if (qr) { var qi = el("img"); qi.src = qr; qi.alt = ""; qrWrap.appendChild(qi); }
    footer.appendChild(qrWrap);
    sheet.appendChild(footer);
    return sheet;
  }

  function renderExamples() {
    var host = document.getElementById("hero-examples");
    if (!host) return;
    try {
      host.innerHTML = "";
      EXAMPLES.forEach(function (ex) {
        var wrap = el("div", "example");
        wrap.appendChild(buildExampleSheet(ex));
        host.appendChild(wrap);
      });
      layoutExamples();
      // photos load async and change height -> re-fit when they arrive
      [].forEach.call(host.querySelectorAll("img"), function (im) {
        im.addEventListener("load", layoutExamples);
      });
      setTimeout(layoutExamples, 300);
    } catch (e) { host.innerHTML = ""; }  // never let the examples break the intro
  }

  function layoutExamples() {
    var host = document.getElementById("hero-examples");
    if (!host) return;
    var avail = host.clientWidth || 820;
    var targetW = Math.max(150, Math.min(224, (avail - 70) / 3));
    [].forEach.call(host.querySelectorAll(".example"), function (wrap) {
      var sheet = wrap.querySelector(".sheet");
      if (!sheet) return;
      sheet.style.transform = "none";
      var s = targetW / 1080;
      sheet.style.transformOrigin = "top left";
      sheet.style.transform = "scale(" + s + ")";
      wrap.style.width = targetW + "px";
      wrap.style.height = (sheet.offsetHeight * s) + "px";
    });
  }

  /* =========================================================
     WIRE UP
     ========================================================= */
  function init() {
    load();

    qcard = $("#qcard");
    progFill = $("#prog-fill"); progLabel = $("#prog-label"); progCount = $("#prog-count");
    btnBack = $("#btn-back"); btnSkip = $("#btn-skip"); btnNext = $("#btn-next");
    stage = $(".stage"); stageInner = $("#stage-inner");

    applyLang();
    renderExamples();
    if (hasAnyAnswers()) { var note = $("#resume-note"); if (note) note.style.display = ""; }

    var sel = $("#lang-select");
    sel.addEventListener("change", function () {
      if (LANGS.indexOf(sel.value) < 0) return;
      state.lang = sel.value; save(); applyLang();
      var scr = activeScreen();
      if (scr === "wizard") renderStep();
      else if (scr === "preview") showPreview();
    });

    $("#btn-start").addEventListener("click", function () { state.step = 0; show("screen-wizard"); renderStep(); });
    var fresh = $("#link-fresh");
    if (fresh) fresh.addEventListener("click", function (e) {
      e.preventDefault(); clearAll(); applyLang(); $("#resume-note").style.display = "none";
    });

    btnBack.addEventListener("click", goBack);
    btnSkip.addEventListener("click", goSkip);
    btnNext.addEventListener("click", goNext);

    $("#btn-edit").addEventListener("click", function () { show("screen-wizard"); renderStep(); });
    $("#btn-print").addEventListener("click", printCard);
    $("#btn-download").addEventListener("click", exportPNG);

    window.addEventListener("resize", function () {
      var scr = activeScreen();
      if (scr === "preview") fitStage();
      else if (scr === "intro") layoutExamples();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
