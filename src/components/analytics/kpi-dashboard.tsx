"use client";

import { Goal, GoalCompletion } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, eachDayOfInterval, startOfWeek, endOfWeek, eachWeekOfInterval, getDay, startOfMonth, endOfMonth, eachMonthOfInterval, isSameMonth, isSameDay } from "date-fns";
import { formatDateKey } from "@/lib/date-utils";

interface KPIDashboardProps {
  goals: Goal[];
  completions: Map<string, GoalCompletion>;
  months: Array<{ year: number; month: number }>;
}

export function KPIDashboard({
  goals,
  completions,
  months,
}: KPIDashboardProps) {
  // Calculate overall completion rate based on actual months
  const totalDays = months.reduce((acc, { year, month }) => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    return acc + monthEnd.getDate();
  }, 0);
  const totalPossibleCompletions = goals.length * totalDays;
  const totalCompletions = completions.size;
  const completionRate =
    totalPossibleCompletions > 0
      ? ((totalCompletions / totalPossibleCompletions) * 100).toFixed(1)
      : "0";

  // Calculate daily completion data for the last 30 days
  const last30Days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date(),
  });

  const dailyData = last30Days.map((date) => {
    const dateKey = formatDateKey(date);
    let completed = 0;
    goals.forEach((goal) => {
      if (completions.has(`${goal.id}-${dateKey}`)) {
        completed++;
      }
    });
    return {
      date: format(date, "MMM dd"),
      completed,
      total: goals.length,
    };
  });

  // Calculate goal-wise completion data
  const goalData = goals.map((goal) => {
    let completed = 0;
    completions.forEach((completion) => {
      if (completion.goalId === goal.id) {
        completed++;
      }
    });
    return {
      name: goal.title.length > 15 ? goal.title.substring(0, 15) + "..." : goal.title,
      completed,
      percentage: months.length > 0 
        ? ((completed / (goals.length * months.length * 30)) * 100).toFixed(0)
        : 0,
    };
  });

  // Calculate streak data
  const currentStreak = calculateCurrentStreak(goals, completions);
  const longestStreak = calculateLongestStreak(goals, completions);

  // Calculate Average Daily Completions
  const allCompletionDates = new Set<string>();
  completions.forEach((completion) => {
    allCompletionDates.add(completion.date);
  });
  const totalDaysWithCompletions = allCompletionDates.size;
  const averageDailyCompletions = totalDaysWithCompletions > 0
    ? (totalCompletions / totalDaysWithCompletions).toFixed(1)
    : "0";

  // Calculate Consistency Score (days with at least one completion / total days)
  const firstCompletionDate = completions.size > 0
    ? new Date(Math.min(...Array.from(completions.values()).map(c => new Date(c.date).getTime())))
    : new Date();
  const daysSinceStart = Math.max(1, Math.floor((new Date().getTime() - firstCompletionDate.getTime()) / (1000 * 60 * 60 * 24)));
  const consistencyScore = daysSinceStart > 0
    ? ((totalDaysWithCompletions / daysSinceStart) * 100).toFixed(1)
    : "0";

  // Calculate Completion by Day of Week
  const dayOfWeekData = [
    { name: "Sun", day: 0, completed: 0, total: 0 },
    { name: "Mon", day: 1, completed: 0, total: 0 },
    { name: "Tue", day: 2, completed: 0, total: 0 },
    { name: "Wed", day: 3, completed: 0, total: 0 },
    { name: "Thu", day: 4, completed: 0, total: 0 },
    { name: "Fri", day: 5, completed: 0, total: 0 },
    { name: "Sat", day: 6, completed: 0, total: 0 },
  ];

  completions.forEach((completion) => {
    const date = new Date(completion.date);
    const dayOfWeek = getDay(date);
    const dayData = dayOfWeekData.find(d => d.day === dayOfWeek);
    if (dayData) {
      dayData.completed++;
    }
  });

  // Calculate total possible completions per day of week
  if (goals.length > 0 && months.length > 0) {
    months.forEach(({ year, month }) => {
      const monthStart = startOfMonth(new Date(year, month, 1));
      const monthEnd = endOfMonth(monthStart);
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
      days.forEach((day) => {
        const dayOfWeek = getDay(day);
        const dayData = dayOfWeekData.find(d => d.day === dayOfWeek);
        if (dayData) {
          dayData.total += goals.length;
        }
      });
    });
  }

  dayOfWeekData.forEach((day) => {
    day.completed = day.total > 0 ? ((day.completed / day.total) * 100) : 0;
  });

  // Calculate Monthly Comparison
  const monthlyData: Array<{ month: string; completed: number; total: number; rate: number }> = [];
  months.forEach(({ year, month }) => {
    const monthStart = startOfMonth(new Date(year, month, 1));
    const monthEnd = endOfMonth(monthStart);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    let monthCompleted = 0;
    let monthTotal = goals.length * days.length;

    days.forEach((day) => {
      const dateKey = formatDateKey(day);
      goals.forEach((goal) => {
        if (completions.has(`${goal.id}-${dateKey}`)) {
          monthCompleted++;
        }
      });
    });

    monthlyData.push({
      month: format(monthStart, "MMM yyyy"),
      completed: monthCompleted,
      total: monthTotal,
      rate: monthTotal > 0 ? (monthCompleted / monthTotal) * 100 : 0,
    });
  });

  // Calculate Goal Completion Percentage (for pie chart)
  const goalCompletionData = goals.map((goal) => {
    let goalCompleted = 0;
    let goalTotal = 0;

    months.forEach(({ year, month }) => {
      const monthStart = startOfMonth(new Date(year, month, 1));
      const monthEnd = endOfMonth(monthStart);
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
      goalTotal += days.length;

      days.forEach((day) => {
        const dateKey = formatDateKey(day);
        if (completions.has(`${goal.id}-${dateKey}`)) {
          goalCompleted++;
        }
      });
    });

    return {
      name: goal.title.length > 20 ? goal.title.substring(0, 20) + "..." : goal.title,
      value: goalTotal > 0 ? ((goalCompleted / goalTotal) * 100) : 0,
      completed: goalCompleted,
      total: goalTotal,
    };
  });

  // Calculate Weekly Heatmap Data (last 12 weeks)
  const weeksData: Array<{ week: string; date: Date; completions: number }> = [];
  const twelveWeeksAgo = subDays(new Date(), 84);
  const weeks = eachWeekOfInterval(
    { start: twelveWeeksAgo, end: new Date() },
    { weekStartsOn: 0 }
  );

  weeks.forEach((weekStart) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    let weekCompletions = 0;

    weekDays.forEach((day) => {
      const dateKey = formatDateKey(day);
      goals.forEach((goal) => {
        if (completions.has(`${goal.id}-${dateKey}`)) {
          weekCompletions++;
        }
      });
    });

    weeksData.push({
      week: format(weekStart, "MMM dd"),
      date: weekStart,
      completions: weekCompletions,
    });
  });

  // Colors for pie chart
  const COLORS = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7300",
    "#00ff00",
    "#0088fe",
    "#00c49f",
    "#ffbb28",
    "#ff8042",
    "#8884d8",
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalCompletions} of {totalPossibleCompletions} tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goals.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active goals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStreak}</div>
            <p className="text-xs text-muted-foreground mt-1">days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Longest Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{longestStreak}</div>
            <p className="text-xs text-muted-foreground mt-1">days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Daily Completions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageDailyCompletions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              per active day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Consistency Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consistencyScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Days with activity
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Completion Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#8884d8"
                  name="Completed"
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#82ca9d"
                  name="Total Goals"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Goal Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={goalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#8884d8" name="Completed Days" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completion by Day of Week</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dayOfWeekData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number | undefined) => value !== undefined ? `${value.toFixed(1)}%` : '0%'} />
                <Legend />
                <Bar dataKey="completed" fill="#8884d8" name="Completion %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number | undefined) => value !== undefined ? `${value.toFixed(1)}%` : '0%'} />
                <Legend />
                <Bar dataKey="rate" fill="#82ca9d" name="Completion Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Goal Completion Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={goalCompletionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {goalCompletionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number | undefined) => value !== undefined ? `${value.toFixed(1)}%` : '0%'} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity Heatmap (Last 12 Weeks)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeksData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completions" fill="#ffc658" name="Total Completions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function calculateCurrentStreak(
  goals: Goal[],
  completions: Map<string, GoalCompletion>
): number {
  if (goals.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  while (true) {
    const dateKey = formatDateKey(currentDate);
    let allCompleted = true;

    for (const goal of goals) {
      if (!completions.has(`${goal.id}-${dateKey}`)) {
        allCompleted = false;
        break;
      }
    }

    if (allCompleted) {
      streak++;
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function calculateLongestStreak(
  goals: Goal[],
  completions: Map<string, GoalCompletion>
): number {
  if (goals.length === 0) return 0;

  // Get all completion dates
  const completionDates = new Set<string>();
  completions.forEach((completion) => {
    completionDates.add(completion.date);
  });

  // Sort dates
  const sortedDates = Array.from(completionDates).sort();
  if (sortedDates.length === 0) return 0;

  let longestStreak = 0;
  let currentStreak = 0;
  let lastDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    // Check if all goals were completed on this date
    let allCompleted = true;
    for (const goal of goals) {
      if (!completions.has(`${goal.id}-${dateStr}`)) {
        allCompleted = false;
        break;
      }
    }

    if (allCompleted) {
      if (lastDate === null) {
        currentStreak = 1;
      } else {
        const daysDiff = Math.floor(
          (date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff === 1) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      }
      lastDate = date;
    }
  }

  return Math.max(longestStreak, currentStreak);
}

