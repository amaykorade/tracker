"use client";

import { useState, useEffect } from "react";
import { useGoals } from "@/hooks/use-goals";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/providers/theme-provider";
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
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { user, isPro, plan } = useAuth();
  const { resolvedTheme } = useTheme();
  const { goals, addGoal, updateGoal, deleteGoal, toggleCompletion, isCompleted, completions, loading, reorderGoals, motivation, updateMotivation } = useGoals();
  const { toast } = useToast();
  const [months, setMonths] = useState<Array<{ year: number; month: number }>>(() => {
    const now = new Date();
    return [{ year: now.getFullYear(), month: now.getMonth() }];
  });
  const [monthData, setMonthData] = useState<MonthData[]>([]);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);
  
  // Generate month data whenever months change
  useEffect(() => {
    const data = months.map(({ year, month }) => generateMonthData(year, month));
    setMonthData(data);
  }, [months]);

  const handleAddMonth = () => {
    // Free plan: only allow tracking the current month
    if (!isPro && months.length >= 1) {
      toast({
        title: "History limit on free plan",
        description: "Free plan allows tracking the current month. Upgrade to Pro to add more months of history.",
      });
      return;
    }

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

  const loadRazorpayScript = () =>
    new Promise<boolean>((resolve) => {
      if (typeof window === "undefined") {
        resolve(false);
        return;
      }
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handleUpgradeToPro = async (billing: "monthly" | "yearly") => {
    if (!user) {
      setAuthDialogOpen(true);
      toast({
        title: "Sign in required",
        description: "Please sign in with Google to upgrade to Pro.",
      });
      return;
    }

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      toast({
        title: "Payment error",
        description: "Unable to load payment gateway. Please check your connection and try again.",
        variant: "destructive",
      });
      return;
    }

    const key =
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      // Fallback in case the user used a non-public name; will be undefined on client if not exposed
      (process.env.RAZORPAY_KEY_ID as string | undefined);

    if (!key) {
      toast({
        title: "Configuration error",
        description: "Payment gateway key is not configured. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    // Razorpay expects amount in the smallest currency unit.
    // For USD, this is cents.
    const isMonthly = billing === "monthly";
    const amountInCents = isMonthly ? 499 : 4999; // $4.99 or $49.99

    const options = {
      key,
      amount: amountInCents,
      currency: "USD",
      name: "Goal Tracker",
      description: isMonthly
        ? "Goal Tracker Pro - Monthly Plan ($4.99/month)"
        : "Goal Tracker Pro - Yearly Plan ($49.99/year)",
      handler: async function () {
        try {
          const userRef = doc(db, "users", user.uid);
          const now = new Date();
          const days = isMonthly ? 30 : 365;
          const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

          await setDoc(
            userRef,
            {
              plan: "pro",
              billingInterval: billing,
              planExpiresAt: Timestamp.fromDate(expiresAt),
            },
            { merge: true }
          );
          toast({
            title: "Upgraded to Pro",
            description: isMonthly
              ? "Monthly Pro plan activated. You now have unlimited goals and months for the next 30 days."
              : "Yearly Pro plan activated. You now have unlimited goals and months for the next year.",
          });
          setBillingDialogOpen(false);
        } catch (error) {
          console.error("Error upgrading plan:", error);
          toast({
            title: "Upgrade error",
            description: "Payment succeeded but we could not update your plan automatically. Please contact support.",
            variant: "destructive",
          });
        }
      },
      prefill: {
        name: user.displayName || "",
        email: user.email || "",
      },
      theme: {
        // Match UI theme colors - use primary color from CSS variables
        // Light mode: dark gray (#171717), Dark mode: light gray (#fafafa)
        // For better visibility in Razorpay, using accent-friendly colors
        color: resolvedTheme === "dark" 
          ? "#fafafa"  // Light color for dark mode (matches primary-foreground)
          : "#171717", // Dark color for light mode (matches primary)
        // Hide top bar for cleaner UI
        hide_topbar: false,
      },
    };

    const razorpay = new (window as any).Razorpay(options);
    razorpay.open();
  };

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden p-6">
          <Tabs defaultValue="tracker" className="h-full flex flex-col">
            <div className="flex-shrink-0 mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <TabsList>
                  <TabsTrigger value="tracker">Tracker</TabsTrigger>
                  <TabsTrigger value="analytics">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </TabsTrigger>
                </TabsList>
                {/* Simple plan indicator + upgrade button */}
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full border text-muted-foreground">
                    {isPro ? "Pro plan" : "Free plan"}
                  </span>
                  {!isPro && (
                    <button
                      type="button"
                      onClick={() => setBillingDialogOpen(true)}
                      className="text-xs px-3 py-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Upgrade to Pro
                    </button>
                  )}
                </div>
              </div>
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
                    isPro={isPro}
                    onUpgradeClick={() => setBillingDialogOpen(true)}
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
                isPro={isPro}
                onUpgradeClick={() => setBillingDialogOpen(true)}
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
      {/* Billing choice dialog */}
      <Dialog open={billingDialogOpen} onOpenChange={setBillingDialogOpen}>
        <DialogContent onClose={() => setBillingDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Choose your Pro plan</DialogTitle>
            <DialogDescription>
              Unlock unlimited goals, unlimited months, and full analytics.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 mt-4 sm:grid-cols-2">
            <div className="border rounded-lg p-4 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold mb-1">Monthly</h3>
                <p className="text-2xl font-bold mb-1">$4.99</p>
                <p className="text-xs text-muted-foreground mb-3">Billed every month</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Unlimited goals</li>
                  <li>• Unlimited months</li>
                  <li>• Full analytics</li>
                </ul>
              </div>
              <Button
                className="mt-4 w-full"
                onClick={() => handleUpgradeToPro("monthly")}
              >
                Continue with Monthly
              </Button>
            </div>
            <div className="border rounded-lg p-4 flex flex-col justify-between bg-primary/5 border-primary/40">
              <div>
                <h3 className="font-semibold mb-1">Yearly</h3>
                <p className="text-2xl font-bold mb-1">$49.99</p>
                <p className="text-xs text-muted-foreground mb-3">Billed once per year</p>
                <p className="text-xs font-medium text-primary mb-2">
                  Save ~17% compared to monthly
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Everything in Monthly</li>
                  <li>• Best value for long-term tracking</li>
                </ul>
              </div>
              <Button
                className="mt-4 w-full"
                onClick={() => handleUpgradeToPro("yearly")}
              >
                Continue with Yearly
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
