# Afzonderlijke cursussen

`/cursus/` is de gezamenlijke cursisteningang. Een dunne adapter controleert het
ingevulde wachtwoord lokaal tegen de versleutelde lessenlijst van iedere
ingerichte cursus. Voor atelier geeft hij de invoer door aan de oorspronkelijke
login; voor andere cursussen bewaart hij alleen de eigen decryptiesleutel en
stuurt hij de browser naar de betreffende cursus. Het wachtwoord komt niet in
een URL, een netwerkverzoek of browseropslag terecht. Nieuwe cursussen worden
automatisch uit `content/courses.json` meegenomen. Een dubbel wachtwoord geeft
een keuze tussen de bijbehorende cursussen; een netwerkfout wordt niet als een
onjuist wachtwoord gemeld. Bestaande onthouden atelierlogins blijven werken, met
een knop **Andere cursus openen** voor gedeelde apparaten.

De bestaande versleutelde atelierinhoud, sleutels, wachtwoordrecords, assets,
lesadressen, browseropslag en cursistenruntime worden niet gemigreerd of
gewijzigd. De enige aanpassing aan de bestaande cursistenpagina is het laden van
deze nieuwe adapter. `/cursus/beheer/` heeft een cursuskeuze; `?cursus=atelier`
laadt de oorspronkelijke, ongewijzigde beheerbundle.

De tweede cursistenlogin staat op `/cursus/cursussen/online/` en het beheer op
`/cursus/cursussen/online/beheer/`. De online cursus heeft nog geen wachtwoorden:
kies **Cursus inrichten** in de beheerkeuze om deze zelf in te stellen. Hetzelfde
formulier is bereikbaar via **Nieuwe cursus** voor toekomstige cursussen.
Het bestaande atelier-beheerwachtwoord en een GitHub-sleutel met schrijfrecht
voor de repository zijn nodig om een cursus aan te maken. Er wordt één commit
gemaakt met uitsluitend de nieuwe cursusbestanden en `content/courses.json`.
De online cursus krijgt geen kopieën van atelierlessen.

Nieuwe cursussen hebben elk eigen `security.json`, `admin-auth.json`,
versleutelde concepten en lessenlijsten, media en browserdatabases. Nieuwe
wachtwoorden moeten verschillen van de bestaande wachtwoorden voor dezelfde
rol; beheer en cursisten hebben eveneens verschillende wachtwoorden.
Zonder geldige versleutelde lijst geeft de nieuwe cursistenlogin geen toegang.
Koppeling van GitHub gebeurt daarna per cursus via **Instellingen**.

Alle schrijfacties van de nieuwe editor worden vóór de GitHub-mutatie op de
cursusmap begrensd. Dit geldt ook voor verwijderen, wachtwoordwijziging,
reset en herstel. De atelieradapter sluit alleen de toegevoegde cursusmappen,
nieuwe runtime, cursuslijst, gezamenlijke ingang en het keuzescherm uit van de historische
atelier-herstelactie. Zo herstelt die nog steeds de oorspronkelijke
atelierbestanden, zonder de toevoeging te verwijderen. De oorspronkelijke
beheerbundle blijft byte voor byte intact.

## Onderhoud en controle

`node multi-course/build.mjs` genereert de aparte editor, cursistenruntime en
navigatie uit de bestaande bundles met gecontroleerde vervangingen. Het script
schrijft alleen in `multi-course/`; een gewijzigde editorankertekst stopt de build.
De gegenereerde bestanden moeten mee worden gepubliceerd. De gedeelde
vormgeving, React-runtime en rich-textknoppen worden alleen gelezen.

`node --test multi-course/tests.mjs` controleert inlogscheiding, versleuteling,
publiceren, volgorde, offline halen, wachtwoordwijzigingen, reset, herstel,
cursusaanmaak, gelijktijdige publicatie en behoud van de atelierbestanden.

Dit blijft een statische website met de bestaande client-side versleuteling en
GitHub-publicatie. Versleutelde bestanden zijn openbaar opvraagbaar; de
wachtwoorden en decryptiesleutels zijn nodig om de beschermde inhoud te lezen.
Wachtwoorden en GitHub-sleutels worden door het aanmaakformulier niet bewaard.
Publicatie vindt pas plaats wanneer je het formulier zelf indient. Deze wijziging
bevat geen live publicatie en geen wachtwoordrotatie.

Voor een volledige lokale editorcontrole: `node multi-course/browser-fixture.mjs`.
Open `http://127.0.0.1:8124/cursus/cursussen/editor-test/beheer/` en gebruik het
uitsluitend voor deze tijdelijke test bedoelde wachtwoord `editor-test-admin`.
De fixture maakt records alleen in het servergeheugen en gebruikt een aparte
browserdatabase. Controleer inloggen, **Maak de eerste pagina**, titel aanpassen
en **Voorbeeld**. Er worden geen echte cursusbestanden of GitHub-gegevens geschreven.
Ook beheerpagina's zonder het oorspronkelijke `ssr`-kenmerk worden ondersteund:
`admin-entry.js` voegt dit vóór het mounten toe, zodat eerder aangemaakte cursussen
werken zonder nieuwe wachtwoordinstelling of wijziging aan de cursusinhoud.
Test de gezamenlijke ingang op `http://127.0.0.1:8124/cursus/` met de tijdelijke
wachtwoorden `atelier-test-student` en `editor-test-student`. Het eerste blijft
op de atelierlessenlijst; het tweede opent direct de eigen cursuslessenlijst.
