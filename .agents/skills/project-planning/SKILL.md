---
name: project-planning
description: Stosuj jako pierwszy etap pracy przy tworzeniu nowej aplikacji, gry lub samodzielnego projektu, przed scaffoldem, instalacją zależności i kodowaniem. Przygotuj opis, ocenę pomysłu, ponowną analizę, własne propozycje, schemat folderów i policzone etapy realizacji. Nie stosuj pełnej procedury do drobnych zmian istniejącego projektu.
---

# Najpierw plan nowego projektu

## Zasada pierwszeństwa
Pierwszym etapem merytorycznej pracy nad nowym projektem jest planowanie. Odczyt instrukcji, sprawdzenie istniejących plików i zebranie wymagań mogą je poprzedzać; nie twórz jeszcze szkieletu aplikacji, nie instaluj zależności i nie pisz kodu implementacji.

Prośba o stworzenie samego skilla, audyt lub małą poprawkę nie oznacza rozpoczęcia nowej aplikacji. Nie wymuszaj wtedy pełnego planu projektu. Jeśli istnieje już uzgodniony plan, odczytaj go, sprawdź aktualność i uzupełnij różnice zamiast tworzyć konkurencyjny dokument.

## 1. Zbierz kontekst
- Przeczytaj instrukcje repozytorium, istniejący kod, konfigurację oraz dokumentację istotną dla projektu.
- Ustal cel, odbiorców, platformę, wymagania użytkownika i ograniczenia. W grze uwzględnij gatunek, perspektywę, sterowanie i główną pętlę rozgrywki.
- Oddziel wymagania od założeń. Samodzielnie ustal fakty dostępne w materiałach; pytaj tylko o istotne, nierozstrzygnięte decyzje wpływające na zakres, architekturę, koszty lub bezpieczeństwo.
- Nie przedstawiaj nieznanych budżetów, terminów, integracji ani możliwości platformy jako ustalonych faktów.

## 2. Opisz aplikację lub grę
Przed wyborem koncepcji odczytaj `.agents/skills/originality-research/SKILL.md`. W ramach planowania wykonaj opisane tam rozeznanie rynku i opracuj świeży kierunek bez używania poprzednich projektów jako wzorców. Przedstaw źródła, ograniczenia danych oraz konkretne wyróżniki; włącz wnioski do opisu, własnej oceny i ponownej analizy. Nie kopiuj konkurentów i nie zmieniaj uzgodnionego zakresu bez zgody.

Przygotuj zrozumiały opis ogólny obejmujący:
- Do czego służy projekt i dla kogo powstaje.
- Główną ścieżkę użytkownika albo pętlę rozgrywki.
- Najważniejsze funkcje pierwszej działającej wersji (MVP).
- Co świadomie pozostaje poza pierwszą wersją.

## 3. Przedstaw własną ocenę
- Napisz konkretnie, co uważasz za mocną stronę pomysłu i dlaczego.
- Wskaż największą trudność, ryzyko lub słabość oraz proponowany sposób ograniczenia problemu.
- Oddziel opinię od faktów. Unikaj pustych pochwał, obietnic sukcesu i deklarowania stuprocentowej poprawności.

## 4. Przeanalizuj pomysł ponownie
Wykonaj drugi przegląd już przygotowanej koncepcji:
- Sprawdź, czy funkcje rzeczywiście realizują cel i czy zakres MVP nie jest nadmierny.
- Prześledź główny scenariusz oraz istotne błędy i przypadki brzegowe.
- Oceń model danych lub stan gry, zapis postępu, bezpieczeństwo, dostępność i wydajność w zakresie adekwatnym do projektu.
- Sprawdź wykonalność techniczną, zależności zewnętrzne, potrzebne zasoby i zgodność z istniejącą konfiguracją. Weryfikuj zmienne informacje o produktach w aktualnej dokumentacji.
- Podaj konkretne wnioski: co zmieniłeś po drugim przeglądzie, co potwierdziłeś i co pozostaje niepewne. Nie ograniczaj się do zdania „przeanalizowano ponownie”.

## 5. Dodaj propozycje od siebie
- Zaproponuj 1–3 konkretne usprawnienia dopasowane do celu, z krótką korzyścią i kosztem lub ryzykiem.
- Oznacz je jako opcjonalne, a nie wymagania użytkownika.
- Nie wdrażaj dodatkowych funkcji ani płatnych usług bez uzgodnienia. Jeśli można kontynuować bazowy projekt, nie blokuj go oczekiwaniem na decyzję o opcjonalnym dodatku.

## 6. Zaprojektuj schemat folderów
- Pokaż drzewo katalogów i najważniejszych plików, dopasowane do faktycznie wybranej technologii i skali projektu.
- Oznacz elementy istniejące oraz planowane. Krótko wyjaśnij odpowiedzialności głównych katalogów.
- Uwzględnij właściwe miejsca na kod, testy, dokumentację i zasoby; w grze także sceny lub moduły mechanik, jeśli technologia ich wymaga.
- Nie narzucaj monorepo, mikroserwisów ani rozbudowanych abstrakcji bez potrzeby. Zachowuj konwencje zastanego projektu.
- Na etapie planowania twórz schemat, nie puste katalogi ani pliki udające gotową implementację.

## 7. Policz i opisz etapy
- Podaj wprost: „Projekt składa się z N etapów”. Dobierz N do rzeczywistego zakresu, nie do stałego szablonu.
- Ponumeruj dokładnie N etapów; dla każdego podaj cel, konkretny rezultat, zależności i kryterium ukończenia lub test odbioru.
- Uwzględnij przygotowanie fundamentów, główną działającą ścieżkę, pozostałe uzgodnione funkcje oraz adekwatną weryfikację i przygotowanie wydania. Łącz je lub rozdzielaj stosownie do skali.
- Etap wdrożenia nie oznacza zgody na jego wykonanie. Wskaż wymagane dostępy i zgody. Nie podawaj zmyślonych terminów.

## 8. Przedstaw plan, dopiero potem koduj
- Pokaż użytkownikowi plan w kolejności: opis → ocena → ponowna analiza → własne propozycje → schemat folderów → N etapów → następny krok.
- Jeśli zakres prośby pozwala na zapis dokumentacji, zachowaj plan w miejscu zgodnym z konwencjami repozytorium i aktualizuj go przy istotnych zmianach.
- Rozpocznij implementację dopiero po przedstawieniu powyższych elementów, rozstrzygnięciu blokujących decyzji i uzyskaniu wymaganych zgód.
- Jeżeli użytkownik zlecił wyłącznie plan, zakończ na planie. Jeżeli zlecił także budowę i nie ma blokerów, przejdź do pierwszego etapu bez zbędnego pytania o ponowną zgodę.
- Podczas kodowania zastosuj `focused-coding`, jeśli jest dostępny, oraz zasady bieżącego sprawdzania błędów. Plan nie zastępuje testów.

## Kontrola kompletności
Przed pierwszą zmianą implementacji upewnij się, że użytkownik otrzymał wszystkie siedem elementów planu, liczba etapów zgadza się z listą, schemat odpowiada technologii, a opcjonalne pomysły nie zostały dopisane do zakresu bez zgody.

## Granice
Skill jest procedurą dla agenta, nie automatycznym procesem wykonawczym. Nie nadaje uprawnień i nie gwarantuje ładowania w innych repozytoriach lub narzędziach. Nie zastępuje nadrzędnych instrukcji ani wymaganych planów zatwierdzających operacje na platformie.
