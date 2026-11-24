# Żar Wyspy

Samodzielny, przeglądarkowy prototyp gry 3D z craftingiem. Three.js + Vite, bez backendu, kont i zewnętrznych zasobów graficznych. Wszystkie modele są generowane z geometrii.

## Uruchomienie

Node.js 22.12+ (zalecany 24 LTS lub wersja projektu), npm:

```sh
npm ci
npm run dev
```

`npm test` sprawdza mechaniki, `npm run check` składnię modułów, `npm run build` tworzy `dist/`. `npm run preview` udostępnia lokalnie build. Konfiguracja `vercel.json` wskazuje katalog wynikowy bez zmiany ustawień zdalnego projektu.

## Rozgrywka

- WASD / strzałki: ruch względem kamery, Shift: bieg.
- Kliknięcie wyspy: automatyczne podejście do miejsca; kółko myszy: przybliżenie.
- E lub przycisk zbierania: zbierz najbliższy surowiec w zasięgu trzech jednostek. Pierścień pokazuje cel.
- Gest na wyspie: rozsuń dwa palce, aby przybliżyć; zsuń je, aby oddalić. Kamera ma te same limity co przyciski +/−. Szczypanie zatrzymuje automatyczne podejście i nie wybiera nowego celu po oderwaniu palców.
- Telefon: strzałki 48 px pod lewym kciukiem (przytrzymaj, aby iść), duży przycisk zbierania pod prawym (przytrzymaj, aby powtarzać zbiór), przyciski +/− do kamery i wysuwany warsztat. Cele wyprawy są zwijane.
- Puszczenie długiego przytrzymania zatrzymuje ruch bez dodatkowego kroku; anulowanie dotyku, pauza, utrata widoczności oraz otwarcie warsztatu czyszczą wejście. Warsztat wstrzymuje ruch świata i blokuje sterowanie pod spodem.
- Układ obsługuje pion i poziom, dynamiczną wysokość ekranu i bezpieczne marginesy urządzenia. Rozdzielczość zwiększa się przy przybliżaniu: na telefonach pixel ratio od 1.25 do 2, na komputerach od 1.75 do 2.5, nie więcej niż gęstość ekranu. Budżet bufora to 3 mln pikseli na dotyku / 5 mln na komputerze; na dużych ekranach limit może obniżyć pixel ratio poniżej wartości bazowej. Cienie na telefonie rosną z 1024 do 2048 px przy zoomie ≤20. Jakość jest aktualizowana 180 ms po ostatniej zmianie zoomu/rozmiaru, nie przy każdym ruchu palców. Nie jest to adaptacja do mierzonego FPS.
- C: przełącz warsztat na małym ekranie; Esc: pauza; ?: pomoc.

Zbieraj drewno, kamień i włókna. Siekiera podwaja zbiór drewna. Kilof podwaja zbiór kamienia i umożliwia wydobycie kryształów. Ognisko pojawia się w centrum obozu, a latarnia na północnej platformie. Zbudowanie latarni kończy główny cel i pozwala dalej eksplorować.

Postęp zapisuje się w `localStorage` pod kluczem `ember-island-v1`. Dane pozostają na danej domenie i w danej przeglądarce; nie są synchronizowane. Brak dostępu do pamięci nie blokuje gry, lecz jest sygnalizowany. „Nowa wyprawa” wymaga potwierdzenia.

## Zakres i ograniczenia

To nowa, osobna gra, nie migracja wcześniejszego VARKOS-a. W repozytorium przed tą implementacją nie było kodu wcześniejszej gry, jedynie instrukcje i szkic jej architektury. Istniejące dokumenty pozostawiono bez zmian. PR nie zastępuje produkcji, dopóki nie zostanie scalony i wdrożony.

Wymagany WebGL 2. Modele low-poly, jakość renderowania zależna od przybliżenia, pojedyncze światło z cieniem. Zakres zoomu pozostaje 16–36; modele i mechaniki nie zmieniają się przy zbliżeniu. Surowce są skończone i wystarczają na wszystkie receptury. Nie ma walki, fizyki brył sztywnych, multiplayera ani swobodnego stawiania budynków. Fonty Google są opcjonalne — bez sieci używane są fonty systemowe. Node testuje model stanu; rzeczywiste urządzenia i GPU wymagają osobnych prób.

## Plan realizacji

Cel: eksploracja → zbieranie → narzędzia → ognisko → latarnia. Wybrano spokojną, niewielką wyspę zamiast survivalu z walką lub automatyzacji fabryki, by cała pętla była osiągalna w prototypie. Wyróżnikiem jest określony cel ratunkowej latarni i widoczne budowle po craftingu. Wstępne rozeznanie gatunku: [Garden of the Sea — oficjalny opis Steam](https://store.steampowered.com/app/2887410/Garden_of_the_Sea/), sprawdzono 23.11.2026; materiał jakościowy, nie pomiar aktualnego popytu.

Po drugim przeglądzie ograniczono zakres do jednej mapy i stałych miejsc budowy; dodano kontrolę zapisu i kosztów, a multiplayer, pogodę i głód pozostawiono poza MVP. Największe ryzyka: czytelność kamery na telefonach i różnice wydajności WebGL. Opcjonalna dalsza praca, niewdrożona: pogoda i rozbudowa obozu.

Projekt składa się z 4 etapów:

1. Scena i sterowanie — wyspa renderuje się i można po niej chodzić.
2. Zbieranie i zapis — surowce trafiają do plecaka, wyczerpują się i odtwarzają z zapisu.
3. Crafting — poprawne koszty, narzędzia, ognisko i latarnia; brak duplikacji.
4. Weryfikacja i wydanie — testy, build, PR i sprawdzenie podglądu, gdy jest dostępny. Publikacja na produkcji to osobna decyzja.

Struktura: `src/game.js` — stan i reguły, `src/world.js` — scena, kamera i ruch, `src/main.js` — UI i pętla, `src/style.css` — układ, `tests/game.test.js` — testy zachowania. Istniejące `.agents/` i `docs/` bez zmian.
