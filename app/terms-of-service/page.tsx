export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold mb-8 text-gray-900 border-b pb-4">
            Regulamin
          </h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-8 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              Data ostatniej aktualizacji:{" "}
              {new Date().toLocaleDateString("pl-PL")}
            </p>

            <nav className="mb-8 bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2 text-gray-900">
                Spis treści:
              </h3>
              <ul className="space-y-1">
                <li>
                  <a
                    href="#postanowienia"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    1. Postanowienia ogólne
                  </a>
                </li>
                <li>
                  <a
                    href="#definicje"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    2. Definicje
                  </a>
                </li>
                <li>
                  <a
                    href="#warunki"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    3. Warunki korzystania
                  </a>
                </li>
                <li>
                  <a
                    href="#zasady"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    4. Zasady korzystania
                  </a>
                </li>
                <li>
                  <a
                    href="#odpowiedzialnosc"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    5. Odpowiedzialność
                  </a>
                </li>
                <li>
                  <a
                    href="#koncowe"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    6. Postanowienia końcowe
                  </a>
                </li>
                <li>
                  <a
                    href="#kontakt"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    7. Kontakt
                  </a>
                </li>
              </ul>
            </nav>

            <section id="postanowienia" className="mb-8 scroll-mt-20">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                1. Postanowienia ogólne
              </h2>
              <p className="text-base text-gray-700">
                Niniejszy regulamin określa zasady korzystania z serwisu Social
                Flow, który jest platformą do zarządzania mediami
                społecznościowymi.
              </p>
            </section>

            <section id="definicje" className="mb-8 scroll-mt-20">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                2. Definicje
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  <span className="font-medium">Serwis</span> - platforma Social
                  Flow dostępna pod adresem social-flow.pl
                </li>
                <li>
                  <span className="font-medium">Użytkownik</span> - osoba
                  fizyczna, prawna lub jednostka organizacyjna korzystająca z
                  Serwisu
                </li>
                <li>
                  <span className="font-medium">Usługa</span> - funkcjonalności
                  oferowane przez Serwis
                </li>
              </ul>
            </section>

            <section id="warunki" className="mb-8 scroll-mt-20">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                3. Warunki korzystania z serwisu
              </h2>
              <p className="text-gray-700 mb-2">
                Korzystanie z Serwisu jest możliwe pod warunkiem:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Posiadania urządzenia z dostępem do Internetu</li>
                <li>Posiadania aktywnego konta w Serwisie</li>
                <li>Akceptacji niniejszego Regulaminu</li>
              </ul>
            </section>

            <section id="zasady" className="mb-8 scroll-mt-20">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                4. Zasady korzystania z serwisu
              </h2>
              <p className="text-gray-700 mb-2">
                Użytkownik zobowiązuje się do:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Korzystania z Serwisu zgodnie z obowiązującym prawem</li>
                <li>Niepodejmowania działań zakłócających pracę Serwisu</li>
                <li>Nieudostępniania swoich danych logowania osobom trzecim</li>
                <li>Poszanowania praw własności intelektualnej</li>
              </ul>
            </section>

            <section id="odpowiedzialnosc" className="mb-8 scroll-mt-20">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                5. Odpowiedzialność
              </h2>
              <p className="text-base text-gray-700 mb-2">
                Serwis nie ponosi odpowiedzialności za:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  Przerwy w działaniu spowodowane przyczynami niezależnymi
                </li>
                <li>
                  Konsekwencje wynikające z nieprawidłowego korzystania z
                  Serwisu
                </li>
                <li>Treści publikowane przez Użytkowników</li>
              </ul>
            </section>

            <section id="koncowe" className="mb-8 scroll-mt-20">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                6. Postanowienia końcowe
              </h2>
              <p className="text-base text-gray-700">
                W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie
                mają odpowiednie przepisy prawa polskiego.
              </p>
            </section>

            <section id="kontakt" className="mb-8 scroll-mt-20">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                7. Kontakt
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 text-gray-900">
                    Dane kontaktowe
                  </h3>
                  <div className="space-y-3">
                    <p className="text-base text-gray-700 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 text-blue-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      <a
                        href="mailto:legal@social-flow.pl"
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        legal@social-flow.pl
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
