import React from "react";
import { SUPPORTED_PLATFORMS, PLATFORM_DISPLAY } from "@/constants";

export default function PlatformsSection() {
  return (
    <section className="py-16 lg:py-24 relative" id="platforms">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/50 to-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Wszystkie platformy w jednym miejscu
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Zarządzaj swoją obecnością w mediach społecznościowych z jednego,
            intuicyjnego dashboardu
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Object.values(SUPPORTED_PLATFORMS).map((platform) => {
            const {
              icon: Icon,
              color,
              label,
              description,
            } = PLATFORM_DISPLAY[platform];
            return (
              <div
                key={label}
                className="bg-white p-6 rounded-lg border border-gray-200 flex flex-col items-center text-center transform transition-transform duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="w-16 h-16 flex items-center justify-center mb-4">
                  <Icon className={`w-10 h-10 ${color}`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{label}</h3>
                <p className="text-sm text-gray-600">{description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
