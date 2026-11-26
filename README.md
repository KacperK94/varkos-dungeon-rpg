# Żar Wyspy

Przeglądarkowa gra 3D o eksploracji i craftingu, Three.js + Vite. Modele, tekstury i audio powstają lokalnie; bez kont, backendu i zewnętrznych zasobów graficznych. Opcjonalne fonty Google mają systemowe zamienniki.

## Uruchomienie i kontrole

Node.js 22.12+ (testowane na 24.21), npm:

```sh
npm ci
npm run dev
npm test
npm run check
npm run build
```

Build trafia do `dist/`; `npm run preview` uruchamia go lokalnie. `vercel.json` wskazuje właściwy katalog. `npm test` korzysta z wbudowanego Node test runnera.

## Menu i światy

Przy każdym otwarciu gry pojawia się menu, nie automatyczny start wyprawy.

- **Kontynuuj**: ta sama mapa, surowce, narzędzia, zużycie węzłów, pozycja, tryb i samouczek z zapisu.
- **Losowy świat**: nowe ziarno i losowy krajobraz; teren 100×100 jednostek gry (umownie metrów), płaski, z brzegiem. Nie jest to fizyczny pomiar ani objętość 100 m³.
- **Własny świat**: opcjonalne numeryczne ziarno 0–4294967295, krajobraz łąka/las/kamieniste wybrzeże, gęstość roślin, liczba zasobów, fauna włączona/wyłączona. Krajobraz zmienia kolor i rozkład zasobów; nie generuje gór ani jaskiń.
- **Odkrywca**: nowy duży świat, darmowy crafting bez wymagań poprzedzających receptur. Budowle/narzędzia nie duplikują się, ekwipunek nie staje się ujemny.

Nowy świat zastępuje jedyną lokalną wyprawę dopiero po jawnym potwierdzeniu. Otwarcie menu ani zmiana formularza nie losują zapisanej mapy. Generator jest wersjonowany w stanie; to samo ziarno i preferencje odtwarzają te same pozycje surowców. Minimalny zestaw startowy jest stały, reszta rozłożona losowo z odstępami. Obszar obozu pozostaje wolny.

## Sterowanie, crafting i plecak

- Dotknij/kliknij wyspę: dojście z wyznaczaniem drogi wokół przeszkód. Cel wewnątrz skały kończy marsz przy jej krawędzi. Brak drogi nie teleportuje postaci.
- WASD / strzałki na komputerze; Shift: bieg. W ustawieniach „Tylko strzałki” wyświetla HUD, wyłącza chodzenie dotknięciem i WASD.
- Szczypanie dwoma palcami, +/− lub kółko myszy zmieniają kamerę. Zakres pozostaje 16–36. Gest dwupalcowy nie wybiera celu marszu.
- E albo przytrzymanie Zbierz: najbliższy surowiec w zasięgu 3 m. Zbieranie gra animację ręki/narzędzia, drobin i potrząśnięcia zasobem.
- Plecak i crafting: zawsze widoczne posiadane surowce (także zera), lista narzędzi i budowli, receptury z ilością `posiadane/wymagane`. Cały panel przewija się, bez zagnieżdżonej, ścinającej receptury listy.
- Siekiera podwaja drewno, kilof podwaja kamień i odblokowuje kryształy w zwykłej wyprawie. Narzędzia są zakładane automatycznie; nie ma ręcznych slotów.
- Ognisko i latarnia pojawiają się w ustalonym obozie. Latarnia kończy cel wyprawy; można kontynuować eksplorację.
- Kolizje w płaszczyźnie XZ: pnie, skały, kryształy, podniesiona platforma i zbudowane obiekty. Postać ma promień, krok jest dzielony na małe odcinki. To nie pełny silnik brył sztywnych; rośliny, owady i dekoracyjne korony nie są ścianami.

Po nowym starcie samouczek śledzi ruch → zbiór → plecak → crafting → zakończenie. Można go pominąć. Starsza wyprawa nie uruchamia samouczka przymusowo.

## Otoczenie i jakość

