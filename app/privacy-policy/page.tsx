export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold mb-8 text-gray-900 border-b pb-4">
            Polityka Prywatności
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
              <h3 className="font-semibold mb-2">Spis treści:</h3>
              <ul className="space-y-1">
                <li>
                  <a
                    href="#informacje"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    1. Informacje ogólne
                  </a>
                </li>
                <li>
                  <a
                    href="#administrator"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    2. Administrator danych
                  </a>
                </li>
                <li>
                  <a href="#cel" className="text-blue-600 hover:text-blue-800">
                    3. Cel i zakres zbierania danych
                  </a>
                </li>
                <li>
                  <a
                    href="#prawa"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    4. Prawa użytkownika
                  </a>
                </li>
                <li>
                  <a
                    href="#cookies"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    5. Pliki cookies
                  </a>
                </li>
                <li>
                  <a
                    href="#kontakt"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    6. Kontakt
                  </a>
                </li>
              </ul>
            </nav>

            <section id="informacje" className="mb-8 scroll-mt-20">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                1. Informacje ogólne
              </h2>
              <p className="text-gray-700">
                Niniejsza polityka prywatności określa zasady przetwarzania i
                ochrony danych osobowych przekazanych przez Użytkowników w
                związku z korzystaniem przez nich z serwisu Social Flow.
              </p>
            </section>

            <section id="administrator" className="mb-8 scroll-mt-20">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                2. Administrator danych
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  Administratorem danych osobowych zawartych w serwisie jest
                  Social Flow.
                </p>
              </div>
            </section>

            <section id="cel" className="mb-8 scroll-mt-20">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                3. Cel i zakres zbierania danych
              </h2>
              <p className="text-gray-700 mb-2">
                Dane osobowe Użytkowników są zbierane w celu:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Świadczenia usług drogą elektroniczną</li>
                <li>Obsługi konta użytkownika</li>
                <li>Obsługi procesu logowania</li>
                <li>Realizacji zamówień</li>
                <li>Komunikacji z użytkownikiem</li>
              </ul>
            </section>

            <section id="prawa" className="mb-8 scroll-mt-20">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                4. Prawa użytkownika
              </h2>
              <p className="text-gray-700 mb-2">Użytkownik ma prawo do:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Dostępu do swoich danych osobowych</li>
                <li>Sprostowania danych osobowych</li>
                <li>Usunięcia danych osobowych</li>
                <li>Ograniczenia przetwarzania danych osobowych</li>
                <li>Przenoszenia danych osobowych</li>
                <li>
                  Wniesienia sprzeciwu wobec przetwarzania danych osobowych
                </li>
                <li>Cofnięcia zgody na przetwarzanie danych osobowych</li>
              </ul>
            </section>

            <section id="cookies" className="mb-8 scroll-mt-20">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                5. Pliki cookies
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  Serwis korzysta z plików cookies. Pliki cookies to dane
                  informatyczne, w szczególności pliki tekstowe, które
                  przechowywane są w urządzeniu końcowym Użytkownika i
                  przeznaczone są do korzystania ze stron internetowych.
                </p>
              </div>
            </section>

            <section id="kontakt" className="mb-8 scroll-mt-20">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                6. Kontakt
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 text-gray-900">
                    Dane kontaktowe
                  </h3>
                  <div className="space-y-3">
                    <p className="text-gray-700 flex items-center">
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
                        href="mailto:privacy@social-flow.pl"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        privacy@social-flow.pl
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
