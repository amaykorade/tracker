"use client";

import { MonthData } from "@/types";
import { formatDateKey } from "@/lib/date-utils";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DatesHeaderProps {
  months: MonthData[];
}

export function DatesHeader({ months }: DatesHeaderProps) {
  // Get all dates from all months with week and month information
  const allDates: Array<{ 
    date: Date; 
    isCurrentMonth: boolean; 
    dayOfWeek: number; // 0 = Sunday, 6 = Saturday
    isWeekEnd: boolean; // true if it's Saturday (end of week)
    isMonthStart: boolean; // true if this is the first day of a new month
    monthYear: string; // "YYYY-MM" format for month identification
  }> = [];
  
  let previousDate: Date | null = null;
  let lastSeenMonthYear: string | null = null;
  
  months.forEach((month) => {
    month.weeks.forEach((week) => {
      week.days.forEach((day) => {
        // Filter out dates from 2025
        if (day.date.getFullYear() === 2025) {
          return;
        }
        
        const dayOfWeek = day.date.getDay(); // 0 = Sunday, 6 = Saturday
        const monthYear = `${day.date.getFullYear()}-${day.date.getMonth()}`;
        const isFirstDayOfMonth = day.date.getDate() === 1;
        
        // Check if this is the start of a new month
        let isMonthStart = false;
        if (previousDate === null) {
          // First date is always a month start
          isMonthStart = true;
          lastSeenMonthYear = monthYear;
        } else {
          // Check if this is the first day of a month we haven't seen yet
          if (isFirstDayOfMonth && lastSeenMonthYear !== monthYear) {
            isMonthStart = true;
            lastSeenMonthYear = monthYear;
          }
        }
        
        allDates.push({
          date: day.date,
          isCurrentMonth: day.date.getMonth() === month.month,
          dayOfWeek,
          isWeekEnd: dayOfWeek === 6, // Saturday is week end
          isMonthStart,
          monthYear,
        });
        
        previousDate = day.date;
      });
    });
  });

  return (
    <div className="flex flex-col gap-2 min-w-max">
      {/* Month Labels Row - Compact */}
      <div className="flex gap-1 pb-1 min-w-max items-end">
        {allDates.flatMap(({ date, isMonthStart, isWeekEnd }, index) => {
          const elements = [];
          
          // Add month separator BEFORE the first date of new month
          if (isMonthStart) {
            elements.push(
              <div
                key={`month-separator-label-${index}`}
                className="w-2 mx-1.5 flex-shrink-0"
              />
            );
          }
          // Add week end separator after Saturday (if not a month start)
          else if (isWeekEnd && index > 0) {
            const nextDate = allDates[index + 1];
            if (!nextDate || !nextDate.isMonthStart) {
              elements.push(
                <div
                  key={`week-separator-label-${index}`}
                  className="w-1 mx-1 flex-shrink-0"
                />
              );
            }
          }
          
          // Show month label at the start of each month
          if (isMonthStart || index === 0) {
            elements.push(
              <div
                key={`month-label-${index}`}
                className="w-8 sm:w-10 text-center flex-shrink-0"
              >
                <div className="text-[9px] sm:text-[10px] font-semibold text-primary leading-tight">
                  {format(date, "MMM")}
                </div>
                <div className="text-[8px] sm:text-[9px] text-muted-foreground leading-tight">
                  {format(date, "yy")}
                </div>
              </div>
            );
          } else {
            // Empty spacer for other days
            elements.push(<div key={`month-spacer-${index}`} className="w-8 sm:w-10 flex-shrink-0" />);
          }
          
          return elements;
        })}
      </div>
      
      {/* Dates Row - Compact - Must match checkbox row exactly */}
      <div className="flex gap-1 min-w-max">
        {allDates.flatMap(({ date, isCurrentMonth, isWeekEnd, isMonthStart }, index) => {
          const dateKey = formatDateKey(date);
          const elements = [];
          
          // Add month separator BEFORE the first date of new month (after previous month ends)
          if (isMonthStart) {
            elements.push(
              <div
                key={`month-separator-${index}`}
                className="w-2 bg-primary/70 mx-1.5 self-stretch rounded flex-shrink-0"
                aria-label="Month start"
                title={`${format(date, "MMMM yyyy")} start`}
              />
            );
          }
          // Add week end separator after Saturday (if not a month start)
          else if (isWeekEnd && index > 0) {
            // Check if next date is a month start - if so, don't show week separator
            const nextDate = allDates[index + 1];
            if (!nextDate || !nextDate.isMonthStart) {
              elements.push(
                <div
                  key={`week-separator-${index}`}
                  className="w-1 bg-primary/40 mx-1 self-stretch rounded flex-shrink-0"
                  aria-label="Week end"
                  title="Week end"
                />
              );
            }
          }
          
          // Add the date element - must match checkbox width exactly
          elements.push(
              <div
                key={`${dateKey}-${index}`}
                className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 text-center flex flex-col items-center justify-center relative flex-shrink-0",
                  !isCurrentMonth && "opacity-30"
                )}
              >
                <div className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                  {format(date, "EEE")}
                </div>
                <div className="text-[10px] sm:text-xs">{format(date, "d")}</div>
              </div>
          );
          
          return elements;
        })}
      </div>
    </div>
  );
}

