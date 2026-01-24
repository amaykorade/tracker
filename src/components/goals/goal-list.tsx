"use client";

import { Goal, MonthData } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calendar } from "lucide-react";
import { AddGoalDialog } from "./add-goal-dialog";
import { GoalItem } from "./goal-item";
import { DatesHeader } from "./dates-header";
import { MotivationLine } from "./motivation-line";
import { useMemo, useRef, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { getTrackingDate, formatDateKey, compareWithTrackingDate } from "@/lib/date-utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface GoalListProps {
  goals: Goal[];
  months: MonthData[];
  isCompleted: (goalId: string, date: string) => boolean;
  onToggleCompletion: (goalId: string, date: string) => void;
  onAddGoal: (title: string) => void;
  onUpdateGoal: (id: string, title: string) => void;
  onDeleteGoal: (id: string) => void;
  onReorderGoals: (activeId: string, overId: string) => void;
  motivation?: string;
  onUpdateMotivation?: (text: string) => void;
  monthControls?: React.ReactNode;
  onAuthRequired?: () => void;
  isPro?: boolean;
  onUpgradeClick?: () => void;
  allowPastDateEditing?: boolean;
}

export function GoalList({
  goals,
  months,
  isCompleted,
  onToggleCompletion,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onReorderGoals,
  motivation,
  onUpdateMotivation,
  monthControls,
  onAuthRequired,
  isPro = true,
  onUpgradeClick,
  allowPastDateEditing = false,
}: GoalListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // On free plan, prevent reordering that would unlock locked goals
    if (!isPro) {
      const activeIndex = goals.findIndex((g) => g.id === active.id);
      const overIndex = goals.findIndex((g) => g.id === over.id);

      // Prevent locked goals (index >= 3) from being moved
      if (activeIndex >= 3) {
        return; // Locked goal cannot be moved
      }

      // Prevent unlocked goals from being moved to locked positions (>= 3)
      if (overIndex >= 3) {
        return; // Cannot move unlocked goal to locked position
      }

      // Unlocked goals can only be reordered among themselves (0-2)
      // This is allowed, so continue with the reorder
    }

    // Allow the reorder
    onReorderGoals(active.id as string, over.id as string);
  };

  // Centralized scroll synchronization - single source of truth
  const scrollContainersRef = useRef<HTMLDivElement[]>([]);
  const handlersMapRef = useRef<Map<HTMLDivElement, (e: Event) => void>>(new Map());
  const isSyncingRef = useRef(false);

  // Register ALL scroll containers in a centralized list
  const registerScrollContainer = useCallback((ref: HTMLDivElement | null) => {
    if (ref && !scrollContainersRef.current.includes(ref)) {
      scrollContainersRef.current.push(ref);
    }
  }, []);

  // Single unified scroll sync function - syncs ALL containers
  const syncScroll = useCallback((scrollLeft: number) => {
    if (isSyncingRef.current) return;

    try {
      isSyncingRef.current = true;
      
      // Update all registered scroll containers at once
      scrollContainersRef.current.forEach((container) => {
        if (container && container.scrollLeft !== scrollLeft) {
          container.scrollLeft = scrollLeft;
        }
      });
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  // Global scroll event handler - attached to ALL containers
  useEffect(() => {
    const setupScrollListeners = () => {
      // Clean up old listeners first
      handlersMapRef.current.forEach((handler, container) => {
        container.removeEventListener('scroll', handler);
      });
      handlersMapRef.current.clear();
      scrollContainersRef.current = [];

      // Create a single handler function for this effect cycle
      const handleScroll = (e: Event) => {
        const container = e.target as HTMLDivElement;
        if (!isSyncingRef.current) {
          syncScroll(container.scrollLeft);
        }
      };

      // Attach listener to dates header
      const datesHeader = document.querySelector('[data-scroll-container="dates"]') as HTMLDivElement;
      if (datesHeader) {
        registerScrollContainer(datesHeader);
        datesHeader.addEventListener('scroll', handleScroll, { passive: true });
        handlersMapRef.current.set(datesHeader, handleScroll);
      }

      // Attach listener to all goal scroll containers
      const goalContainers = document.querySelectorAll('[data-scroll-container="goal"]') as NodeListOf<HTMLDivElement>;
      goalContainers.forEach((container) => {
        registerScrollContainer(container);
        container.addEventListener('scroll', handleScroll, { passive: true });
        handlersMapRef.current.set(container, handleScroll);
      });
    };

    setupScrollListeners();

    // Re-setup when goals change (new goals added)
    const timer = setTimeout(setupScrollListeners, 50);

    return () => {
      clearTimeout(timer);
      // Cleanup listeners
      handlersMapRef.current.forEach((handler, container) => {
        container.removeEventListener('scroll', handler);
      });
      handlersMapRef.current.clear();
    };
  }, [registerScrollContainer, syncScroll, goals.length]);

  // Process all dates once for all goals
  const allDates = useMemo(() => {
    const dates: Array<{ 
      date: Date; 
      isCurrentMonth: boolean; 
      isWeekEnd: boolean;
      isMonthStart: boolean;
    }> = [];
    
    let previousDate: Date | null = null;
    let lastSeenMonthYear: string | null = null;
    
    months.forEach((month) => {
      month.weeks.forEach((week) => {
        week.days.forEach((day) => {
          // Filter out dates from 2025
          if (day.date.getFullYear() === 2025) {
            return;
          }
          
          const dayOfWeek = day.date.getDay();
          const monthYear = `${day.date.getFullYear()}-${day.date.getMonth()}`;
          const isFirstDayOfMonth = day.date.getDate() === 1;
          
          let isMonthStart = false;
          if (previousDate === null) {
            isMonthStart = true;
            lastSeenMonthYear = monthYear;
          } else {
            if (isFirstDayOfMonth && lastSeenMonthYear !== monthYear) {
              isMonthStart = true;
              lastSeenMonthYear = monthYear;
            }
          }
          
          dates.push({
            date: day.date,
            isCurrentMonth: day.date.getMonth() === month.month,
            isWeekEnd: dayOfWeek === 6,
            isMonthStart,
          });
          
          previousDate = day.date;
        });
      });
    });
    
    return dates;
  }, [months]);

  // Jump to today's date (based on 5 AM cutoff)
  const jumpToToday = useCallback(() => {
    const trackingDate = getTrackingDate();
    
    // Find today's date index in allDates
    let todayIndex = -1;
    for (let i = 0; i < allDates.length; i++) {
      const dateKey = formatDateKey(allDates[i].date);
      if (compareWithTrackingDate(dateKey) === 0) {
        todayIndex = i;
        break;
      }
    }

    if (todayIndex === -1) {
      // Today's date not found in the visible months, scroll to end
      return;
    }

    // Calculate scroll position
    // Date box width: w-8 (32px) on mobile, w-10 (40px) on desktop + gap-1 (4px) = 36px mobile, 44px desktop
    // Separators: month separator = w-2 (8px) + mx-1.5 (12px) = 20px, week separator = w-1 (4px) + mx-1 (8px) = 12px
    let scrollPosition = 0;
    // Use responsive width - check if mobile by checking if dates header exists and its width
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640; // sm breakpoint
    const dateWidth = isMobile ? 36 : 44; // w-8 + gap-1 on mobile, w-10 + gap-1 on desktop
    const monthSeparatorWidth = 20; // w-2 + mx-1.5
    const weekSeparatorWidth = 12; // w-1 + mx-1

    // Calculate position for all dates before today
    for (let i = 0; i < todayIndex; i++) {
      const dateInfo = allDates[i];
      const nextDate = allDates[i + 1];
      
      // Month separator appears BEFORE the first date of a new month
      if (dateInfo.isMonthStart) {
        scrollPosition += monthSeparatorWidth;
      }
      
      // Add the date width
      scrollPosition += dateWidth;
      
      // Week separator appears AFTER Saturday (if next date is not a month start)
      if (dateInfo.isWeekEnd && (!nextDate || !nextDate.isMonthStart)) {
        scrollPosition += weekSeparatorWidth;
      }
    }
    
    // Add month separator for today if it's a month start (appears before today's date)
    if (allDates[todayIndex]?.isMonthStart) {
      scrollPosition += monthSeparatorWidth;
    }

    // Sync all scroll containers to today's position
    syncScroll(scrollPosition);
  }, [allDates, syncScroll]);

  // Auto-scroll to today on initial load
  const hasAutoScrolledRef = useRef(false);
  useEffect(() => {
    // Only auto-scroll once when goals and dates are available
    if (!hasAutoScrolledRef.current && goals.length > 0 && allDates.length > 0) {
      // Small delay to ensure DOM is ready and scroll containers are registered
      const timer = setTimeout(() => {
        jumpToToday();
        hasAutoScrolledRef.current = true;
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [goals.length, allDates.length, jumpToToday]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-3 sm:gap-4">
        {motivation !== undefined && onUpdateMotivation ? (
          <div className="w-full sm:flex-1 min-w-0">
            <MotivationLine motivation={motivation} onUpdate={onUpdateMotivation} />
          </div>
        ) : (
          <div className="flex-1 hidden sm:block" />
        )}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {monthControls && <div className="flex items-center">{monthControls}</div>}
          <Button
            size="sm"
            variant="outline"
            onClick={jumpToToday}
            title="Jump to today's date"
            className="flex-1 sm:flex-none touch-manipulation"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Today
          </Button>
          <AddGoalDialog onAddGoal={onAddGoal}>
            <Button size="sm" variant="default" className="flex-1 sm:flex-none touch-manipulation">
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </AddGoalDialog>
        </div>
      </div>
      
      {goals.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No goals yet. Add your first goal to get started!
          </CardContent>
        </Card>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-2">
            {/* Shared Dates Header - Sticky and Synchronized */}
            <div className="pb-1.5 border-b sticky top-0 bg-background z-10 shadow-sm">
              <div className="p-2 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-4">
                  <div className="min-w-[120px] sm:min-w-[200px] flex-shrink-0" />
                  <div
                    data-scroll-container="dates"
                    className="flex-1 overflow-x-auto goal-scroll-container"
                  >
                    <DatesHeader months={months} />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Goal Rows with Checkboxes Only */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[]} // Use default modifiers for smooth animations
            >
              <SortableContext
                items={goals.map((g) => g.id)}
                strategy={verticalListSortingStrategy}
              >
                {goals.map((goal, index) => {
                  // On free plan, goals beyond the first 3 are locked
                  const isLocked = !isPro && index >= 3;
                  return (
                    <GoalItem
                      key={goal.id}
                      goal={goal}
                      allDates={allDates}
                      isCompleted={isCompleted}
                      onToggleCompletion={onToggleCompletion}
                      onUpdateGoal={onUpdateGoal}
                      onDeleteGoal={onDeleteGoal}
                      onAuthRequired={onAuthRequired}
                      isLocked={isLocked}
                      onUpgradeClick={onUpgradeClick}
                      allowPastDateEditing={allowPastDateEditing}
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
            
            {/* Show message about locked goals */}
            {!isPro && goals.length > 3 && (
              <Card className="mt-4 border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {goals.length - 3} goal{goals.length - 3 > 1 ? 's' : ''} locked
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Upgrade to Pro to unlock all {goals.length} goals and track unlimited goals.
                      </p>
                    </div>
                    {onUpgradeClick && (
                      <Button
                        size="sm"
                        onClick={onUpgradeClick}
                        className="ml-4"
                      >
                        Upgrade to Pro
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

