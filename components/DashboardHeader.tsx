import { Menu } from "lucide-react";

export function DashboardHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="h-16 border-b border-gray-100 bg-white flex items-center justify-between px-6 sticky top-0 z-40 lg:hidden">
      <span className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-transparent bg-clip-text">
        Social Flow
      </span>
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>
      </div>
    </header>
  );
}