Motyle machają skrzydłami i latają, robaczki wędrują, króliki podskakują. Fauna jest dekoracyjna, nie zbieralna ani walcząca. Animacje postaci: chód/bieg, bezczynność, praca narzędziem; budowle animują pojawienie, drzewa delikatnie kołyszą się. Dalekie zasoby/fauna są ukrywane; Niska ogranicza liczbę widocznych zwierząt.

Pod trybikiem:
- Automatyczna: ostrość rośnie przy zoomie, pixel ratio telefon 1.25–2 / komputer 1.75–2.5, ograniczone natywną gęstością i budżetem 3/5 mln pikseli.
- Średnia: pixel ratio ≤1.25, cień 1024.
- Niska: pixel ratio ≤1, bez cieni.
- **Full HD / 4K**: docelowa dłuższa krawędź bufora odpowiednio 1920 / 3840 pikseli, proporcje viewportu zachowane, limit GPU respektowany. Na ekranie 16:9 oznacza 1920×1080 / 3840×2160; na telefonie proporcje są inne. To rozdzielczość renderowania, nie fotorealistyczne modele ani tekstury 4K. Może kosztować dużo pamięci, baterii i płynności; nie wymusza się jej domyślnie. Bez adaptacji do mierzonego FPS.

## Audio i zapis

Synteza Web Audio: melodia, szum otoczenia, efekty zbioru i craftingu. Osobne głośności ogólna/muzyka/otoczenie/efekty, mute i próbka. Wymaga interakcji do odblokowania; brak audio nie blokuje gry. Przy pauzie/ukryciu karty jest usypiane; w ustawieniach pozostaje aktywne do odsłuchu. Odsłuch urządzeniowy wymaga osobnego sprawdzenia.

`localStorage`: `ember-island-v1` (wyprawa) i `ember-island-settings-v1` (preferencje). Nowy zapis przechowuje opcjonalne `world.generator=1` i postęp samouczka. Stary zapis bez `world` pozostaje dawną, mniejszą wyspą: pozycje i identyfikatory 35 surowców zachowane. Nie ma synchronizacji domen/przeglądarek. Blokada storage jest sygnalizowana. Menu nie nadpisuje zapisu przed świadomym startem.

## Zakres i weryfikacja

To rozwinięcie samodzielnego Żaru Wyspy, nie migracja dawnego VARKOS-a. Bez multiplayera, walki, wolnego stawiania budynków i modelowania terenu. Zachowano istniejące instrukcje i szkic architektury w `docs/`.

Testy obejmują generator i preferencje, zapis nowy/stary, kolizje i drogę, oba tryby craftingu, ekwipunek, gesty, jakość i mikser. Testy modelu nie dowodzą płynności/odsłuchu ani pełnej grywalności na fizycznych Android/iOS; potrzebne są próby urządzeniowe. Weryfikacja UI podglądu jest opisana w PR.

Moduły: `game.js` stan/reguły, `world-map.js` generator/kolizje/droga, `world.js` rendering, `wildlife.js` fauna, `main.js` UI/menu/samouczek, `render-quality.js`, `settings.js`, `audio.js`, `camera-gestures.js`, `press.js`. Testy w `tests/`.

### Gęstsza flora

Dekoracyjna roślinność ma osobny, deterministyczny strumień losowania: na dużej mapie standardowo 3800 kęp traw/kwiatów/krzewów (2470 dla Rzadkiej, 5700 dla Gęstej). 70% prób trafia do losowych skupisk, reszta wypełnia mapę; wielkość, obrót i odcień są zróżnicowane. Chronione pozostają ścieżka obozu, start i dostęp do zasobów. Rośliny są niskie, dekoracyjne, bez dodatkowych kolizji i łupu. Instancing grupuje je w cztery obiekty renderowania, zamiast tysięcy oddzielnych obiektów. Nie zmienia się generator zasobów ani zapisane ID; także kontynuowany świat otrzymuje florę po odświeżeniu, bez rozpoczynania nowej wyprawy. Wydajność na telefonach wymaga osobnych pomiarów.
