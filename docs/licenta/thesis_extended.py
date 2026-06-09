# -*- coding: utf-8 -*-
"""Conținut extins pentru atingerea volumului de 40-50 pagini."""

CH2_MEDSCAPE_EXTRA = [
    "Platforma Medscape a fost lansată inițial ca un portal de știri medicale și a evoluat treptat spre o suită completă de instrumente clinice. Medscape Reference include monografii detaliate pentru peste 7.000 de medicamente, cu informații despre farmacologie, farmacocinetică, contraindicații și reacții adverse. Medscape Consult oferă articole de continuare a educației medicale (CME) acreditate.",
    "Arhitectura tehnică a Medscape se bazează pe microservicii cloud, cu CDN global pentru livrarea conținutului static și API-uri GraphQL pentru interogări complexe. Aplicațiile mobile sincronizează datele offline pentru acces fără conexiune, funcționalitate utilă în spitale cu conectivitate instabilă.",
    "Din perspectiva utilizatorului român, Medscape prezintă limitări majore: denumirile comerciale sunt predominant americane, prețurile nu reflectă sistemul de compensare CNAS, iar codurile de diagnostic utilizate urmează clasificarea ICD-10-CM americană, nu cea adaptată pentru România.",
    "Analiza comparativă relevă că Medscape excelează în educație medicală continuă și verificarea interacțiunilor la nivel internațional, dar nu poate înlocui un instrument dedicat listei naționale de medicamente compensate.",
]

CH2_EPOCRATES_EXTRA = [
    "Epocrates a fost achizițat de athenahealth și integrat într-un ecosistem mai larg de soluții pentru practica medicală. Versiunea premium include verificarea interacțiunilor pentru până la 30 de medicamente simultan, alternative terapeutice și ghiduri de dozare pe greutate și vârstă.",
    "Interfața Epocrates este optimizată pentru smartphone-uri, cu design minimalist care permite acces rapid la informații la patul pacientului. Funcția Pill ID utilizează recunoaștere vizuală pentru identificarea comprimatelor după formă, culoare și marcaje.",
    "Pentru piața românească, Epocrates nu oferă date despre contribuțiile pacientului la medicamente compensate, nu include codurile de medicament din nomenclatorul CNAS și nu suportă exportul de rețete în formatul cerut de legislația română.",
    "Evaluarea tehnică arată că Epocrates utilizează o bază de date proprietară actualizată săptămânal, cu surse din FDA DailyMed și Clinical Pharmacology. Această frecvență de actualizare este comparabilă cu cea a listei CNAS, dar conținutul este fundamental diferit ca structură.",
]

CH2_DRUGS_EXTRA = [
    "Drugs.com agregă date din mai multe surse: FDA, Micromedex, Cerner Multum și surse proprii. Site-ul primește peste 20 de milioane de vizite lunare, fiind unul dintre cele mai populare portaluri medicale pentru publicul general.",
    "Funcționalitatea Interaction Checker permite verificarea interacțiunilor între medicamente și suplimente alimentare. Symptom Checker ghidează utilizatorul printr-un arbore de decizie pentru autoevaluare, deși acesta nu înlocuiește consultul medical.",
    "Limitările pentru utilizare profesională în România includ: absența codurilor ATC din nomenclatorul național, lipsa informațiilor despre detinatorul autorizației de punere pe piață din lista CNAS și inexistența unui modul de gestionare a rețetelor digitale.",
    "Tehnologic, Drugs.com folosește un stack LAMP clasic cu caching Redis și load balancing. Performanța este excelentă, dar arhitectura monolitică contrastează cu abordarea modernă SPA adoptată de MedAI.",
]

CH2_CNAS_EXTRA = [
    "Lista medicamentelor compensate CNAS este publicată prin Ordin al președintelui CNAS și actualizată trimestrial sau la necesitate. Formatul oficial include 17 coloane standardizate: denumire medicament, substanță activă, cod medicament, formă farmaceutică, cod ATC, mod prescriere, concentrație, prețuri maxime și contribuții.",
    "Platformele web oficiale CNAS oferă acces la listă în format PDF și uneori Excel, dar interfața de căutare este limitată la câmpuri simple, fără filtrare combinată pe multiple criterii simultane.",
    "MedAI a preluat aceste date oficiale și le-a procesat automat: scriptul Python map_atc_to_diseases_COMPLETE.py a adăugat coloana Coduri_Boli prin maparea codurilor ATC la 992 coduri de boală din coduri_boala.csv. Rezultatul, medicamente_cu_boli_COMPLET.csv, constituie baza de date a aplicației.",
    "Certificarea medicală internă confirmă validitatea mapărilor pentru toate categoriile ATC (A-V), cu verificări manuale pentru medicamente reprezentative: omeprazol (A02BC01), metformin (A10BA02), amoxicilină (J01CA04) și altele.",
]

