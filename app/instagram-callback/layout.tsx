import { Suspense } from "react";

export default function InstagramCallbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="h-16 bg-white border-b border-gray-200 flex items-center px-4">
        <div className="max-w-6xl mx-auto w-full flex items-center">
          <h1 className="text-xl font-semibold text-gray-900">Social Flow</h1>
        </div>
      </div>
      <Suspense>{children}</Suspense>
    </div>
  );
}
