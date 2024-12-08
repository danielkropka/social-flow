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
    <div className="flex items-center justify-between mb-4 sm:mb-8 px-2 sm:px-4">
      {steps.map((step, index) => (
        <div
          key={step.number}
          className="flex items-center relative flex-1 last:flex-initial"
        >
          <div className="flex flex-col items-center relative">
            <div
              className={cn(
                "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm sm:text-base",
                step.number <= currentStep
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              )}
            >
              {step.number}
            </div>
            <span className="absolute -bottom-6 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
              {step.title}
            </span>
          </div>

          {index < steps.length - 1 && (
            <div
              className={cn(
                "h-0.5 sm:h-1 flex-1 mx-2 sm:mx-4",
                step.number < currentStep ? "bg-blue-600" : "bg-gray-200"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
