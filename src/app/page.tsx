"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Target, BarChart3, Calendar, TrendingUp, Users, Zap, CheckSquare, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { user } = useAuth();

  const features = [
    {
      icon: Target,
      title: "Goal Tracking",
      description: "Set and track multiple goals with daily checkboxes. Visualize your progress over time.",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Comprehensive analytics with KPIs, charts, and insights into your goal completion patterns.",
    },
    {
      icon: Calendar,
      title: "Flexible Timeline",
      description: "Add multiple months, scroll through your history, and track progress across any time period.",
    },
    {
      icon: TrendingUp,
      title: "Progress Insights",
      description: "See your consistency score, completion rates, and identify your most productive days.",
    },
    {
      icon: Zap,
      title: "Quick Actions",
      description: "Jump to today's date instantly, drag to reorder goals, and manage everything with ease.",
    },
    {
      icon: Users,
      title: "Cloud Sync",
      description: "Sign in with Google to sync your data across devices and never lose your progress.",
    },
  ];

  return (
    <div className="min-h-screen h-screen overflow-y-auto bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section with Preview */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero section should occupy full viewport height */}
        <div className="max-w-7xl mx-auto min-h-screen flex items-center pt-16 pb-16 sm:pt-20 sm:pb-20 lg:pt-24 lg:pb-24">
          <div className="flex flex-col items-center w-full mb-20">
            {/* Hero Text - Centered */}
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Sparkles className="h-4 w-4" />
                <span>Track Your Progress Daily</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent leading-tight">
                Goal Tracker
          </h1>
              <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed font-light">
                Build better habits, track your progress, and achieve your goals with powerful daily tracking and analytics.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {user ? (
                  <Link href="/tracker">
                    <Button size="lg" className="text-base sm:text-lg px-8 py-6 h-auto group">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/tracker">
                      <Button size="lg" className="text-base sm:text-lg px-8 py-6 h-auto group">
                        Get Started Free
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      No sign-up required
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Visual Preview - Tracker Interface - Below Content */}
            <div className="max-w-5xl w-full">
              <Card className="border-2 shadow-2xl overflow-hidden bg-card">
                <CardContent className="p-0">
                  {/* Mock Tracker Header */}
                  <div className="bg-muted/30 border-b p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-7 bg-muted rounded w-32"></div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{"<"}</span>
                        <span>Jan 2026 - Jan 2026</span>
                        <span>{">"}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="h-7 bg-muted rounded w-16"></div>
                      <div className="h-7 bg-muted rounded w-16"></div>
                      <div className="h-7 bg-muted rounded w-20"></div>
                    </div>
                  </div>
                  
                  {/* Mock Calendar Dates Row */}
                  <div className="bg-muted/20 border-b p-2">
                    <div className="flex gap-1 items-center">
                      <div className="w-[140px] flex-shrink-0"></div>
                      {["Thu 1", "Fri 2", "Sat 3", "Sun 4", "Mon 5", "Tue 6", "Wed 7", "Thu 8", "Fri 9", "Sat 10", "Sun 11", "Mon 12"].map((date, i) => (
                        <div key={i} className="w-8 h-8 flex-shrink-0 flex flex-col items-center justify-center text-[10px]">
                          <span className="text-muted-foreground">{date.split(" ")[0]}</span>
                          <span className="font-medium">{date.split(" ")[1]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mock Goal Rows */}
                  <div className="p-3 space-y-2 bg-gradient-to-br from-background to-muted/10">
                    {/* Exercise Goal */}
                    <div className="flex items-center gap-3">
                      <div className="w-[140px] flex-shrink-0 flex items-center gap-1.5">
                        <div className="w-4 h-4 text-muted-foreground">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex gap-0.5">
                              <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground"></div>
                              <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground"></div>
                            </div>
                            <div className="flex gap-0.5">
                              <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground"></div>
                              <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground"></div>
                            </div>
                            <div className="flex gap-0.5">
                              <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground"></div>
                              <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground"></div>
                            </div>
                          </div>
                        </div>
                        <span className="font-medium text-xs">Exercise</span>
                        <div className="ml-auto w-3 h-3 text-destructive/70">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex gap-0.5 flex-1">
                        {[true, true, false, false, true, true, false, true, true, false, false, true].map((completed, i) => (
                          <div
                            key={i}
                            className={`w-8 h-8 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                              completed
                                ? "bg-green-500 border-green-600"
                                : "bg-background border-input"
                            }`}
                          >
                            {completed && <CheckSquare className="h-4 w-4 text-white" />}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reading Goal */}
                    <div className="flex items-center gap-3">
                      <div className="w-[140px] flex-shrink-0 flex items-center gap-1.5">
                        <div className="w-4 h-4 text-muted-foreground">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex gap-0.5">
                              <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground"></div>
                              <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground"></div>
                            </div>
                            <div className="flex gap-0.5">
                              <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground"></div>
                              <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground"></div>
                            </div>
                            <div className="flex gap-0.5">
                              <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground"></div>
                              <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground"></div>
                            </div>
                          </div>
                        </div>
                        <span className="font-medium text-xs">Reading</span>
                        <div className="ml-auto w-3 h-3 text-destructive/70">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex gap-0.5 flex-1">
                        {[true, true, true, true, true, true, true, true, true, true, true, true].map((completed, i) => (
                          <div
                            key={i}
                            className={`w-8 h-8 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                              completed
                                ? "bg-green-500 border-green-600"
                                : "bg-background border-input"
                            }`}
                          >
                            {completed && <CheckSquare className="h-4 w-4 text-white" />}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fitness Goal */}
                    <div className="flex items-center gap-3">
                      <div className="w-[140px] flex-shrink-0 flex items-center gap-1.5">
                        <div className="w-4 h-4 text-muted-foreground">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex gap-0.5">
                              <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground"></div>
                              <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground"></div>
                            </div>
                            <div className="flex gap-0.5">
                              <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground"></div>
                              <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground"></div>
                            </div>
                            <div className="flex gap-0.5">
                              <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground"></div>
                              <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground"></div>
                            </div>
                          </div>
                        </div>
                        <span className="font-medium text-xs">Fitness</span>
                        <div className="ml-auto w-3 h-3 text-destructive/70">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex gap-0.5 flex-1">
                        {[true, true, false, false, true, true, false, true, false, true, false, true].map((completed, i) => (
                          <div
                            key={i}
                            className={`w-8 h-8 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                              completed
                                ? "bg-green-500 border-green-600"
                                : "bg-background border-input"
                            }`}
                          >
                            {completed && <CheckSquare className="h-4 w-4 text-white" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to track, analyze, and achieve your goals
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="hover:shadow-xl transition-all duration-300 hover:border-primary/50 h-full group border-2">
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      <div className="p-4 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0">
                        <Icon className="h-7 w-7 text-primary" />
                      </div>
                      <div className="flex-1 pt-1">
                        <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-6xl mx-auto mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8 lg:gap-12">
            <Card className="text-center border-2 hover:shadow-lg transition-all">
              <CardContent className="pt-8 pb-8">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 transition-transform hover:scale-110 border-4 border-primary/20">
                  <span className="text-4xl font-bold text-primary">1</span>
                </div>
                <h3 className="font-bold text-xl mb-4">Create Your Goals</h3>
                <p className="text-muted-foreground leading-relaxed px-4">
                  Add goals you want to track daily. You can create goals without signing in.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center border-2 hover:shadow-lg transition-all">
              <CardContent className="pt-8 pb-8">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 transition-transform hover:scale-110 border-4 border-primary/20">
                  <span className="text-4xl font-bold text-primary">2</span>
                </div>
                <h3 className="font-bold text-xl mb-4">Track Daily Progress</h3>
                <p className="text-muted-foreground leading-relaxed px-4">
                  Check off boxes each day as you complete your goals. Sign in to save your progress.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center border-2 hover:shadow-lg transition-all">
              <CardContent className="pt-8 pb-8">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 transition-transform hover:scale-110 border-4 border-primary/20">
                  <span className="text-4xl font-bold text-primary">3</span>
                </div>
                <h3 className="font-bold text-xl mb-4">Analyze & Improve</h3>
                <p className="text-muted-foreground leading-relaxed px-4">
                  View detailed analytics, identify patterns, and optimize your goal completion strategy.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="max-w-5xl mx-auto mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Choose Goal Tracker?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to build better habits and achieve your goals
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
                  "Visual progress tracking with daily checkboxes",
                  "Comprehensive analytics and performance metrics",
                  "Flexible timeline - add months as needed",
                  "Drag and drop goal reordering",
                  "Quick navigation to today's date",
                  "Cloud sync across devices with Google sign-in",
                  "Start tracking immediately - no sign-up required",
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all hover:border-primary/50">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm leading-relaxed">{benefit}</p>
                  </div>
                ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="max-w-6xl mx-auto mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free, then upgrade only if you need more power. No contracts, cancel anytime.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Free plan */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Free</span>
                  <span className="text-xs rounded-full px-2 py-1 border text-muted-foreground">
                    Get started
                  </span>
                </CardTitle>
                <CardDescription>Everything you need to start tracking habits.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-3xl font-bold">$0</span>
                  <span className="text-sm text-muted-foreground ml-1">/ forever</span>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Up to 3 active goals</li>
                  <li>• Current month only</li>
                  <li>• Basic analytics (completion rate, streaks)</li>
                  <li>• Drag-and-drop reordering for first 3 goals</li>
                  <li>• Google sign-in & cloud sync</li>
                </ul>
                <Link href="/tracker">
                  <Button variant="outline" className="w-full mt-2">
                    Start Free
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro plan */}
            <Card className="border-2 border-primary shadow-lg relative overflow-hidden">
              <div className="absolute right-4 top-4 text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                Best for power users
              </div>
              <CardHeader>
                <CardTitle>Pro</CardTitle>
                <CardDescription>For serious trackers who want full history and insights.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-3">
                  <div>
                    <span className="text-3xl font-bold">$4.99</span>
                    <span className="text-sm text-muted-foreground ml-1">/ month</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    or <span className="font-semibold text-primary">$49.99</span> / year
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Unlimited goals</li>
                  <li>• Unlimited months & full history</li>
                  <li>• All analytics & charts</li>
                  <li>• Priority access to new features</li>
                  <li>• No locked goals when you downgrade — we keep your data safe</li>
                </ul>
                <Link href="/tracker">
                  <Button className="w-full mt-2">
                    Go Pro inside the app
                  </Button>
                </Link>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Upgrade and billing are handled securely inside the dashboard using Razorpay.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto mb-24">
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/30 border-2 shadow-xl">
            <CardContent className="pt-16 pb-16 px-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-6">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">Ready to Start Tracking?</h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Begin your journey towards better habits and goal achievement today. Start tracking for free, no credit card required.
              </p>
              <Link href="/tracker">
                <Button size="lg" className="text-lg px-12 py-7 h-auto text-base group">
                  {user ? "Go to Dashboard" : "Get Started Free"}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              {!user && (
                <p className="text-sm text-muted-foreground mt-4">
                  No sign-up required • Start tracking immediately
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

