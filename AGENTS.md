# Instrukcje dla agentów pracujących nad repozytorium

## Skupienie i zakres
- Przed edycją określ oczekiwany rezultat i sprawdzalne kryteria ukończenia.
- Przeczytaj powiązany kod, dokumentację i instrukcje dotyczące zmienianych katalogów.
- Wprowadzaj najmniejsze spójne zmiany potrzebne do realizacji zadania. Nie dodawaj pobocznych funkcji, zależności ani refaktoryzacji.
- Zachowuj zmiany użytkownika i istniejące konwencje projektu.

## Sprawdzanie błędów na bieżąco
- Przed kodowaniem sprawdź dostępne skrypty, menedżer pakietów i istniejące testy. Ustal rzeczywiste polecenia kontroli; nie zakładaj ich nazw.
- Uruchom adekwatne kontrole początkowe, aby rozróżnić błędy istniejące od wprowadzonych zmianą.
- Po każdej małej, spójnej zmianie uruchom najszybszą adekwatną kontrolę: składni, typów, lint zmienionych plików lub test zmienianego zachowania. Nie odkładaj całej weryfikacji na koniec.
- Jeśli projekt ma użyteczny tryb watch, możesz go wykorzystać, ale sprawdzaj wyniki procesu, nie tylko jego uruchomienie.
- Nowy błąd zdiagnozuj i popraw przed kontynuowaniem prac zależnych od tej zmiany. Następnie ponów kontrolę.
- Nie powtarzaj nieudanej próby bez nowych przesłanek. Opieraj diagnozę na kodzie, komunikatach błędów i reprodukcji.
- Dla napraw błędów odtwórz problem i dodaj test regresyjny w istniejącym systemie testowym. Jeśli brak infrastruktury testowej, zastosuj minimalną reprodukcję; nie instaluj nowego frameworka bez uzgodnienia.
- Nie osłabiaj testów, nie wyciszaj diagnostyki i nie wyłączaj kontroli tylko po to, aby uzyskać zielony wynik.
- Niezwiązane błędy zgłoś osobno, bez rozszerzania zakresu naprawy.

## Weryfikacja końcowa
- Uruchom odpowiednie szersze kontrole dostępne w projekcie: testy, lint, kontrolę typów i build, proporcjonalnie do zakresu zmiany.
- Jeśli kodu lub narzędzi kontroli jeszcze nie ma, wyraźnie to zgłoś. Nie przedstawiaj nieistniejących kontroli jako zaliczonych.
- Sprawdź zmienione zachowanie, nie tylko powodzenie komendy. Dla zmian UI zweryfikuj istotny przepływ w podglądzie, gdy odpowiednie narzędzia są dostępne.
- Przejrzyj końcowy diff i usuń przypadkowe zmiany oraz pozostawione debugowanie. Nie zapisuj sekretów w repozytorium.
- Podsumuj, co zmieniono, jakie kontrole wykonano i z jakim wynikiem. Wymień blokery oraz elementy niezweryfikowane.
- Sam udany build lub status READY deploymentu nie dowodzą poprawności działania aplikacji.

## Skill audytu bezpieczeństwa
- Przy zadaniach dotyczących audytu bezpieczeństwa, podatności lub autoryzowanych testów odczytaj `.agents/skills/security-audit/SKILL.md` i stosuj opisany tam proces.
- Samo dodanie skilla nie oznacza zgody na aktywne testowanie infrastruktury. Najpierw ustal zakres i upoważnienie.

## Stosowanie
Te instrukcje dotyczą pracy nad całym repozytorium. Nie nadają dodatkowych uprawnień i nie uruchamiają samodzielnego monitorowania w tle. Agent powinien odczytać ten plik przy rozpoczynaniu pracy; automatyczne ładowanie zależy od używanego narzędzia.
