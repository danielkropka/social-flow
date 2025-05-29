import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { UseFormReturn } from "react-hook-form";
import type { SocialAccount } from "@/types";
import type { PostFormValues } from "./PostCreationForm";
import { ReactNode } from "react";

// Dodaj lokalnie typ rozszerzony:
type SocialAccountWithExtraFields = SocialAccount & {
  provider: string;
  username: string;
  providerAccountId: string;
};

interface PostTextSectionProps {
  isTextOnly: boolean;
  form: UseFormReturn<PostFormValues>;
  selectedAccounts: SocialAccount[];
  getAvailablePlatforms: () => { id: string; maxChars: number }[];
}

export function PostTextSection({
  isTextOnly,
  form,
  selectedAccounts,
  getAvailablePlatforms,
}: PostTextSectionProps) {
  // Wyznacz minimalny limit znaków dla wybranych kont
  const minChars = selectedAccounts.length
    ? Math.min(
        ...selectedAccounts.map((account) => {
          const platform = getAvailablePlatforms().find(
            (p) =>
              p.id ===
              (account as SocialAccountWithExtraFields).provider?.toLowerCase()
          );
          return platform?.maxChars || Infinity;
        })
      )
    : Infinity;

  return isTextOnly ? (
    <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-3">
        <Label className="text-base font-medium text-gray-900">
          Tekst posta
        </Label>
      </div>
      <div className="relative">
        <Textarea
          {...form.register("text")}
          placeholder={
            selectedAccounts.length === 0
              ? "Najpierw wybierz konto, aby dodać tekst..."
              : "Wpisz tekst posta..."
          }
          disabled={selectedAccounts.length === 0}
          readOnly={selectedAccounts.length === 0}
          className={cn(
            "min-h-[120px] text-base resize-none transition-all duration-200 bg-gray-50 border-gray-200",
            form.formState.errors.text
              ? "border-red-500 focus-visible:ring-red-500"
              : "hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500",
            selectedAccounts.length === 0 &&
              "cursor-not-allowed opacity-75 pointer-events-none"
          )}
        />
        {selectedAccounts.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 rounded-lg pointer-events-none">
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-1.5 rounded-full shadow-sm">
              <Info className="h-4 w-4" />
              <span>Wybierz konto, aby dodać tekst</span>
            </div>
          </div>
        )}
      </div>
      {form.formState.errors.text && (
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-2 rounded-md animate-fade-in mt-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p>
            {typeof form.formState.errors.text === "object" &&
            form.formState.errors.text?.message
              ? String(form.formState.errors.text.message)
              : String(form.formState.errors.text)}
          </p>
        </div>
      )}
    </div>
  ) : (
    <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-3">
        <Label htmlFor="text" className="text-base font-medium text-gray-900">
          Tekst posta
        </Label>
        {selectedAccounts.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <span
                className={cn(
                  "font-medium",
                  form.watch("text")?.length > minChars
                    ? "text-red-500"
                    : "text-gray-700"
                )}
              >
                {form.watch("text")?.length || 0}
              </span>
              <span>/</span>
              <span className="font-medium text-gray-700">{minChars}</span>
            </div>
            <span className="text-sm text-gray-500">znaków</span>
          </div>
        )}
      </div>
      <div className="relative">
        <Textarea
          {...form.register("text")}
          placeholder={
            selectedAccounts.length === 0
              ? "Najpierw wybierz konto, aby dodać tekst..."
              : "Wpisz tekst posta..."
          }
          disabled={selectedAccounts.length === 0}
          readOnly={selectedAccounts.length === 0}
          className={cn(
            "min-h-[120px] text-base resize-none transition-all duration-200 bg-gray-50 border-gray-200",
            form.formState.errors.text
              ? "border-red-500 focus-visible:ring-red-500"
              : "hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500",
            selectedAccounts.length === 0 &&
              "cursor-not-allowed opacity-75 pointer-events-none"
          )}
        />
        {selectedAccounts.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 rounded-lg pointer-events-none">
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-1.5 rounded-full shadow-sm">
              <Info className="h-4 w-4" />
              <span>Wybierz konto, aby dodać tekst</span>
            </div>
          </div>
        )}
      </div>
      {form.formState.errors.text && (
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-2 rounded-md animate-fade-in mt-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p>
            {typeof form.formState.errors.text === "object" &&
            form.formState.errors.text?.message
              ? String(form.formState.errors.text.message)
              : String(form.formState.errors.text)}
          </p>
        </div>
      )}
    </div>
  );
}
