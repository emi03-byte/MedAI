# -*- coding: utf-8 -*-
"""Paragrafe suplimentare voluminoase pentru documentație 40-50 pagini."""

BULK_CH2 = """
Analiza comparativă detaliată a pieței aplicațiilor medicale relevă o tendință clară spre digitalizare
a serviciilor de sănătate la nivel global. Conform literaturii de specialitate publicată pe IEEE Xplore,
adoptarea sistemelor informatice în domeniul medical a crescut semnificativ în ultimul deceniu, determinată
de necesitatea reducerii erorilor medicamentoase, îmbunătățirii comunicării medic-pacient și optimizării
timpului alocat actului medical propriu-zis. În acest context, aplicația MedAI propune o soluție adaptată
specificului sistemului de sănătate românesc, completând lacunele identificate în aplicațiile analizate.

Medscape, deși lider global, operează pe o piață diferită de cea românească. Medicamentele compensate
de CNAS au reguli specifice de prescriere, contribuții diferențiate ale pacientului și liste de compensare
care nu au echivalent direct în sistemul american sau european occidental. De exemplu, lista A (compensare
100%) include medicamente esențiale pentru afecțiuni cronice, iar lista C include medicamente cu compensare
parțială variabilă. Aceste nuanțe necesită o interfață dedicată, nu o adaptare a unei soluții străine.

Epocrates a demonstrat valoarea verificării interacțiunilor medicamentoase în timp real, funcționalitate
pe care MedAI o poate integra în versiuni viitoare. Totuși, pentru medicul român, prioritatea imediată
este identificarea rapidă a medicamentului potrivit din lista CNAS, cu informații complete despre preț,
contribuție și cod de boală asociat. MedAI adresează exact această prioritate.

Drugs.com a popularizat accesul publicului la informații medicamentoase, dar modelul său orientat spre
pacienți nu satisface cerințele unui medici prescriptor. Lipsa autentificării profesionale, a istoricului
rețetelor și a workflow-ului de aprobare administrativă îl face nepotrivit pentru utilizare clinică.

Lista CNAS rămâne referința obligatorie pentru orice aplicație medicală din România. MedAI nu înlocuiește
această sursă, ci o valorifică prin procesare automată, structurare în bază de date și îmbogățire cu
mapări medicament-boală validate medical. Această abordare de tip „value-added layer" peste datele
oficiale este diferențiatorul principal al aplicației propuse.
""".strip().split("\n\n")

