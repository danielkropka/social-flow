import { Menu } from "lucide-react";

export function DashboardHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="h-14 border-b border-gray-100 bg-white flex items-center px-4 sticky top-0 z-40 lg:hidden">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
      </button>
    </header>
  );
}
