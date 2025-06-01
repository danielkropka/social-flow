# Zasady pracy z branchami, commitami i pull requestami

## 1. Tworzenie nowego brancha

Każdą nową funkcjonalność lub poprawkę realizuj na osobnym branchu utworzonym od `dev`.

**Nazewnictwo branchy:**

- `feature/nazwa-funkcji` (lub `feat/nazwa-funkcji`)
- `fix/nazwa-poprawki`
- `refactor/nazwa-zmiany`

**Przykład:**

```bash
git checkout dev
git pull
git checkout -b feature/resetowanie-hasla
```

---

## 2. Praca na branchu

- Wprowadzaj zmiany.
- Rób commity zgodnie z konwencją Conventional Commits:
  - `feat: opis funkcji`
  - `fix: opis poprawki`
  - `refactor: opis refaktoryzacji`
  - `docs: opis zmian w dokumentacji`
  - `chore: opis zmian w narzędziach/konfiguracji`

**Przykład commitów:**

```
feat: dodaj resetowanie hasła
fix: popraw błąd walidacji emaila
refactor: uprość logikę pobierania danych z API
docs: zaktualizuj README o instrukcję deployu
chore: zaktualizuj zależności npm
```

---

## 3. Wysyłanie zmian na zdalne repozytorium

```bash
git push origin feature/resetowanie-hasla
```

---

## 4. Tworzenie Pull Requesta (PR) do `dev`

- Wejdź na platformę (GitHub/GitLab/Bitbucket).
- Utwórz PR z Twojego brancha do `dev`.
- W opisie PR napisz krótko, co wprowadza ta zmiana.

**Szablon opisu PR:**

```
### Co zostało zrobione?
- Opis zmian

### Jak testować?
- Kroki do przetestowania

### Dodatkowe informacje
- (opcjonalnie)
```

---

## 5. Code review i merge

- Po akceptacji PR merguj do `dev`.
- Jeśli trzeba coś poprawić, dodaj kolejne commity do tego samego brancha – PR się zaktualizuje.

---

## 6. Usuwanie brancha po mergu (opcjonalnie)

Po zmergowaniu możesz usunąć branch lokalnie i zdalnie:

```bash
git branch -d feature/resetowanie-hasla
git push origin --delete feature/resetowanie-hasla
```

---

## Schemat workflow

```
dev
│
├── feature/nazwa-funkcji
│      ↑
│   (commity)
│      ↓
└── [Pull Request] → merge do dev
```

---

## Dobre praktyki

- Rób commity logicznie, nie za rzadko, nie za często.
- Każdy commit powinien być logiczną całością.
- Unikaj commitów typu "wip" na branchach głównych.
- Opisuj PR-y zgodnie z szablonem.

---

**Dzięki temu workflow projekt będzie czytelny, łatwy do śledzenia i rozwoju!**
