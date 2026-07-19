# Pink Fluffy Stories

Een rustige, lichtroze schrijversomgeving voor boeken en hoofdstukken.

## Openen

Open `index.html` in een moderne browser, of gebruik de online versie via `https://www.machielvansoest.nl/Pinkfluffystories/`. Er is geen installatie of buildstap nodig.

## Mogelijkheden

- Boeken als uitklapbare mappen in de linkerzijbalk
- De titel van de schrijfruimte per account aanpassen
- De kleur van iedere boekenmap kiezen
- Boeken en hoofdstukken verslepen om hun volgorde te wijzigen
- Boeken en hoofdstukken maken, hernoemen, dupliceren en verwijderen
- Hoofdstukken ook tussen verschillende boeken verplaatsen
- Tekst opmaken met een ruime lettertype- en lettergroottekeuze, koppen, vet, cursief, onderstrepen, lijsten, kleuren en markeringen
- Schakelen tussen een Nederlandse en Engelse interface
- Online accounts met e-mailadres en wachtwoord, ieder met een eigen privébibliotheek
- Automatisch synchroniseren via Supabase, zodat dezelfde verhalen op laptop en Chromebook beschikbaar zijn
- Een lokale cache voor tijdelijk offline of beperkt browsergebruik
- Een aparte, terug te zetten back-upgeschiedenis per account
- Back-ups per account downloaden en later vanuit een JSON-bestand herstellen
- Direct opslaan bij iedere tekstwijziging en extra opslaan bij uitloggen, tabwissel en afsluiten
- Woorden, tekens en geschatte leestijd bijhouden
- Focusmodus en een responsive mobiele layout

Verhalen worden online per account opgeslagen en met Row Level Security afgeschermd. Lokale herstelversies blijven daarnaast op het apparaat staan. Download regelmatig een JSON-back-up als extra kopie buiten de browser.

> Let op: de publishable Supabase-sleutel in `supabase-config.js` is bedoeld voor gebruik in de browser. De databasebeveiliging berust op de ingeschakelde Row Level Security-regels. Plaats nooit een `service_role`-sleutel in deze repository.