BULK_MORE = [
    "Utilizarea React 18 aduce beneficii semnificative prin Concurrent Features, care permit întreruperea "
    "și reluarea rendering-ului pentru o interfață mai fluidă. În MedAI, această capacitate este relevantă "
    "la încărcarea inițială a celor 6.479 medicamente, unde filtrarea și paginarea trebuie să rămână "
    "responsivă chiar și pe dispozitive cu resurse limitate.",
    "Pattern-ul Repository, implementat implicit prin adapterul backend/db/, permite comutarea transparentă "
    "între SQLite și Azure SQL. Funcțiile runAsync, getAsync și allAsync abstractizează diferențele de sintaxă "
    "SQL (AUTOINCREMENT vs IDENTITY, TEXT vs NVARCHAR), permițând același cod sursă pe ambele platforme.",
    "Gestionarea stării locale în React utilizează o combinație de useState pentru starea componentei și "
    "localStorage pentru persistență cross-session. Datele per utilizator (rețete, preferințe, planuri) sunt "
    "prefixate cu userId pentru izolare între conturi pe același browser.",
    "Validarea input-ului pe backend previne inserarea de date invalide în baza de date. Endpoint-urile de "
    "autentificare verifică formatul email-ului, lungimea minimă a parolei și unicitatea email-ului. "
    "Endpoint-urile de rețetă validează prezența userId și a listei de medicamente.",
    "Optimizarea performanței frontend include: lazy loading implicit prin paginare, memoizarea filtrelor cu "
    "useMemo, debounce pe căutare (implicit prin re-render controlat) și CSS modular în MedicinesTable.css "
    "cu peste 8.000 de linii de stiluri dedicate.",
    "Accesibilitatea web (a11y) este parțial implementată: butoane cu aria-label, contrast în dark mode, "
    "navigare cu tastatura în modale (Escape pentru închidere). Îmbunătățiri viitoare includ suport "
    "complet pentru screen readers și navigare Tab ordonată.",
    "Procesul CI/CD cu GitHub Actions include două workflow-uri: unul pentru Static Web Apps (frontend + "
    "opțional Azure Functions) și unul pentru App Service (backend Express). Separarea permite deploy "
    "independent al frontend-ului și backend-ului, reducând timpul de iterație.",
    "Monitorizarea în producție poate fi extinsă cu Azure Application Insights pentru urmărirea erorilor, "
    "timpilor de răspuns API și utilizării funcționalităților. În stadiul actual, logging-ul se face prin "
    "console.log pe server și prin mesaje de eroare vizibile în UI.",
    "Protecția datelor personale (GDPR) este relevantă deoarece aplicația stochează nume pacienți, note "
    "medicale și rețete. Implementarea actuală necesită politică de confidențialitate, consimțământ "
    "explicit și mecanisme de ștergere a datelor (parțial implementate prin soft delete și delete account).",
    "Scalabilitatea arhitecturii Azure permite upgrade-ul planului App Service și SQL Database pe măsură "
    "ce numărul de utilizatori crește. Frontend-ul static pe CDN scalează automat fără intervenție.",
    "Interoperabilitatea viitoare cu SIUI (Sistemul Informatic Unic Integrat) ar necesita API-uri standardizate "
    "de la CNAS/CASA DE ASIGURĂRI. MedAI este proiectat modular pentru a putea integra astfel de API-uri "
    "fără restructurare majoră.",
    "Lecțiile învățate din dezvoltarea MedAI includ: importanța validării datelor medicale înainte de "
    "utilizare clinică, necesitatea unui fallback robust (CSV) când cloud-ul este indisponibil, și "
    "valoarea testării automate pentru prevenirea regresiilor în aplicații complexe.",
]

BULK_CH5 = """
Implementarea aplicației MedAI a necesitat peste 3.300 de linii de cod doar pentru componenta principală
MedicinesTable.jsx, la care se adaugă modulele specializate: AdminPanel, ChatBot, HistoryPage, AuthModals,
PlanModal, CheckoutModal și numeroase hook-uri custom. Această complexitate reflectă amploarea funcționalităților
oferite și atenția acordată experienței utilizatorului.

Arhitectura componentelor React urmează principiul separării responsabilităților. Fiecare modul gestionează
o funcționalitate distinctă, comunicând prin props și evenimente custom (de exemplu, openChatBot pentru
deschiderea chatului din sidebar). Starea globală a utilizatorului este gestionată prin localStorage și
sincronizată via evenimentul currentUserChanged, evitând necesitatea unui state manager extern precum Redux.

Backend-ul Express centralizează toată logica de business server-side. Fiecare endpoint validează input-ul,
interacționează cu baza de date prin adapterul abstractizat și returnează răspunsuri JSON standardizate.
Gestionarea erorilor este uniformă, cu coduri HTTP semantice (400 pentru validare, 401 pentru autentificare,
404 pentru resurse inexistente, 500 pentru erori server).

Procesarea datelor CNAS a reprezentat o provocare semnificativă. Fișierul CSV original conține 17 coloane
cu formate inconsistente (spații suplimentare, caractere speciale, valori lipsă). Scripturile de normalizare
curăță datele înainte de inserare în baza de date. Maparea ATC-boli a necesitat cercetare medicală
documentată în CERTIFICARE_MEDICALA_FINALA.md.

Integrarea OpenAI a impus designul unui proxy server-side pentru protejarea cheii API. În dezvoltare locală,
Vite proxy-ează cererile /api/openai către OpenAI direct. În producție, Azure Functions sau Express
preiau acest rol. Prompturile sunt elaborate în limba română, cu instrucțiuni specifice pentru formatul
răspunsului (fără numerotare, fără emoji-uri în sfaturi medicale).

Sistemul de autentificare cu aprobare administrativă adaugă un strat de securitate specific mediului medical.
Nu orice utilizator poate accesa funcționalitățile complete imediat după înregistrare. Administratorul
verifică identitatea și acordă accesul, prevenind utilizarea neautorizată a datelor medicale sensibile.

Exportul PDF al rețetelor utilizează o abordare client-side (html2pdf.js), eliminând necesitatea unui
server de generare PDF. HTML-ul rețetei este construit dinamic cu datele din coș, planurile de tratament
și sfaturile AI, apoi convertit în PDF descărcabil direct în browser.

Modul întunecat (dark mode) demonstrează atenția acordată ergonomiei. Persistat în localStorage, acesta
se activează instant la reîncărcarea paginii. Contrastul culorilor a fost ajustat pentru lizibilitate
pe ecrane LCD și OLED.

Testarea cu Playwright validează funcționalitățile critice automat. Deși nu acoperă toate scenariile
posibile (interacțiuni AI, conturi admin), oferă o rețea de siguranță pentru regresii la modificări
viitoare ale codului.

Deploy-ul pe Azure demonstrează fezabilitatea unei soluții cloud cost-eficiente. Tier-urile gratuite
ale Static Web Apps și App Service permit hosting-ul aplicației fără costuri inițiale, important
pentru un proiect academic.
""".strip().split("\n\n")

