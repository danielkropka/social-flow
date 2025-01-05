"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function SuccessPage() {
  const { data: session, update } = useSession();
  const [sessionUpdated, setSessionUpdated] = useState(false);

  useEffect(() => {
    if (session && !sessionUpdated) {
      update().then(() => setSessionUpdated(true));
    }
  }, [session, sessionUpdated, update]);

  return (
    <div className="relative flex flex-col items-center justify-center h-screen bg-gradient-to-b from-white via-gray-50/50 to-white text-gray-800 overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
      <div className="relative z-10 flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-lg max-w-lg">
        <svg
          className="w-16 h-16 text-blue-600 mb-4 animate-pulse"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        <h1 className="text-3xl font-semibold mt-4">Sukces!</h1>
        <p className="text-md mt-2 max-w-sm text-center text-gray-600">
          Twoja subskrypcja została pomyślnie zaktualizowana.
        </p>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Dziękujemy za zaufanie! Twoja subskrypcja jest teraz aktywna i
            możesz cieszyć się wszystkimi korzyściami.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Jeśli masz jakiekolwiek pytania, skontaktuj się z naszym zespołem
            wsparcia.
          </p>
        </div>
        <Link
          href="/dashboard"
          className={`inline-block px-5 py-2 my-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 ${buttonVariants(
            { variant: "default" }
          )}`}
        >
          Przejdź do Panelu
        </Link>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Chcesz dowiedzieć się więcej? Odwiedź nasz{" "}
            <a href="/faq" className="text-blue-600 hover:underline">
              FAQ
            </a>{" "}
            lub{" "}
            <a href="/contact" className="text-blue-600 hover:underline">
              skontaktuj się z nami
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
