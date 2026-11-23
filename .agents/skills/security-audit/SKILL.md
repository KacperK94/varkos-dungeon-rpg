---
name: security-audit
description: Audyt bezpieczeństwa własnego kodu i systemów objętych wyraźną zgodą właściciela. Używaj przy przeglądach zabezpieczeń, analizie podatności i planowaniu autoryzowanych testów.
---

# Autoryzowany audyt bezpieczeństwa

## Zakres i zgoda
- Przed aktywnym testowaniem ustal konkretne cele, właściciela, upoważnienie, środowisko i dozwolone techniki.
- Sam adres strony lub dostęp do publicznego repozytorium nie oznacza zgody na testy infrastruktury.
- Gdy zakres jest niejasny, ogranicz się do przeglądu udostępnionego kodu lub lokalnego laboratorium i poproś o doprecyzowanie przed aktywnymi testami.
- Preferuj środowisko testowe i sztuczne konta oraz dane. Operacje na produkcji wymagają wyraźnego uzgodnienia.

## Przegląd
- Przeczytaj instrukcje repozytorium i konfigurację. Zidentyfikuj punkty wejścia, granice zaufania oraz dane wymagające ochrony.
- Sprawdź uwierzytelnianie, autoryzację zasobów i ról, sesje, walidację danych, operacje bazodanowe, przesyłanie plików, dostęp do sieci i zarządzanie sekretami.
- Sprawdź zależności i istniejące mechanizmy kontroli bezpieczeństwa przy użyciu narzędzi projektu. Nie instaluj ani nie uruchamiaj narzędzi z nieznanych źródeł bez weryfikacji.
- Odróżniaj podejrzenie, wynik automatycznego skanera i potwierdzoną podatność. Brak wykrytych problemów nie dowodzi bezpieczeństwa.

## Weryfikacja
- Dla każdej hipotezy dobierz najmniej inwazyjny test, który może ją potwierdzić.
- Stosuj limity czasu i liczby żądań. Nie uruchamiaj szerokiego skanowania poza uzgodnionym zakresem.
- Nie wykonuj testów przeciążeniowych, destrukcyjnych zmian, przejmowania kont, utrwalania dostępu ani pobierania cudzych danych.
- Do potwierdzenia używaj kontrolowanych danych i minimalnych dowodów. Po wykryciu rzeczywistego sekretu lub cudzych danych przerwij tę ścieżkę i zgłoś problem bez ujawniania wartości.
- Nie wypisuj tokenów, haseł ani pełnych danych osobowych w komunikatach, logach lub raportach.

## Naprawy
- Prośba o audyt nie upoważnia do zmiany kodu ani publikacji PR. Naprawiaj dopiero po otrzymaniu odpowiedniego polecenia.
- Po zatwierdzeniu naprawy wprowadź minimalną zmianę, dodaj odpowiedni test regresyjny i sprawdź, że legalny scenariusz nadal działa.
- Nie osłabiaj zabezpieczeń ani testów w celu uzyskania poprawnego wyniku kontroli.

## Raport
Dla każdego ustalenia podaj:
1. Tytuł i lokalizację.
2. Status: podejrzenie lub potwierdzone.
3. Warunki wykorzystania i realistyczny wpływ.
4. Minimalny dowód bez sekretów i danych osób trzecich.
5. Zalecaną naprawę i sposób jej weryfikacji.

Na końcu wymień sprawdzony zakres, ograniczenia oraz niewykonane kontrole. Nie deklaruj, że system jest całkowicie bezpieczny.

## Granice działania
Skill nie nadaje uprawnień, nie stanowi zgody właściciela systemu i nie instaluje narzędzi. Stosuj go zgodnie z obowiązującymi instrukcjami i ograniczeniami środowiska.
