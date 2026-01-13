export interface Goal {
  id: string;
  title: string;
  createdAt: Date;
  sortOrder?: number; // For drag and drop ordering
}

export interface GoalCompletion {
  goalId: string;
  date: string; // YYYY-MM-DD format
  completed: boolean;
}

export interface MonthData {
  year: number;
  month: number; // 0-11
  weeks: WeekData[];
}

export interface WeekData {
  startDate: Date;
  days: DayData[];
}

export interface DayData {
  date: Date;
  dayName: string;
  dateNumber: number;
}

