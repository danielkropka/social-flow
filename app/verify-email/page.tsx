"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const uid = searchParams.get("uid");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const verify = async () => {
      if (!token || !uid) {
        setStatus("error");
        setMessage("Brak wymaganych danych do weryfikacji.");
        return;
      }
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, uid }),
        });
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(
            data.message ||
              "Email został zweryfikowany. Możesz się teraz zalogować."
          );
        } else {
          setStatus("error");
          setMessage(data.error || "Weryfikacja nie powiodła się.");
        }
      } catch (e) {
        setStatus("error");
        setMessage("Wystąpił błąd połączenia z serwerem.");
      }
    };
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      {status === "loading" && (
        <>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
          <p className="text-lg font-medium">
            Trwa weryfikacja adresu email...
          </p>
        </>
      )}
      {status === "success" && (
        <>
          <div className="text-green-600 text-4xl mb-2">✓</div>
          <p className="text-lg font-semibold mb-2">Sukces!</p>
          <p>{message}</p>
        </>
      )}
      {status === "error" && (
        <>
          <div className="text-red-600 text-4xl mb-2">✗</div>
          <p className="text-lg font-semibold mb-2">Błąd weryfikacji</p>
          <p>{message}</p>
        </>
      )}
    </div>
  );
}
