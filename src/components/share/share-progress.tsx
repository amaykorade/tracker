"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Twitter, Linkedin, MessageCircle, Download, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { toPng, toBlob } from "html-to-image";
import { Goal } from "@/types";
import { format } from "date-fns";

interface ShareProgressProps {
  goals: Goal[];
  completionRate: string;
  currentStreak: number;
  longestStreak: number;
  consistencyScore: string;
  totalCompletions: number;
  totalDays: number;
  dateRange: string;
}

export function ShareProgress({
  goals,
  completionRate,
  currentStreak,
  longestStreak,
  consistencyScore,
  totalCompletions,
  totalDays,
  dateRange,
}: ShareProgressProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const shareImageRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const generateImage = async () => {
    if (!shareImageRef.current) return null;

    setIsGenerating(true);
    try {
      const dataUrl = await toPng(shareImageRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      return dataUrl;
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Error",
        description: "Failed to generate share image. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;

    const link = document.createElement("a");
    link.download = `goal-tracker-progress-${format(new Date(), "yyyy-MM-dd")}.png`;
    link.href = dataUrl;
    link.click();
    
    toast({
      title: "Downloaded!",
      description: "Your progress image has been downloaded.",
    });
  };

  const shareViaWebShare = async () => {
    if (!navigator.share) {
      toast({
        title: "Not supported",
        description: "Web Share API is not supported on this device.",
        variant: "destructive",
      });
      return;
    }

    const dataUrl = await generateImage();
    if (!dataUrl) return;

    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], "progress.png", { type: "image/png" });

      const origin = typeof window !== 'undefined' ? window.location.origin : 'goaltracker.com';
      await navigator.share({
        title: `My Goal Tracker Progress - ${completionRate}% Completion Rate!`,
        text: `I've achieved ${completionRate}% completion rate with a ${currentStreak}-day streak! 🎯 Track your goals at ${origin}`,
        files: [file],
      });

      toast({
        title: "Shared!",
        description: "Your progress has been shared successfully.",
      });
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Error sharing:", error);
        toast({
          title: "Error",
          description: "Failed to share. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const shareToTwitter = async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;

    const origin = typeof window !== 'undefined' ? window.location.origin : 'goaltracker.com';
    const text = encodeURIComponent(
      `🎯 I've achieved ${completionRate}% completion rate with a ${currentStreak}-day streak!\n\nTrack your goals and build better habits: ${origin}\n\n#GoalTracking #Productivity #HabitTracker`
    );

    // Twitter doesn't support direct image sharing via URL, so we'll share the text
    // Users can download and attach the image manually
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");

    toast({
      title: "Twitter opened!",
      description: "Download the image and attach it to your tweet for best results.",
    });
  };

  const shareToLinkedIn = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'goaltracker.com';
    const shareText = `Consistency is key! I've achieved ${completionRate}% completion rate with a ${currentStreak}-day streak on my goals.\n\nTrack your progress and build better habits: ${origin}`;
    
    // Copy text to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
    
    // Generate and download image first
    const dataUrl = await generateImage();
    if (dataUrl) {
      const link = document.createElement("a");
      link.download = `goal-tracker-progress-${format(new Date(), "yyyy-MM-dd")}.png`;
      link.href = dataUrl;
      link.click();
    }
    
    // Open LinkedIn - just go to the main feed where user can create a post
    // LinkedIn doesn't support direct share with pre-filled content
    window.open("https://www.linkedin.com/feed/", "_blank");

    toast({
      title: "Ready to share!",
      description: "Text copied & image downloaded! Go to LinkedIn, create a new post, paste the text, and attach the image.",
    });
  };

  const shareToWhatsApp = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'goaltracker.com';
    const text = encodeURIComponent(
      `🎯 Check out my goal tracker progress!\n\n• ${completionRate}% Completion Rate\n• ${currentStreak}-Day Streak\n• ${consistencyScore}% Consistency\n\nTrack your goals: ${origin}`
    );

    window.open(`https://wa.me/?text=${text}`, "_blank");

    toast({
      title: "WhatsApp opened!",
      description: "Download the image and attach it to your message for best results.",
    });
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : 'goaltracker.com';
  const shareText = `🎯 I've achieved ${completionRate}% completion rate with a ${currentStreak}-day streak! Track your goals at ${origin}`;

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="gap-2"
      >
        <Share2 className="h-4 w-4" />
        Share Progress
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Your Progress</DialogTitle>
            <DialogDescription>
              Generate and share your goal tracking achievements
            </DialogDescription>
          </DialogHeader>

          {/* Hidden image template for generation */}
          <div className="absolute -left-[9999px] -top-[9999px]">
            <div
              ref={shareImageRef}
              className="w-[800px] h-[600px] bg-gradient-to-br from-blue-50 to-indigo-100 p-12 flex flex-col items-center justify-center text-center"
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {/* App Name/Logo */}
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  Goal Tracker
                </h1>
                <div className="h-1 w-24 bg-blue-500 mx-auto"></div>
              </div>

              {/* Main Stats */}
              <div className="mb-8">
                <div className="text-6xl font-bold text-blue-600 mb-2">
                  {completionRate}%
                </div>
                <div className="text-2xl text-gray-700">
                  Completion Rate
                </div>
              </div>

              {/* Secondary Stats Grid */}
              <div className="grid grid-cols-3 gap-6 mb-8 w-full max-w-2xl">
                <div className="bg-white/80 rounded-lg p-4">
                  <div className="text-3xl font-bold text-orange-500 mb-1">
                    🔥 {currentStreak}
                  </div>
                  <div className="text-sm text-gray-600">
                    Day Streak
                  </div>
                </div>
                <div className="bg-white/80 rounded-lg p-4">
                  <div className="text-3xl font-bold text-green-500 mb-1">
                    {consistencyScore}%
                  </div>
                  <div className="text-sm text-gray-600">
                    Consistency
                  </div>
                </div>
                <div className="bg-white/80 rounded-lg p-4">
                  <div className="text-3xl font-bold text-purple-500 mb-1">
                    {totalCompletions}
                  </div>
                  <div className="text-sm text-gray-600">
                    Completed
                  </div>
                </div>
              </div>

              {/* Goals Summary */}
              <div className="mb-6">
                <div className="text-lg font-semibold text-gray-700 mb-2">
                  Tracking {goals.length} Goal{goals.length !== 1 ? "s" : ""}
                </div>
                <div className="text-sm text-gray-600">
                  {dateRange}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-auto text-sm text-gray-500">
                {typeof window !== 'undefined' ? window.location.origin : 'goaltracker.com'}
              </div>
            </div>
          </div>

          {/* Share Options */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={shareViaWebShare}
                disabled={isGenerating}
                className="w-full"
                variant="outline"
              >
                <Share2 className="h-4 w-4 mr-2" />
                {typeof navigator !== 'undefined' && 'share' in navigator ? "Native Share" : "Not Available"}
              </Button>
              <Button
                onClick={downloadImage}
                disabled={isGenerating}
                className="w-full"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Image
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={shareToTwitter}
                disabled={isGenerating}
                className="w-full"
                variant="outline"
              >
                <Twitter className="h-4 w-4" />
              </Button>
              <Button
                onClick={shareToLinkedIn}
                disabled={isGenerating}
                className="w-full"
                variant="outline"
              >
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button
                onClick={shareToWhatsApp}
                disabled={isGenerating}
                className="w-full"
                variant="outline"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>

            {isGenerating && (
              <div className="text-center text-sm text-gray-500">
                Generating image...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

