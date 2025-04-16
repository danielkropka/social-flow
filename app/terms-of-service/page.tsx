export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Regulamin</h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 mb-6">
          Data ostatniej aktualizacji: {new Date().toLocaleDateString("pl-PL")}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            1. Postanowienia ogólne
          </h2>
          <p>
            Niniejszy regulamin określa zasady korzystania z serwisu Social
            Flow, który jest platformą do zarządzania mediami społecznościowymi.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Definicje</h2>
          <ul className="list-disc pl-6">
            <li>
              Serwis - platforma Social Flow dostępna pod adresem socialflow.com
            </li>
            <li>
              Użytkownik - osoba fizyczna, prawna lub jednostka organizacyjna
              korzystająca z Serwisu
            </li>
            <li>Usługa - funkcjonalności oferowane przez Serwis</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            3. Warunki korzystania z serwisu
          </h2>
          <p>Korzystanie z Serwisu jest możliwe pod warunkiem:</p>
          <ul className="list-disc pl-6 mt-2">
            <li>Posiadania urządzenia z dostępem do Internetu</li>
            <li>Posiadania aktywnego konta w Serwisie</li>
            <li>Akceptacji niniejszego Regulaminu</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            4. Zasady korzystania z serwisu
          </h2>
          <p>Użytkownik zobowiązuje się do:</p>
          <ul className="list-disc pl-6 mt-2">
            <li>Korzystania z Serwisu zgodnie z obowiązującym prawem</li>
            <li>Niepodejmowania działań zakłócających pracę Serwisu</li>
            <li>Nieudostępniania swoich danych logowania osobom trzecim</li>
            <li>Poszanowania praw własności intelektualnej</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Odpowiedzialność</h2>
          <p>Serwis nie ponosi odpowiedzialności za:</p>
          <ul className="list-disc pl-6 mt-2">
            <li>Przerwy w działaniu spowodowane przyczynami niezależnymi</li>
            <li>
              Konsekwencje wynikające z nieprawidłowego korzystania z Serwisu
            </li>
            <li>Treści publikowane przez Użytkowników</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            6. Postanowienia końcowe
          </h2>
          <p>
            W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie mają
            odpowiednie przepisy prawa polskiego.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Kontakt</h2>
          <p>
            W sprawach związanych z Regulaminem można kontaktować się z nami pod
            adresem email: legal@socialflow.com
          </p>
        </section>
      </div>
    </div>
  );
}