ATC_CATEGORIES = [
    ("A – Tractul digestiv și metabolism", "Include inhibitori de pompă de protoni (omeprazol), antidiabetice (metformin) și vitamine. 474/474 medicamente mapate (100%)."),
    ("B – Sânge și organe hematopoietice", "Anticoagulante, antihemoragice și produse derivate din sânge. 331/331 medicamente mapate."),
    ("C – Sistem cardiovascular", "Cea mai mare categorie: 1175 medicamente, inclusiv antihipertensive, statine și antiaritmice."),
    ("D – Dermatologice", "Creme, unguente și soluții pentru afecțiuni cutanate. 109/109 medicamente mapate."),
    ("G – Sistem genito-urinar", "Contraceptive, tratamente urologice și ginecologice. 189/189 medicamente."),
    ("H – Hormoni sistemici", "Insuline, hormoni tiroidieni și corticosteroizi. 172/172 medicamente."),
    ("J – Antiinfecțioase", "Antibiotice, antivirale și antifungice. 1140/1141 medicamente mapate."),
    ("L – Antineoplazice", "Chimioterapie și terapii țintite oncologice. 935/935 medicamente."),
    ("M – Sistem musculo-scheletic", "Antiinflamatoare, relaxante musculare. 321/321 medicamente."),
    ("N – Sistem nervos", "Antidepresive, antiepileptice, analgezice. 1265/1265 medicamente."),
    ("P – Antiparazitare", "Anthelmintice și antiprotozoare. 21/21 medicamente."),
    ("R – Sistem respirator", "Bronhodilatatoare, antitusive, corticosteroizi inhalatori. 185/185."),
    ("S – Organe senzoriale", "Picături oftalmice și otice. 100/100 medicamente."),
    ("V – Diverse", "Soluții perfuzabile, contrast radiologic. 61/61 medicamente."),
]

BULK_CH4 = """
Proiectarea arhitecturii MedAI a urmat o abordare top-down. S-a început cu identificarea cerințelor
funcționale (consultare medicamente, prescripție, AI, administrare) și s-a descins spre deciziile
tehnice concrete (React, Express, Azure SQL). Diagrama de arhitectură reflectă această separare
clară între straturi.

Comunicarea frontend-backend utilizează protocolul HTTP/HTTPS cu payload JSON. Nu s-a implementat GraphQL
sau WebSockets deoarece cerințele aplicației nu impun actualizări în timp real sau interogări complexe
nested. REST API-ul simplu este suficient și mai ușor de documentat și testat.

Baza de date relațională a fost aleasă în detrimentul unei baze NoSQL deoarece datele medicamentelor
sunt structurate, relațiile între utilizatori și rețete sunt clare, iar interogările SQL (filtrare,
căutare, paginare) sunt naturale pe date tabelare. JSON-ul este utilizat doar pentru câmpurile
medicamente și planuri_tratament din tabela retete, care au structură variabilă.

Securitatea aplicației prezintă limitări cunoscute: autentificarea se bazează pe userId transmis
în query/body fără token JWT. Aceasta este o decizie de implementare acceptabilă pentru un proiect
academic, dar necesită îmbunătățire pentru producție reală. Parolele sunt hash-uite corect cu bcrypt,
iar soft delete-ul previne pierderea accidentală a datelor.
""".strip().split("\n\n")
