export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Polityka Prywatności</h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 mb-6">
          Data ostatniej aktualizacji: {new Date().toLocaleDateString("pl-PL")}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Informacje ogólne</h2>
          <p>
            Niniejsza polityka prywatności określa zasady przetwarzania i
            ochrony danych osobowych przekazanych przez Użytkowników w związku z
            korzystaniem przez nich z serwisu Social Flow.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            2. Administrator danych
          </h2>
          <p>
            Administratorem danych osobowych zawartych w serwisie jest Social
            Flow.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            3. Cel i zakres zbierania danych
          </h2>
          <p>Dane osobowe Użytkowników są zbierane w celu:</p>
          <ul className="list-disc pl-6 mt-2">
            <li>Świadczenia usług drogą elektroniczną</li>
            <li>Obsługi konta użytkownika</li>
            <li>Obsługi procesu logowania</li>
            <li>Realizacji zamówień</li>
            <li>Komunikacji z użytkownikiem</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Prawa użytkownika</h2>
          <p>Użytkownik ma prawo do:</p>
          <ul className="list-disc pl-6 mt-2">
            <li>Dostępu do swoich danych osobowych</li>
            <li>Sprostowania danych osobowych</li>
            <li>Usunięcia danych osobowych</li>
            <li>Ograniczenia przetwarzania danych osobowych</li>
            <li>Przenoszenia danych osobowych</li>
            <li>Wniesienia sprzeciwu wobec przetwarzania danych osobowych</li>
            <li>Cofnięcia zgody na przetwarzanie danych osobowych</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Pliki cookies</h2>
          <p>
            Serwis korzysta z plików cookies. Pliki cookies to dane
            informatyczne, w szczególności pliki tekstowe, które przechowywane
            są w urządzeniu końcowym Użytkownika i przeznaczone są do
            korzystania ze stron internetowych.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Kontakt</h2>
          <p>
            W sprawach związanych z ochroną danych osobowych można kontaktować
            się z nami pod adresem email: privacy@socialflow.com
          </p>
        </section>
      </div>
    </div>
  );
}
