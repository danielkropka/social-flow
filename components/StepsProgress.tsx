import React from "react";
import { cn } from "@/lib/utils";

interface Step {
  number: number;
  title: string;
}

interface StepsProgressProps {
  steps: Step[];
  currentStep: number;
}

export function StepsProgress({ steps, currentStep }: StepsProgressProps) {
  return (
    <div className="flex items-center justify-between mb-8 sm:mb-12 px-2 sm:px-4 max-w-2xl mx-auto">
      {steps.map((step, index) => (
        <div
          key={step.number}
          className="flex items-center relative flex-1 last:flex-initial"
        >
          <div className="flex flex-col items-center relative">
            <div
              className={cn(
                "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold transition-all duration-200 shadow-sm",
                step.number <= currentStep
                  ? "bg-blue-600 text-white ring-2 ring-blue-200"
                  : "bg-gray-100 text-gray-400 ring-2 ring-gray-200"
              )}
            >
              {step.number}
            </div>
            <span
              className={cn(
                "absolute -bottom-6 text-xs sm:text-sm whitespace-nowrap transition-colors duration-200",
                step.number <= currentStep
                  ? "text-gray-900 font-medium"
                  : "text-gray-500"
              )}
            >
              {step.title}
            </span>
          </div>

          {index < steps.length - 1 && (
            <div className="relative flex-1 mx-2 sm:mx-4">
              <div className="absolute inset-0 flex items-center">
                <div
                  className={cn(
                    "h-0.5 sm:h-1 w-full transition-colors duration-200",
                    step.number < currentStep ? "bg-blue-600" : "bg-gray-200"
                  )}
                />
              </div>
              {step.number < currentStep && (
                <div className="absolute inset-0 flex items-center">
                  <div className="h-0.5 sm:h-1 w-full bg-blue-600 animate-progress" />
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
