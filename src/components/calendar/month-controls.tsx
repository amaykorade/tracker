"use client";

import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, subMonths, format } from "date-fns";

interface MonthControlsProps {
  months: Array<{ year: number; month: number }>;
  onAddMonth: () => void;
  onRemoveMonth: (index: number) => void;
  onScroll: (direction: "left" | "right") => void;
}

export function MonthControls({
  months,
  onAddMonth,
  onScroll,
}: MonthControlsProps) {
  if (months.length === 0) return null;

  const firstMonth = months[0];
  const lastMonth = months[months.length - 1];

  return (
    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onScroll("left")}
        className="h-8 w-8 p-0 touch-manipulation"
        title="Scroll left"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap px-1">
        {format(new Date(firstMonth.year, firstMonth.month, 1), "MMM yyyy")} -{" "}
        {format(new Date(lastMonth.year, lastMonth.month, 1), "MMM yyyy")}
      </span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onScroll("right")}
        className="h-8 w-8 p-0 touch-manipulation"
        title="Scroll right"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="outline" onClick={onAddMonth} className="h-8 text-xs">
        <Plus className="h-3 w-3 mr-1" />
        <span className="hidden sm:inline">Month</span>
      </Button>
    </div>
  );
}

