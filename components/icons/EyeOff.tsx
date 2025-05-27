import * as React from "react";

export function EyeOffIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-5 h-5"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 002.25 12s3.75 7.5 9.75 7.5c2.042 0 3.82-.393 5.282-1.023M6.53 6.53A7.477 7.477 0 0112 4.5c6 0 9.75 7.5 9.75 7.5a10.45 10.45 0 01-4.21 4.774M15 12a3 3 0 11-6 0 3 3 0 016 0zM3 3l18 18"
      />
    </svg>
  );
}
