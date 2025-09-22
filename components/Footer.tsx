import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative">
      {/* Subtle top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200/30 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent hover:from-blue-600 hover:to-blue-700 transition-colors"
            >
              Social Flow
            </Link>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-500">
              © {new Date().getFullYear()}
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
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
            <Link
              href="mailto:kontakt@social-flow.pl"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Kontakt
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}