"use client";

import { useState, useEffect } from "react";
import { useGoals } from "@/hooks/use-goals";
import { useAuth } from "@/hooks/use-auth";
import { generateMonthData, getMonthRange } from "@/lib/date-utils";
import { GoalList } from "@/components/goals/goal-list";
import { MonthControls } from "@/components/calendar/month-controls";
import { KPIDashboard } from "@/components/analytics/kpi-dashboard";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { AccountMenu } from "@/components/account/account-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3 } from "lucide-react";
import type { MonthData } from "@/types";

export default function Home() {
  const { user } = useAuth();
  const { goals, addGoal, updateGoal, deleteGoal, toggleCompletion, isCompleted, completions, loading, reorderGoals, motivation, updateMotivation } = useGoals();
  const [months, setMonths] = useState<Array<{ year: number; month: number }>>(() => {
    const now = new Date();
    return [{ year: now.getFullYear(), month: now.getMonth() }];
  });
  const [monthData, setMonthData] = useState<MonthData[]>([]);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  
  // Generate month data whenever months change
  useEffect(() => {
    const data = months.map(({ year, month }) => generateMonthData(year, month));
    setMonthData(data);
  }, [months]);

  const handleAddMonth = () => {
    const lastMonth = months[months.length - 1];
    const nextMonth = new Date(lastMonth.year, lastMonth.month + 1, 1);
    setMonths([...months, { year: nextMonth.getFullYear(), month: nextMonth.getMonth() }]);
  };

  const handleScroll = (direction: "left" | "right") => {
    const scrollAmount = 400; // Scroll amount
    // Find all goal scroll containers and scroll them together
    const scrollContainers = document.querySelectorAll('.goal-scroll-container');
    scrollContainers.forEach((container) => {
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    });
  };

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden p-6">
          <Tabs defaultValue="tracker" className="h-full flex flex-col">
            <div className="flex-shrink-0 mb-4 flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="tracker">Tracker</TabsTrigger>
                <TabsTrigger value="analytics">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </TabsTrigger>
              </TabsList>
              <AccountMenu />
            </div>

            <TabsContent value="tracker" className="flex-1 overflow-hidden m-0">
              <Card className="h-full">
                <CardContent className="p-4 h-full">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-muted-foreground">Loading...</div>
                    </div>
                  ) : (
                  <GoalList
                    goals={goals}
                    months={monthData}
                    isCompleted={isCompleted}
                    onToggleCompletion={toggleCompletion}
                    onAddGoal={addGoal}
                    onUpdateGoal={updateGoal}
                    onDeleteGoal={deleteGoal}
                    onReorderGoals={reorderGoals}
                    motivation={motivation}
                    onUpdateMotivation={updateMotivation}
                    onAuthRequired={() => setAuthDialogOpen(true)}
                    monthControls={
                      <MonthControls
                        months={months}
                        onAddMonth={handleAddMonth}
                        onRemoveMonth={() => {}}
                        onScroll={handleScroll}
                      />
                    }
                  />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="flex-1 overflow-y-auto m-0">
              <KPIDashboard
                goals={goals}
                completions={completions}
                months={months}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onSuccess={() => {
          // Data will be automatically migrated after login
          setAuthDialogOpen(false);
        }}
      />
    </div>
  );
}
