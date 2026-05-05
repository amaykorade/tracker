import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, addMonths, subMonths } from "date-fns";
import { MonthData, WeekData, DayData } from "@/types";

export function generateMonthData(year: number, month: number): MonthData {
  const monthStart = startOfMonth(new Date(year, month, 1));
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  const weeks: WeekData[] = [];
  let currentWeek: DayData[] = [];

  allDays.forEach((day) => {
    currentWeek.push({
      date: day,
      dayName: format(day, "EEE"),
      dateNumber: day.getDate(),
    });

    if (currentWeek.length === 7) {
      weeks.push({
        startDate: currentWeek[0].date,
        days: currentWeek,
      });
      currentWeek = [];
    }
  });

  return {
    year,
    month,
    weeks,
  };
}

export function formatMonthYear(year: number, month: number): string {
  return format(new Date(year, month, 1), "MMMM yyyy");
}

/**
 * Get the current "tracking date" based on 5 AM cutoff.
 * If current time is before 5 AM, return yesterday's date.
 * Otherwise, return today's date.
 * Uses local timezone to avoid timezone issues.
 */
export function getTrackingDate(): Date {
  const now = new Date();
  const currentHour = now.getHours();
  
  // If it's before 5 AM, use yesterday's date
  if (currentHour < 5) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    return yesterday;
  }
  
  // Otherwise, use today's date
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Format date as YYYY-MM-DD string for consistent date key format
 * Handles both Date objects and date strings
 */
export function formatDateKey(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, "yyyy-MM-dd");
}

/** Calendar date key (YYYY-MM-DD) for when the goal was added — tracking counts only from this day onward. */
export function goalCreatedDateKey(goal: { createdAt: Date }): string {
  const c =
    goal.createdAt instanceof Date ? goal.createdAt : new Date(goal.createdAt as unknown as string);
  return format(c, "yyyy-MM-dd");
}

export function isGoalTrackedOnDateKey(goal: { createdAt: Date }, dateKey: string): boolean {
  return dateKey >= goalCreatedDateKey(goal);
}

/** Parse YYYY-MM-DD as local midnight-safe calendar date. */
export function parseYmdToLocalDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Compare a date string (YYYY-MM-DD) with the current tracking date
 * Returns: -1 if past, 0 if today, 1 if future
 */
export function compareWithTrackingDate(dateString: string): number {
  const trackingDate = getTrackingDate();
  const dateToCheck = new Date(dateString + 'T00:00:00'); // Use local timezone
  dateToCheck.setHours(0, 0, 0, 0);
  
  const trackingTime = trackingDate.getTime();
  const checkTime = dateToCheck.getTime();
  
  if (checkTime < trackingTime) return -1; // Past
  if (checkTime > trackingTime) return 1; // Future
  return 0; // Today
}

export function getMonthRange(startMonth: number, startYear: number, count: number): Array<{ year: number; month: number }> {
  const months: Array<{ year: number; month: number }> = [];
  for (let i = 0; i < count; i++) {
    const date = addMonths(new Date(startYear, startMonth, 1), i);
    months.push({
      year: date.getFullYear(),
      month: date.getMonth(),
    });
  }
  return months;
}

