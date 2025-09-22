import React from "react";
import { SUPPORTED_PLATFORMS, PLATFORM_DISPLAY } from "@/constants";

export default function PlatformsSection() {
  return (
    <section className="py-16 lg:py-24 relative" id="platforms">
      {/* Content */}
      <div className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 xl:px-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/70 px-3 py-1 text-sm text-blue-700 shadow-sm backdrop-blur mb-6">
              <span className="inline-flex h-2 w-2 rounded-full bg-blue-600 animate-pulse motion-reduce:animate-none" />
              Integracje platform
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Połącz wszystkie swoje kanały społecznościowe
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Zarządzaj swoją obecnością w mediach społecznościowych z jednego, zaawansowanego dashboardu
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
                  className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl flex flex-col items-center text-center transform transition-all duration-300 hover:-translate-y-1 group"
                >
                  <div className="w-16 h-16 flex items-center justify-center mb-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-blue-50 group-hover:to-indigo-50 transition-all duration-300">
                    <Icon className={`w-10 h-10 ${color} group-hover:scale-110 transition-transform duration-300`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">{label}</h3>
                  <p className="text-sm text-gray-600">{description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}