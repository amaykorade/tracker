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

export function formatDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
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