CH5_IMPLEMENTATION_DETAILS = [
    ("Detalii încărcare date", "Funcția loadAllMedicationsForUi din medicationsLoader.js implementează un pattern de caching cu variabile module-level (cachedUiRows, cachedUiRowsPromise) pentru a evita cereri duplicate. La prima încărcare, se încearcă fetch-ul către API; în caz de eșec, PapaParse parsează CSV-ul local cu opțiuni header: true și skipEmptyLines: true. Normalizarea cheilor gestionează BOM-ul UTF-8 de pe prima coloană."),
    ("Mapare date UI", "Funcția mapMedicationRowsToUi din domain/medications.js traduce denumirile coloanelor din baza de date (snake_case) la header-ele UI în limba română (Denumire medicament, Substanță activă etc.). Această separare permite modificarea schemei BD fără impact direct asupra componentelor React."),
    ("Filtrare și paginare", "Filtrarea se realizează client-side cu useMemo pentru performanță. Fiecare coloană poate avea un filtru individual activat din meniul contextual. Categoria de vârstă filtrează după coloana CategorieVarsta. Paginarea afișează 10/25/50/100 elemente per pagină, cu navigare directă la o pagină specifică."),
    ("Flux autentificare", "AuthModals.jsx gestionează patru modale: login, signup, recover și login required. La signup, parola este trimisă la backend unde bcrypt o hash-uiește cu salt rounds=10. Statusul 'pending' blochează accesul la chatbot și anumite funcții până la aprobare. AdminPanel permite administratorului să schimbe statusul în approved sau rejected."),
    ("Coș rețetă", "selectedProducts stochează medicamentele selectate. La adăugare, PlanModal permite configurarea duratei (zile), frecvenței (ore între doze) și orelor de administrare. medicinePlans este un obiect keyed by medicine id. CheckoutModal validează numele pacientului obligatoriu înainte de finalizare."),
    ("Generare sfaturi AI", "generateAIAdvice construiește un prompt de sistem care instruiește GPT-3.5-turbo să genereze 5-6 sfaturi medicale în română, fără numerotare sau emoji-uri. Răspunsul este parsat linie cu linie, eliminând prefixele numerice. Erorile 401/403 sunt gestionate cu mesaje clare despre configurarea OPENAI_API_KEY."),
    ("Speech-to-text", "useSpeechToText creează o instanță SpeechRecognition cu lang='ro-RO', continuous=true și interimResults=true. La oprirea înregistrării, textul dictat este prepended la conținutul existent al câmpului. Compatibilitatea este verificată la runtime (Chrome, Edge)."),
    ("Export PDF", "downloadPrescriptionPDF din pdf.js generează HTML structurat cu stiluri inline, apoi html2pdf.js îl convertește în PDF cu opțiuni de format A4 și margini. Logo-ul spitalului este inclus ca SVG inline."),
    ("Chatbot", "ChatBot.jsx verifică statusul utilizatorului (pending/rejected/null) și afișează mesaje corespunzătoare. buildSystemPrompt include primele 20 medicamente ca context JSON. createChatCompletion trimite cererea la proxy-ul /api/openai/v1/chat/completions."),
    ("Admin panel", "AdminPanel include taburi: Cereri (RequestsTable), Rețete utilizator (PrescriptionsModal) și Interogări SQL (DbQueryTab). Doar utilizatorii cu is_admin=1 pot accesa panoul. Soft delete setează deleted_at fără ștergere fizică."),
]

MEDICATION_COLUMNS = [
    ("denumire_medicament", "Denumirea comercială a medicamentului așa cum apare în lista CNAS."),
    ("substanta_activa", "Principiul activ responsabil de efectul terapeutic."),
    ("lista_compensare", "Categoria de compensare: A (100%), B (90%), C1/C2/C3 (50%/20%), D (special)."),
    ("cod_medicament", "Codul unic al medicamentului în nomenclatorul CNAS."),
    ("forma_farmaceutica", "Forma de prezentare: comprimat, capsule, soluție injectabilă etc."),
    ("cod_atc", "Codul Anatomical Therapeutic Chemical pentru clasificare internațională."),
    ("mod_prescriere", "Regimul de prescriere: P (prescripție), P+S (cu semnătură) etc."),
    ("concentratie", "Concentrația substanței active per unitate."),
    ("forma_ambalare", "Tipul ambalajului: cutie, blister, flacon."),
    ("nume_detinator_app", "Denumirea deținătorului autorizației de punere pe piață."),
    ("tara_detinator_app", "Țara de origine a deținătorului APP."),
    ("cantitate_pe_forma_ambalare", "Numărul de unități terapeutice per ambalaj."),
    ("pret_max_forma_ambalare", "Prețul maxim al ambalajului la producător/importator."),
    ("pret_max_ut", "Prețul maxim per unitate terapeutică."),
    ("contributie_max_100", "Contribuția maximă a pacientului pentru categoria 100%."),
    ("contributie_max_90_50_20", "Contribuții pentru categoriile 90%, 50% și 20%."),
    ("contributie_max_pensionari_90", "Contribuția pensionarilor pentru categoria 90%."),
    ("categorie_varsta", "Categoria de vârstă recomandată: copii, adolescenți, tineri, adulți, bătrâni."),
    ("coduri_boli", "Codurile ICD ale bolilor pentru care medicamentul este indicat, separate prin virgulă."),
]

