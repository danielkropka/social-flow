import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-500 mb-4 md:mb-0">
            © {new Date().getFullYear()} Social Flow. Wszelkie prawa
            zastrzeżone.
          </div>
          <div className="flex space-x-6">
            <Link
              href="/privacy-policy"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Polityka prywatności
            </Link>
            <Link
              href="/terms-of-service"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Regulamin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
