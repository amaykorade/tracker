"use client";

import { useState, useMemo } from "react";
import { Goal, GoalCompletion } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { format, subDays, eachDayOfInterval, startOfWeek, endOfWeek, eachWeekOfInterval, getDay, startOfMonth, endOfMonth, eachMonthOfInterval, isSameMonth, isSameDay, startOfYear, endOfYear, subMonths } from "date-fns";
import { formatDateKey } from "@/lib/date-utils";
import { Calendar, Filter } from "lucide-react";
// import { ShareProgress } from "@/components/share/share-progress";

interface KPIDashboardProps {
  goals: Goal[];
  completions: Map<string, GoalCompletion>;
  months: Array<{ year: number; month: number }>;
  isPro?: boolean;
  onUpgradeClick?: () => void;
}

export function KPIDashboard({
  goals,
  completions,
  months,
  isPro = true,
  onUpgradeClick,
}: KPIDashboardProps) {
  const now = new Date();
  const currentMonth = { year: now.getFullYear(), month: now.getMonth() };
  
  // Date range state for Pro users
  const [dateRange, setDateRange] = useState<"all" | "7days" | "30days" | "3months" | "year" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  
  // Calculate date range based on selection
  const { startDate, endDate } = useMemo(() => {
    if (!isPro) {
      // Free users: only current month
      return {
        startDate: new Date(currentMonth.year, currentMonth.month, 1),
        endDate: new Date(currentMonth.year, currentMonth.month + 1, 0),
      };
    }
    
    // Pro users: based on selected range
    switch (dateRange) {
      case "7days":
        return {
          startDate: subDays(now, 6),
          endDate: now,
        };
      case "30days":
        return {
          startDate: subDays(now, 29),
          endDate: now,
        };
      case "3months":
        return {
          startDate: subMonths(now, 3),
          endDate: now,
        };
      case "year":
        return {
          startDate: startOfYear(now),
          endDate: now,
        };
      case "custom":
        if (customStartDate && customEndDate) {
          return {
            startDate: new Date(customStartDate),
            endDate: new Date(customEndDate),
          };
        }
        // Fallback to all if custom dates not set
        return {
          startDate: months.length > 0 
            ? new Date(Math.min(...months.map(m => new Date(m.year, m.month, 1).getTime())))
            : subDays(now, 29),
          endDate: now,
        };
      case "all":
      default:
        // All available months
        return {
          startDate: months.length > 0 
            ? new Date(Math.min(...months.map(m => new Date(m.year, m.month, 1).getTime())))
            : subDays(now, 29),
          endDate: now,
        };
    }
  }, [isPro, dateRange, customStartDate, customEndDate, months, now, currentMonth]);
  
  // Filter months based on date range
  const filteredMonths = useMemo(() => {
    if (!isPro) {
      return months.filter(m => m.year === currentMonth.year && m.month === currentMonth.month);
    }
    
    return months.filter(({ year, month }) => {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);
      return monthStart <= endDate && monthEnd >= startDate;
    });
  }, [months, isPro, currentMonth, startDate, endDate]);
  // Calculate overall completion rate based on filtered date range
  const rangeDays = eachDayOfInterval({ start: startDate, end: endDate });
  const totalDays = rangeDays.length;
  const totalPossibleCompletions = goals.length * totalDays;
  
  // Count completions within the date range
  let totalCompletions = 0;
  completions.forEach((completion) => {
    const completionDate = new Date(completion.date);
    if (completionDate >= startDate && completionDate <= endDate) {
      totalCompletions++;
    }
  });
  
  const completionRate =
    totalPossibleCompletions > 0
      ? ((totalCompletions / totalPossibleCompletions) * 100).toFixed(1)
      : "0";

  // Calculate daily completion data based on selected range
  const last30Days = eachDayOfInterval({
    start: startDate,
    end: endDate,
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

  // Calculate goal-wise completion data (within date range)
  const goalData = goals.map((goal) => {
    let completed = 0;
    completions.forEach((completion) => {
      if (completion.goalId === goal.id) {
        const completionDate = new Date(completion.date);
        if (completionDate >= startDate && completionDate <= endDate) {
          completed++;
        }
      }
    });
    return {
      name: goal.title.length > 15 ? goal.title.substring(0, 15) + "..." : goal.title,
      completed,
      percentage: totalDays > 0 
        ? ((completed / totalDays) * 100).toFixed(0)
        : 0,
    };
  });

  // Calculate streak data (within date range)
  const currentStreak = calculateCurrentStreak(goals, completions, startDate, endDate);
  const longestStreak = calculateLongestStreak(goals, completions, startDate, endDate);

  // Calculate Average Daily Completions (within date range)
  const allCompletionDates = new Set<string>();
  completions.forEach((completion) => {
    const completionDate = new Date(completion.date);
    if (completionDate >= startDate && completionDate <= endDate) {
      allCompletionDates.add(completion.date);
    }
  });
  const totalDaysWithCompletions = allCompletionDates.size;
  const averageDailyCompletions = totalDaysWithCompletions > 0
    ? (totalCompletions / totalDaysWithCompletions).toFixed(1)
    : "0";

  // Calculate Consistency Score (days with at least one completion / total days in range)
  const consistencyScore = totalDays > 0
    ? ((totalDaysWithCompletions / totalDays) * 100).toFixed(1)
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
    // Only count completions within the selected date range
    if (date >= startDate && date <= endDate) {
      const dayOfWeek = getDay(date);
      const dayData = dayOfWeekData.find(d => d.day === dayOfWeek);
      if (dayData) {
        dayData.completed++;
      }
    }
  });

  // Calculate total possible completions per day of week (within date range)
  if (goals.length > 0) {
    const rangeDays = eachDayOfInterval({ start: startDate, end: endDate });
    rangeDays.forEach((day) => {
      const dayOfWeek = getDay(day);
      const dayData = dayOfWeekData.find(d => d.day === dayOfWeek);
      if (dayData) {
        dayData.total += goals.length;
      }
    });
  }

  dayOfWeekData.forEach((day) => {
    day.completed = day.total > 0 ? ((day.completed / day.total) * 100) : 0;
  });

  // Calculate Monthly Comparison (only for Pro users with multiple months)
  const monthlyData: Array<{ month: string; completed: number; total: number; rate: number }> = [];
  filteredMonths.forEach(({ year, month }) => {
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

  // Calculate Goal Completion Percentage (for pie chart) - within date range
  const goalCompletionData = goals.map((goal) => {
    let goalCompleted = 0;
    let goalTotal = 0;

    // Use the date range days instead of filtered months
    rangeDays.forEach((day) => {
      goalTotal++;
      const dateKey = formatDateKey(day);
      if (completions.has(`${goal.id}-${dateKey}`)) {
        goalCompleted++;
      }
    });

    return {
      name: goal.title.length > 20 ? goal.title.substring(0, 20) + "..." : goal.title,
      value: goalTotal > 0 ? ((goalCompleted / goalTotal) * 100) : 0,
      completed: goalCompleted,
      total: goalTotal,
    };
  });

  // Calculate Weekly Heatmap Data (based on date range)
  const weeksData: Array<{ week: string; date: Date; completions: number }> = [];
  const weeksAgo = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const weeksStartDate = subDays(endDate, Math.min(weeksAgo * 7, 84)); // Max 12 weeks
  const weeks = eachWeekOfInterval(
    { start: weeksStartDate > startDate ? weeksStartDate : startDate, end: endDate },
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

  // Format date range string for sharing
  const dateRangeString = useMemo(() => {
    if (dateRange === "all") {
      return `All Time (${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")})`;
    } else if (dateRange === "7days") {
      return "Last 7 Days";
    } else if (dateRange === "30days") {
      return "Last 30 Days";
    } else if (dateRange === "3months") {
      return "Last 3 Months";
    } else if (dateRange === "year") {
      return `This Year (${format(startDate, "yyyy")})`;
    } else if (dateRange === "custom" && customStartDate && customEndDate) {
      return `${format(new Date(customStartDate), "MMM d, yyyy")} - ${format(new Date(customEndDate), "MMM d, yyyy")}`;
    } else {
      return format(startDate, "MMM d, yyyy");
    }
  }, [dateRange, startDate, endDate, customStartDate, customEndDate]);

  return (
    <div className="space-y-6">
      {/* Share Progress Button - Disabled for now */}
      {/* <div className="flex justify-end mb-4">
        <ShareProgress
          goals={goals}
          completionRate={completionRate}
          currentStreak={currentStreak}
          longestStreak={longestStreak}
          consistencyScore={consistencyScore}
          totalCompletions={totalCompletions}
          totalDays={totalDays}
          dateRange={dateRangeString}
        />
      </div> */}

      {/* Free plan limitation notice */}
      {!isPro && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium mb-1">Current Month Analytics Only</p>
                <p className="text-xs text-muted-foreground">
                  Free plan shows analytics for the current month only. Upgrade to Pro to see historical data and advanced insights.
                </p>
              </div>
              {onUpgradeClick && (
                <Button size="sm" onClick={onUpgradeClick} className="w-full sm:w-auto">
                  Upgrade to Pro
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date Range Filter for Pro Users */}
      {isPro && (
        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Date Range</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={dateRange === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange("all")}
              >
                All Time
              </Button>
              <Button
                variant={dateRange === "7days" ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange("7days")}
              >
                Last 7 Days
              </Button>
              <Button
                variant={dateRange === "30days" ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange("30days")}
              >
                Last 30 Days
              </Button>
              <Button
                variant={dateRange === "3months" ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange("3months")}
              >
                Last 3 Months
              </Button>
              <Button
                variant={dateRange === "year" ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange("year")}
              >
                This Year
              </Button>
              <Button
                variant={dateRange === "custom" ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange("custom")}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Custom Range
              </Button>
            </div>
            
            {dateRange === "custom" && (
              <div className="flex items-center gap-4 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">From:</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-1.5 border rounded-md text-sm"
                    max={format(now, "yyyy-MM-dd")}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">To:</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-1.5 border rounded-md text-sm"
                    max={format(now, "yyyy-MM-dd")}
                    min={customStartDate || undefined}
                  />
                </div>
                {customStartDate && customEndDate && customStartDate > customEndDate && (
                  <p className="text-xs text-destructive">Start date must be before end date</p>
                )}
              </div>
            )}
            
            {dateRange !== "custom" && (
              <p className="text-xs text-muted-foreground">
                Showing data from {format(startDate, "MMM d, yyyy")} to {format(endDate, "MMM d, yyyy")}
              </p>
            )}
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
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
            <p className="text-sm text-muted-foreground mt-1">
              Track your daily progress over time
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={dailyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#6b7280"
                  tick={{ fontSize: 11 }}
                  domain={[0, 'dataMax + 1']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number | undefined, name?: string) => {
                    if (value === undefined) return '0';
                    if (name === 'completed') return [`${value} goals`, 'Completed'];
                    if (name === 'total') return [`${value} goals`, 'Total Goals'];
                    return value;
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                <Line
                  type="monotone"
                  strokeWidth={3}
                  dataKey="completed"
                  stroke="#3b82f6"
                  name="Completed"
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dataKey="total"
                  stroke="#10b981"
                  name="Total Goals"
                  dot={{ fill: '#10b981', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Goal Completion Distribution</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Completion rate and performance by goal
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Horizontal Bar Chart for better readability */}
              <ResponsiveContainer width="100%" height={Math.max(300, goalCompletionData.length * 60)}>
                <BarChart 
                  data={[...goalCompletionData].sort((a, b) => b.value - a.value)} 
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                  <XAxis 
                    type="number" 
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    stroke="#6b7280"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={120}
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <Tooltip 
                    formatter={(value: number | undefined) => {
                      if (value === undefined) return '0%';
                      return `${value.toFixed(1)}%`;
                    }}
                    labelFormatter={(label) => {
                      const data = [...goalCompletionData].sort((a, b) => b.value - a.value).find(d => d.name === label);
                      if (!data) return label;
                      return `${data.name} - ${data.completed}/${data.total} days`;
                    }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[0, 8, 8, 0]}
                  >
                    {[...goalCompletionData].sort((a, b) => b.value - a.value).map((entry, index) => {
                      // Use gradient colors based on completion rate
                      const completionRate = entry.value;
                      let fillColor = '#3b82f6';
                      
                      // Adjust color intensity based on completion rate
                      if (completionRate >= 80) {
                        fillColor = '#10b981'; // Green for high completion
                      } else if (completionRate >= 50) {
                        fillColor = '#eab308'; // Yellow for medium completion
                      } else if (completionRate >= 25) {
                        fillColor = '#f97316'; // Orange for low completion
                      } else {
                        fillColor = '#ef4444'; // Red for very low completion
                      }
                      
                      return <Cell key={`cell-${index}`} fill={fillColor} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              
              {/* Summary Statistics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t">
                {[...goalCompletionData]
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 4)
                  .map((goal, index) => (
                    <div key={goal.name} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ 
                            backgroundColor: goal.value >= 80 ? '#10b981' : 
                                            goal.value >= 50 ? '#eab308' : 
                                            goal.value >= 25 ? '#f97316' : '#ef4444'
                          }}
                        />
                        <span className="text-xs font-medium truncate">{goal.name}</span>
                      </div>
                      <div className="text-lg font-bold">{goal.value.toFixed(0)}%</div>
                      <div className="text-xs text-muted-foreground">
                        {goal.completed}/{goal.total} days
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completion by Day of Week</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Identify your most productive days
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={dayOfWeekData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  stroke="#6b7280"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="#6b7280"
                  tick={{ fontSize: 11 }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number | undefined) => {
                    if (value === undefined) return '0%';
                    return `${value.toFixed(1)}%`;
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="completed" 
                  name="Completion %"
                  radius={[8, 8, 0, 0]}
                >
                  {dayOfWeekData.map((entry, index) => {
                    // Color based on completion rate
                    let fillColor = '#3b82f6';
                    if (entry.completed >= 80) fillColor = '#10b981';
                    else if (entry.completed >= 50) fillColor = '#eab308';
                    else if (entry.completed >= 25) fillColor = '#f97316';
                    else fillColor = '#ef4444';
                    
                    return <Cell key={`cell-${index}`} fill={fillColor} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Comparison</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Track your progress across months
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280"
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  stroke="#6b7280"
                  tick={{ fontSize: 11 }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number | undefined, name?: string, props?: any) => {
                    if (value === undefined || !props) return '0%';
                    return [
                      <div key="tooltip" className="space-y-1">
                        <div className="font-semibold">{value.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">
                          {props.payload?.completed || 0} of {props.payload?.total || 0} completions
                        </div>
                      </div>,
                      'Completion Rate'
                    ];
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="rate" 
                  name="Completion Rate %"
                  radius={[8, 8, 0, 0]}
                >
                  {monthlyData.map((entry, index) => {
                    // Color based on completion rate
                    let fillColor = '#10b981';
                    if (entry.rate >= 80) fillColor = '#10b981';
                    else if (entry.rate >= 50) fillColor = '#eab308';
                    else if (entry.rate >= 25) fillColor = '#f97316';
                    else fillColor = '#ef4444';
                    
                    return <Cell key={`cell-${index}`} fill={fillColor} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity Overview</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Total completions per week (Last 12 weeks)
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={weeksData} margin={{ top: 5, right: 20, left: 0, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                <XAxis 
                  dataKey="week" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  stroke="#6b7280"
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  stroke="#6b7280"
                  tick={{ fontSize: 11 }}
                  domain={[0, 'dataMax + 1']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number | undefined) => {
                    if (value === undefined) return '0';
                    return `${value} completions`;
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="completions" 
                  name="Total Completions"
                  radius={[8, 8, 0, 0]}
                >
                  {weeksData.map((entry, index) => {
                    // Color based on completion count (heatmap style)
                    const maxCompletions = Math.max(...weeksData.map(w => w.completions));
                    const intensity = entry.completions / maxCompletions;
                    let fillColor = '#fef3c7'; // Light yellow
                    if (intensity >= 0.8) fillColor = '#10b981'; // Green
                    else if (intensity >= 0.6) fillColor = '#84cc16'; // Light green
                    else if (intensity >= 0.4) fillColor = '#eab308'; // Yellow
                    else if (intensity >= 0.2) fillColor = '#f97316'; // Orange
                    else fillColor = '#fef3c7'; // Light yellow
                    
                    return <Cell key={`cell-${index}`} fill={fillColor} />;
                  })}
                </Bar>
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
  completions: Map<string, GoalCompletion>,
  startDate?: Date,
  endDate?: Date
): number {
  if (goals.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rangeEnd = endDate ? new Date(endDate) : today;
  rangeEnd.setHours(0, 0, 0, 0);
  const rangeStart = startDate ? new Date(startDate) : subDays(today, 365);
  rangeStart.setHours(0, 0, 0, 0);

  let streak = 0;
  let currentDate = new Date(rangeEnd);

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
  completions: Map<string, GoalCompletion>,
  startDate?: Date,
  endDate?: Date
): number {
  if (goals.length === 0) return 0;

  // Get all completion dates within range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rangeEnd = endDate ? new Date(endDate) : today;
  rangeEnd.setHours(23, 59, 59, 999);
  const rangeStart = startDate ? new Date(startDate) : subDays(today, 365);
  rangeStart.setHours(0, 0, 0, 0);

  const completionDates = new Set<string>();
  completions.forEach((completion) => {
    const completionDate = new Date(completion.date);
    if (completionDate >= rangeStart && completionDate <= rangeEnd) {
      completionDates.add(completion.date);
    }
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

