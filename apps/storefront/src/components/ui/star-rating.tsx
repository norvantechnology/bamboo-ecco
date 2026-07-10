import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  rating: number;
  max?: number;
  className?: string;
}

export function StarRating({ rating, max = 5, className }: Props) {
  return (
    <div className={cn("flex gap-0.5", className)} aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={cn("h-4 w-4", i < rating ? "fill-gold text-gold" : "text-border")}
          strokeWidth={1.5}
          aria-hidden
        />
      ))}
    </div>
  );
}
