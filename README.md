# Social Flow

Social Flow to nowoczesna aplikacja webowa do zarządzania i publikowania treści na różnych platformach społecznościowych. Umożliwia jednoczesną publikację postów na Twitterze, Facebooku i Instagramie, z zaawansowanymi funkcjami planowania i zarządzania mediami.

## 🌟 Funkcje

- **Publikacja wieloplatformowa**

  - Publikuj treści na Twitterze, Facebooku i Instagramie jednocześnie
  - Wsparcie dla różnych typów kont (osobiste, firmowe)
  - Planowanie postów na przyszłość

- **Zarządzanie mediami**

  - Upload i podgląd obrazów i filmów
  - Automatyczne generowanie miniatur dla filmów
  - Optymalizacja mediów przed publikacją

- **Interfejs użytkownika**

  - Nowoczesny, responsywny design
  - Intuicyjny proces tworzenia postów
  - Podgląd postów przed publikacją

- **Bezpieczeństwo**
  - Bezpieczne przechowywanie tokenów dostępu
  - Szyfrowanie danych wrażliwych
  - Autoryzacja OAuth dla każdej platformy

## 🚀 Technologie

- **Frontend**

  - Next.js 14
  - React
  - TypeScript
  - Tailwind CSS
  - Shadcn/ui

- **Backend**

  - Next.js API Routes
  - Prisma ORM
  - PostgreSQL
  - AWS S3

- **Integracje**
  - Twitter API v2
  - Facebook Graph API
  - Instagram Graph API

## 📋 Wymagania

- Node.js 18+
- PostgreSQL 12+
- Konto AWS (dla S3)
- Konta deweloperskie na platformach społecznościowych

## 🔧 Konfiguracja platform społecznościowych

### Twitter

1. Utwórz aplikację na [Twitter Developer Portal](https://developer.twitter.com)
2. Skonfiguruj OAuth 2.0
3. Dodaj callback URL: `http://localhost:3000/api/auth/twitter/callback`

### Facebook

1. Utwórz aplikację na [Facebook Developers](https://developers.facebook.com)
2. Skonfiguruj Facebook Login
3. Dodaj callback URL: `http://localhost:3000/api/auth/facebook/callback`

### Instagram

1. Skonfiguruj Instagram Basic Display w aplikacji Facebook
2. Dodaj callback URL: `http://localhost:3000/api/auth/instagram/callback`

## 📝 Użycie

1. Zaloguj się do aplikacji
2. Połącz swoje konta społecznościowe
3. Utwórz nowy post:
   - Dodaj tekst
   - Wybierz media (opcjonalnie)
   - Wybierz konta docelowe
   - Zaplanuj publikację (opcjonalnie)
4. Opublikuj lub zaplanuj post

## 🤝 Współpraca

Zachęcamy do współpracy! Jeśli chcesz przyczynić się do rozwoju projektu:

1. Sforkuj repozytorium
2. Utwórz branch dla swojej funkcji (`git checkout -b feature/amazing-feature`)
3. Zatwierdź zmiany (`git commit -m 'Add amazing feature'`)
4. Wypushuj do brancha (`git push origin feature/amazing-feature`)
5. Otwórz Pull Request

## 📄 Licencja

Ten projekt jest udostępniany na licencji MIT. Szczegóły znajdziesz w pliku [LICENSE](LICENSE).

## 📞 Kontakt

Masz pytania lub sugestie? Otwórz issue.

## 🙏 Podziękowania

- [Next.js](https://nextjs.org)
- [Prisma](https://prisma.io)
- [Tailwind CSS](https://tailwindcss.com)
- [Shadcn/ui](https://ui.shadcn.com)
- Wszystkim kontrybutorom projektu