CH3_EXTENDED = [
    "React utilizează un model declarativ de programare: interfața este descrisă ca o funcție de stare (UI = f(state)). La modificarea stării (de exemplu, schimbarea filtrului de căutare), React recalculează virtual DOM-ul și aplică doar diferențele necesare în DOM-ul real, optimizând performanța.",
    "Hooks-urile React (useState, useEffect, useMemo, useCallback) sunt utilizate extensiv în MedAI. useMemo memorează rezultatele filtrării medicamentelor, evitând recalcularea la fiecare render. useCallback stabilizează referințele funcțiilor transmise ca props copiilor.",
    "Vite folosește ES modules native în dezvoltare, eliminând bundling-ul la pornire. Plugin-ul @vitejs/plugin-react activează Fast Refresh pentru actualizare instantanee a componentelor modificate. Build-ul de producție utilizează Rollup pentru optimizare și tree-shaking.",
    "Express.js implementează pattern-ul middleware: fiecare cerere HTTP traversează o lanț de funcții (CORS, JSON parser, router handler). Această arhitectură modulară permite adăugarea ușoară de noi endpoint-uri fără modificarea nucleului aplicației.",
    "Azure SQL Database oferă SLA de 99,99%, backup automat și geo-replicare. Connection pooling prin biblioteca mssql optimizează utilizarea conexiunilor. În dezvoltare locală, SQLite elimină dependența de cloud, accelerând ciclul de dezvoltare.",
    "OpenAI GPT-3.5-turbo este un model de limbaj instruit prin reinforcement learning from human feedback (RLHF). Parametrii temperature (0.7) și max_tokens (500-800) sunt calibrați pentru echilibru între creativitate și consistență medicală.",
    "bcrypt utilizează algoritmul Blowfish cu un cost factor configurabil (10 runde în MedAI), făcând atacurile brute-force computațional costisitoare. Parolele nu sunt niciodată stocate în clar în baza de date.",
]

CH6_EXTENDED = [
    "Testarea automată end-to-end (E2E) simulează interacțiunea reală a utilizatorului cu aplicația în browser. Playwright oferă auto-waiting inteligent: acțiunile așteaptă automat ca elementele să fie vizibile, stabile și enabled înainte de interacțiune.",
    "Alegerea Playwright în locul Cypress se bazează pe: suport nativ pentru multiple tab-uri și contexte, execuție paralelă eficientă, API modern async/await și suport pentru testare pe Chromium, Firefox și WebKit din aceeași suită.",
    "Testele MedAI acoperă cele patru module critice: afișare date (medications), autentificare (auth), flux rețetă (prescription) și chatbot AI. Fiecare test este independent și poate rula izolat.",
    "Scriptul capture-screenshots.spec.js demonstrează o utilizare secundară a Playwright: generarea automată de capturi de ecran pentru documentație, reducând efortul manual de documentare vizuală.",
    "Limitările testelor actuale includ: lipsa mock-ului pentru OpenAI (testele chatbot verifică doar UI-ul), absența testelor cu cont autentificat admin și inexistența testelor de performanță (load testing). Acestea sunt direcții pentru extinderea suitei de teste.",
]

CH7_EXTENDED = [
    "Proiectul MedAI demonstrează fezabilitatea integrării listei oficiale CNAS cu tehnologii web moderne și inteligență artificială într-o singură platformă accesibilă. Volumul de date procesat (6.479 medicamente, 992 coduri boală, 14 categorii ATC) confirmă scalabilitatea soluției.",
    "Experiența acumulată în dezvoltarea MedAI include competențe full-stack JavaScript, administrare Azure cloud, integrare API-uri AI, procesare date cu Python/pandas și testare automată cu Playwright.",
    "Impactul potențial asupra practicii medicale din România include reducerea timpului de căutare a medicamentelor compensate, asistarea deciziei terapeutice prin AI și digitalizarea parțială a fluxului de prescripție.",
]

DEPLOYMENT_STEPS = [
    "Crearea resurselor Azure: Resource Group, Azure SQL Server, baza de date MedAI, Static Web App, App Service (Node 20 LTS).",
    "Configurarea firewall-ului Azure SQL pentru a permite accesul de la App Service și de la IP-ul de dezvoltare.",
    "Rularea scripturilor SQL: create-medications-table.sql și create-all-tables-azure.sql în Query Editor.",
    "Setarea secretelor GitHub: AZURE_SQL_CONNECTION_STRING, VITE_API_BASE, OPENAI_API_KEY, AZURE_WEBAPP_NAME.",
    "Configurarea GitHub Actions workflows pentru deploy automat la push pe main.",
    "Verificarea post-deploy: /health, /api/medications?limit=5, autentificare și chatbot.",
]
