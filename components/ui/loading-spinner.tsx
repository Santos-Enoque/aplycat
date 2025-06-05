import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-3",
  };

  return (
    <div
      className={cn(
        "border-blue-200 border-t-blue-600 rounded-full animate-spin",
        sizeClasses[size],
        className
      )}
    />
  );
}

// Simple loading text with spinner
export function LoadingText({
  text = "Loading...",
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 text-blue-600", className)}>
      <LoadingSpinner size="sm" />
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}

// CV Joke loader for smaller components
export function CVJokeLoader({ jokes }: { jokes: string[] }) {
  const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <LoadingSpinner size="lg" />
      <div className="text-center max-w-sm">
        <p className="text-sm text-gray-600 font-medium leading-relaxed">
          {randomJoke}
        </p>
      </div>
    </div>
  );
}
