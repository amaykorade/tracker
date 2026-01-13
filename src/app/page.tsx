"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Target, BarChart3, Calendar, TrendingUp, Users, Zap } from "lucide-react";
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
    <div className="h-screen overflow-y-auto bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Goal Tracker
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Track your daily goals, build better habits, and achieve your objectives with powerful analytics and insights.
          </p>
          {user ? (
            <Link href="/tracker">
              <Button size="lg" className="text-lg px-8">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <div className="flex gap-4 justify-center">
              <Link href="/tracker">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Get Started
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground self-center">
                No sign-up required to start tracking
              </p>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* How It Works */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-2xl text-center">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="font-semibold mb-2">Create Your Goals</h3>
                <p className="text-muted-foreground">
                  Add goals you want to track daily. You can create goals without signing in.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="font-semibold mb-2">Track Daily Progress</h3>
                <p className="text-muted-foreground">
                  Check off boxes each day as you complete your goals. Sign in to save your progress.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="font-semibold mb-2">Analyze & Improve</h3>
                <p className="text-muted-foreground">
                  View detailed analytics, identify patterns, and optimize your goal completion strategy.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Benefits */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Key Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  "Visual progress tracking with daily checkboxes",
                  "Comprehensive analytics and performance metrics",
                  "Flexible timeline - add months as needed",
                  "Drag and drop goal reordering",
                  "Quick navigation to today's date",
                  "Cloud sync across devices with Google sign-in",
                  "Start tracking immediately - no sign-up required",
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">{benefit}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-4">Ready to Start Tracking?</h2>
              <p className="text-muted-foreground mb-6">
                Begin your journey towards better habits and goal achievement today.
              </p>
              <Link href="/tracker">
                <Button size="lg" className="text-lg px-8">
                  {user ? "Go to Dashboard" : "Get Started Now"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

