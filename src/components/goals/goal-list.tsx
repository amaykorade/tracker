"use client";

import { Goal, MonthData } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calendar } from "lucide-react";
import { AddGoalDialog } from "./add-goal-dialog";
import { GoalItem } from "./goal-item";
import { DatesHeader } from "./dates-header";
import { MotivationLine } from "./motivation-line";
import { useMemo, useRef, useEffect } from "react";
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

  // Synchronize scrolling between dates header and goal rows using unified approach
  const datesHeaderRef = useRef<HTMLDivElement>(null);
  const goalScrollRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isSyncingRef = useRef(false);
  const scrollPositionRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  // Unified scroll sync - updates all elements in a single frame for perfect alignment
  const syncAllScrollPositions = (scrollLeft: number, sourceRef?: HTMLDivElement) => {
    // Prevent recursive updates
    if (isSyncingRef.current) return;
    
    // Store the scroll position
    scrollPositionRef.current = scrollLeft;

    // Cancel any pending animation frame
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    // Use a single requestAnimationFrame to update all elements together
    rafIdRef.current = requestAnimationFrame(() => {
      isSyncingRef.current = true;

      // Update dates header
      if (datesHeaderRef.current && datesHeaderRef.current !== sourceRef) {
        datesHeaderRef.current.scrollLeft = scrollLeft;
      }
      
      // Update all goal rows in the same frame
      goalScrollRefs.current.forEach((ref) => {
        if (ref && ref !== sourceRef) {
          ref.scrollLeft = scrollLeft;
        }
      });

      // Reset flag immediately after updates complete
      isSyncingRef.current = false;
      rafIdRef.current = null;
    });
  };

  // Register goal scroll container with unified scroll handler
  const registerGoalScroll = (goalId: string, ref: HTMLDivElement | null) => {
    if (ref) {
      goalScrollRefs.current.set(goalId, ref);
      
      // Unified scroll handler - directly updates all elements
      const handleScrollEvent = () => {
        // Only sync if we're not already syncing (to prevent loops)
        if (!isSyncingRef.current) {
          syncAllScrollPositions(ref.scrollLeft, ref);
        }
      };
      
      ref.addEventListener("scroll", handleScrollEvent, { passive: true });
      // Store cleanup function
      (ref as any).__scrollCleanup = handleScrollEvent;
    } else {
      const oldRef = goalScrollRefs.current.get(goalId);
      if (oldRef && (oldRef as any).__scrollCleanup) {
        oldRef.removeEventListener("scroll", (oldRef as any).__scrollCleanup);
      }
      goalScrollRefs.current.delete(goalId);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any pending animation frame
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      // Clean up scroll listeners
      goalScrollRefs.current.forEach((ref) => {
        if (ref && (ref as any).__scrollCleanup) {
          ref.removeEventListener("scroll", (ref as any).__scrollCleanup);
        }
      });
    };
  }, []);

  // Jump to today's date (based on 5 AM cutoff)
  const jumpToToday = () => {
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
    // Each date box is w-10 (40px) + gap-1 (4px) = 44px
    // Separators: month separator = w-2 (8px) + mx-1.5 (12px) = 20px, week separator = w-1 (4px) + mx-1 (8px) = 12px
    let scrollPosition = 0;
    const dateWidth = 44; // w-10 + gap-1
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

    // Center today's date in view (subtract half viewport width)
    const scrollContainer = datesHeaderRef.current;
    if (scrollContainer) {
      const viewportWidth = scrollContainer.clientWidth;
      const centeredPosition = Math.max(0, scrollPosition - viewportWidth / 2 + dateWidth / 2);
      
      // Temporarily disable smooth scrolling for instant jump
      scrollContainer.style.scrollBehavior = 'auto';
      scrollContainer.scrollLeft = centeredPosition;
      
      // Sync all other containers
      goalScrollRefs.current.forEach((ref) => {
        if (ref) {
          ref.style.scrollBehavior = 'auto';
          ref.scrollLeft = centeredPosition;
        }
      });

      // Restore smooth scrolling
      setTimeout(() => {
        scrollContainer.style.scrollBehavior = 'smooth';
        goalScrollRefs.current.forEach((ref) => {
          if (ref) {
            ref.style.scrollBehavior = 'smooth';
          }
        });
      }, 100);
    }
  };
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 gap-4">
        {motivation !== undefined && onUpdateMotivation ? (
          <MotivationLine motivation={motivation} onUpdate={onUpdateMotivation} />
        ) : (
          <div className="flex-1" />
        )}
        <div className="flex items-center gap-2">
          {monthControls && <div className="flex items-center">{monthControls}</div>}
          <Button
            size="sm"
            variant="outline"
            onClick={jumpToToday}
            title="Jump to today's date"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Today
          </Button>
          <AddGoalDialog onAddGoal={onAddGoal}>
            <Button size="sm" variant="default">
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
              <div className="p-4">
                <div className="flex items-start gap-4">
                  <div className="min-w-[200px] flex-shrink-0" />
                  <div
                    ref={datesHeaderRef}
                    className="flex-1 overflow-x-auto goal-scroll-container"
                    onScroll={(e) => {
                      if (!isSyncingRef.current) {
                        syncAllScrollPositions(e.currentTarget.scrollLeft, e.currentTarget);
                      }
                    }}
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
                      onRegisterScroll={(ref) => registerGoalScroll(goal.id, ref)}
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

