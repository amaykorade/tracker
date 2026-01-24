"use client";

import { Goal, MonthData } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Check, GripVertical, AlertTriangle } from "lucide-react";
import { formatDateKey, getTrackingDate, compareWithTrackingDate } from "@/lib/date-utils";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useRef, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GoalItemProps {
  goal: Goal;
  allDates: Array<{ 
    date: Date; 
    isCurrentMonth: boolean; 
    isWeekEnd: boolean;
    isMonthStart: boolean;
  }>;
  isCompleted: (goalId: string, date: string) => boolean;
  onToggleCompletion: (goalId: string, date: string) => void;
  onDeleteGoal: (id: string) => void;
  onUpdateGoal: (id: string, title: string) => void;
  onAuthRequired?: () => void;
  isLocked?: boolean;
  onUpgradeClick?: () => void;
  allowPastDateEditing?: boolean;
}

export function GoalItem({
  goal,
  allDates,
  isCompleted,
  onToggleCompletion,
  onDeleteGoal,
  onUpdateGoal,
  onAuthRequired,
  isLocked = false,
  onUpgradeClick,
  allowPastDateEditing = false,
}: GoalItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: goal.id,
    disabled: isLocked, // Disable drag for locked goals
    animateLayoutChanges: () => true, // Always animate layout changes for smooth transitions
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(goal.title);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update editedTitle when goal.title changes (from external updates)
  useEffect(() => {
    if (!isEditing) {
      setEditedTitle(goal.title);
    }
  }, [goal.title, isEditing]);

  // Auto-save after 5 seconds of no activity
  useEffect(() => {
    if (isEditing && editedTitle !== goal.title) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout
      const timeout = setTimeout(() => {
        if (editedTitle.trim() && editedTitle !== goal.title) {
          onUpdateGoal(goal.id, editedTitle.trim());
        } else if (!editedTitle.trim()) {
          // If empty, revert to original
          setEditedTitle(goal.title);
        }
        setIsEditing(false);
        saveTimeoutRef.current = null;
      }, 5000);

      saveTimeoutRef.current = timeout;

      return () => {
        clearTimeout(timeout);
      };
    } else if (!isEditing && saveTimeoutRef.current) {
      // Clear timeout when not editing
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, [editedTitle, isEditing, goal.title, goal.id, onUpdateGoal]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (editedTitle.trim() && editedTitle !== goal.title) {
      onUpdateGoal(goal.id, editedTitle.trim());
    } else if (!editedTitle.trim()) {
      // If empty, revert to original
      setEditedTitle(goal.title);
    }
    setIsEditing(false);
  }, [editedTitle, goal.id, goal.title, onUpdateGoal]);

  const handleCancel = useCallback(() => {
    setEditedTitle(goal.title);
    setIsEditing(false);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, [goal.title]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  // Always use consistent transition timing for all items to ensure synchronized movement
  // When dnd-kit provides a transition, use it; otherwise use a consistent default
  const transitionStyle = transition || 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)';
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transitionStyle,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1, // Ensure dragged item is on top
    willChange: 'transform', // Optimize for GPU acceleration
  };

  const handleLockedAction = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    onDeleteGoal(goal.id);
    setDeleteDialogOpen(false);
  };

  return (
    <>
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "hover:shadow-md",
        // Only apply shadow transition when not being transformed
        !transform && !isDragging && "transition-shadow duration-200 ease-in-out",
        isDragging && "shadow-lg ring-2 ring-primary/20",
        isLocked && "opacity-60 border-dashed"
      )}
    >
      <CardContent className="p-2 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-4">
          {/* Drag Handle and Goal Title */}
          <div className="flex items-center gap-2 w-[120px] sm:w-[200px] flex-shrink-0">
            {isLocked ? (
              <div className="p-1 flex-shrink-0">
                <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            ) : (
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded flex-shrink-0"
                aria-label="Drag to reorder"
              >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </button>
            )}
            <div className="flex-1 min-w-0 overflow-x-auto goal-scroll-container">
              {isLocked ? (
                <span
                  className="font-medium whitespace-nowrap block text-muted-foreground px-1 py-0.5"
                  title="Upgrade to Pro to unlock this goal"
                >
                  {goal.title}
                </span>
              ) : isEditing ? (
                <Input
                  ref={inputRef}
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleSave}
                  onKeyDown={handleKeyDown}
                  className="h-auto p-1 text-sm font-medium border-primary focus-visible:ring-1"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className="font-medium whitespace-nowrap block cursor-text hover:bg-accent/50 px-1 py-0.5 rounded transition-colors"
                  onClick={() => setIsEditing(true)}
                  title="Click to edit"
                >
                  {goal.title}
                </span>
              )}
            </div>
            {isLocked ? (
              <Button
                size="icon"
                variant="ghost"
                onClick={handleLockedAction}
                className="text-muted-foreground hover:text-primary h-8 w-8 flex-shrink-0"
                title="Upgrade to Pro to unlock"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            ) : (
              <Button
                size="icon"
                variant="ghost"
                onClick={handleDeleteClick}
                className="text-destructive hover:text-destructive h-8 w-8 flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Checkboxes Row */}
          <div
            ref={scrollContainerRef}
            data-scroll-container="goal"
            className="flex-1 overflow-x-auto goal-scroll-container"
          >
            <div className="flex gap-1 min-w-max">
              {allDates.flatMap(({ date, isCurrentMonth, isWeekEnd, isMonthStart }, index) => {
                const dateKey = formatDateKey(date);
                const completed = isCompleted(goal.id, dateKey);
                const elements = [];
                
                // Add month separator BEFORE the first date of new month (after previous month ends)
                if (isMonthStart) {
                  elements.push(
                    <div
                      key={`month-separator-checkbox-${index}`}
                      className="w-2 bg-primary/70 mx-1.5 self-stretch rounded flex-shrink-0"
                      aria-label="Month start"
                      title={`${format(date, "MMMM yyyy")} start`}
                    />
                  );
                }
                // Add week end separator after Saturday (if not a month start)
                else if (isWeekEnd && index > 0) {
                  // Check if next date is a month start - if so, don't show week separator
                  const nextDate = allDates[index + 1];
                  if (!nextDate || !nextDate.isMonthStart) {
                    elements.push(
                      <div
                        key={`week-separator-checkbox-${index}`}
                        className="w-1 bg-primary/40 mx-1 self-stretch rounded flex-shrink-0"
                        aria-label="Week end"
                        title="Week end"
                      />
                    );
                  }
                }
                
                // Check if date is in the future or past (only allow today based on 5 AM cutoff)
                const comparison = compareWithTrackingDate(dateKey);
                const isFutureDate = comparison > 0;
                const isPastDate = comparison < 0;
                const isToday = comparison === 0;

                // Add the checkbox button with enhanced date visibility
                // Disable if: not current month, future date, past date (if not allowed), or locked
                // If allowPastDateEditing is true, past dates are enabled
                const isCheckboxDisabled = !isCurrentMonth || isFutureDate || (isPastDate && !allowPastDateEditing) || isLocked;
                elements.push(
                  <button
                    key={`${dateKey}-${index}`}
                    onClick={async () => {
                      if (isLocked) {
                        handleLockedAction();
                        return;
                      }
                      // Allow past dates if allowPastDateEditing is true, but always block future dates
                      if (!isCurrentMonth || isFutureDate || (isPastDate && !allowPastDateEditing)) return;
                      // Check if auth is required
                      try {
                        await onToggleCompletion(goal.id, dateKey);
                      } catch (error: any) {
                        if (error.message === "Authentication required" && onAuthRequired) {
                          onAuthRequired();
                        }
                      }
                    }}
                    disabled={isCheckboxDisabled}
                    className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 border rounded flex flex-col items-center justify-center transition-all flex-shrink-0 group relative touch-manipulation",
                      completed
                        ? "bg-green-500 border-green-600 text-white"
                        : "bg-background border-input hover:bg-accent active:bg-accent",
                      isCheckboxDisabled && "cursor-not-allowed opacity-50",
                      isLocked && "opacity-30"
                    )}
                    title={
                      isLocked
                        ? "Upgrade to Pro to unlock this goal"
                        : isFutureDate 
                        ? "Future dates cannot be completed" 
                        : isPastDate && !allowPastDateEditing
                        ? "Past dates cannot be changed"
                        : `${goal.title} - ${format(date, "MMM d, yyyy")}`
                    }
                  >
                    {completed && <Check className="h-3 w-3 sm:h-4 sm:w-4" />}
                    {/* Show date on hover for better visibility (only for today) */}
                    {isToday && !isLocked && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                        {format(date, "MMM d")}
                      </div>
                    )}
                  </button>
                );
                
                return elements;
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Delete Confirmation Dialog - Rendered outside Card to avoid clipping */}
    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Goal
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>"{goal.title}"</strong>? This action cannot be undone and will permanently delete all tracking data for this goal.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleConfirmDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Goal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

