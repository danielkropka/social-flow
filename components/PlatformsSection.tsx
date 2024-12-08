import React from "react";
import { motion } from "framer-motion";
import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react";

export default function PlatformsSection() {
  return (
    <section className="py-16 lg:py-24 relative">
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
          {platforms.map((platform, index) => (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.2 }}
              whileHover={{
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                y: -2,
              }}
              style={{
                background: "white",
                padding: "1.5rem",
                borderRadius: "0.75rem",
                border: "1px solid rgb(229 231 235)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <div className="w-16 h-16 flex items-center justify-center mb-4">
                <platform.icon className={`w-10 h-10 ${platform.color}`} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {platform.name}
              </h3>
              <p className="text-sm text-gray-600">{platform.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const platforms = [
  {
    name: "Facebook",
    icon: Facebook,
    color: "text-[#1877F2]",
    description: "Posty, stories i zarządzanie grupami",
  },
  {
    name: "Instagram",
    icon: Instagram,
    color: "text-[#E4405F]",
    description: "Zdjęcia, reels i stories",
  },
  {
    name: "Twitter",
    icon: Twitter,
    color: "text-[#1DA1F2]",
    description: "Tweety i wątki",
  },
  {
    name: "LinkedIn",
    icon: Linkedin,
    color: "text-[#0A66C2]",
    description: "Posty biznesowe i artykuły",
  },
];
