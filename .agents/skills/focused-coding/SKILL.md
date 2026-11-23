---
name: focused-coding
description: Stosuj przy każdej implementacji, naprawie błędu i refaktoryzacji w tym repozytorium. Utrzymuj jeden cel, ograniczaj zakres zmian i sprawdzaj błędy na bieżąco.
---

# Skupiona praca nad kodem

## 1. Ustal wynik
- Sformułuj jednym zdaniem cel użytkownika i sprawdzalne kryteria ukończenia.
- Oddziel wymagania od założeń. Wyjaśnij niejasności wpływające na zachowanie, zakres lub bezpieczeństwo; fakty dostępne w repozytorium ustal samodzielnie.
- Przy większym zadaniu podziel pracę na krótkie kroki. W danym momencie realizuj jeden spójny krok; niezależne odczyty i kontrole mogą działać równolegle.

## 2. Zrozum przed edycją
- Odczytaj instrukcje repozytorium i zmienianych katalogów.
- Znajdź implementację, jej wywołania, konfigurację i odpowiednie testy.
- Sprawdź stan zmian lokalnych, konwencje, wersje zależności i rzeczywiste polecenia kontroli projektu.
- Nie zgaduj nazw plików, API ani wyników poleceń. Odróżniaj obserwacje od hipotez.

## 3. Wykonuj małe, sprawdzalne zmiany
1. Wybierz najmniejszy krok prowadzący do celu.
2. Określ, jaki dowód potwierdzi jego poprawność.
3. Wprowadź minimalną spójną zmianę bez pobocznej refaktoryzacji.
4. Uruchom najszybszą adekwatną kontrolę: składni, typów, lint lub test zmienionego zachowania, zależnie od narzędzi projektu.
5. Sprawdź wynik. Nowy błąd napraw przed kontynuowaniem prac zależnych od tej zmiany.

- Nie powtarzaj nieudanej próby bez nowych przesłanek.
- Nie wyłączaj zabezpieczeń, diagnostyki ani testów, aby ukryć problem.
- Zachowuj zmiany użytkownika. Niezwiązane problemy zgłaszaj osobno.
- Jeśli brakuje narzędzi kontroli, zgłoś ograniczenie i użyj dostępnej reprodukcji; nie wymyślaj wyników i nie instaluj zbędnych zależności.

## 4. Wracaj do celu
Po nieudanej kontroli, zmianie podejścia lub przerwie ustal:
- Jaki jest oczekiwany wynik?
- Co zostało potwierdzone, a co nadal jest hipotezą?
- Co pozostaje do sprawdzenia?
- Jaki jest najmniejszy następny krok?

Jeżeli planowana edycja nie służy kryteriom ukończenia, nie wykonuj jej bez uzgodnienia rozszerzenia zakresu.

## 5. Zakończ na podstawie dowodów
- Zweryfikuj każde kryterium ukończenia i zmienione zachowanie, nie tylko powodzenie komendy.
- Uruchom odpowiednie szersze kontrole dostępne w projekcie i przejrzyj pełny diff przed publikacją.
- Usuń przypadkowe zmiany i debugowanie; nie publikuj sekretów.
- Zakończ po spełnieniu kryteriów, bez niezamówionych ulepszeń. Przy blokerze wskaż dokładnie, co pozostało i co umożliwi kontynuację.
- Podsumuj rezultat, wykonane kontrole, ich wyniki i ograniczenia. Nie deklaruj sukcesu ani pełnej poprawności bez dowodów.

## Ograniczenia
To procedura pracy, nie gwarancja stuprocentowego skupienia ani bezbłędności. Nie nadaje uprawnień, nie zastępuje nadrzędnych instrukcji i nie uruchamia samodzielnego monitorowania. Ładowanie skilla zależy od narzędzia korzystającego z repozytorium.
