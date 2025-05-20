"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-[#f9fafb] py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
      <div className="max-w-2xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: "3rem" }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            style={{ display: "inline-block", marginBottom: "1.5rem" }}
          >
            <CheckCircle2 className="w-20 h-20 text-[#3b82f6] mx-auto" />
          </motion.div>

          <motion.h1
            {...fadeInUp}
            style={{
              fontSize: "2.25rem",
              fontWeight: "bold",
              color: "#111827",
              marginBottom: "1rem",
            }}
          >
            Dziękujemy za zakup!
          </motion.h1>

          <motion.p
            {...fadeInUp}
            transition={{ delay: 0.1 }}
            style={{
              fontSize: "1.25rem",
              color: "#4B5563",
              marginBottom: "1rem",
            }}
          >
            Twoja subskrypcja została aktywowana i jest już gotowa do użycia.
          </motion.p>

          <motion.p
            {...fadeInUp}
            transition={{ delay: 0.2 }}
            style={{ fontSize: "1rem", color: "#6B7280", marginBottom: "3rem" }}
          >
            Cieszymy się, że jesteś z nami. Od teraz możesz w pełni korzystać z
            możliwości naszej platformy bez żadnych ograniczeń.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ textAlign: "center" }}
        >
          <Link
            href="/dashboard"
            className={`px-8 py-3 bg-[#3b82f6] text-white font-medium hover:bg-[#3b82f6]/90 transition-colors duration-200 ${buttonVariants(
              { variant: "default" }
            )}`}
          >
            Przejdź do panelu
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
