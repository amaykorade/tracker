"use client";

import { Goal, MonthData } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Check, GripVertical } from "lucide-react";
import { formatDateKey } from "@/lib/date-utils";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useRef, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";

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
  onRegisterScroll?: (ref: HTMLDivElement | null) => void;
  onAuthRequired?: () => void;
}

export function GoalItem({
  goal,
  allDates,
  isCompleted,
  onToggleCompletion,
  onDeleteGoal,
  onUpdateGoal,
  onRegisterScroll,
  onAuthRequired,
}: GoalItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: goal.id });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(goal.title);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (onRegisterScroll && scrollContainerRef.current) {
      onRegisterScroll(scrollContainerRef.current);
    }
    return () => {
      if (onRegisterScroll) {
        onRegisterScroll(null);
      }
    };
  }, [onRegisterScroll]);

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
      if (saveTimeout) {
        clearTimeout(saveTimeout);
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
        setSaveTimeout(null);
      }, 5000);

      setSaveTimeout(timeout);

      return () => {
        clearTimeout(timeout);
      };
    } else if (!isEditing && saveTimeout) {
      // Clear timeout when not editing
      clearTimeout(saveTimeout);
      setSaveTimeout(null);
    }
  }, [editedTitle, isEditing, goal.title, goal.id, onUpdateGoal, saveTimeout]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      setSaveTimeout(null);
    }
    if (editedTitle.trim() && editedTitle !== goal.title) {
      onUpdateGoal(goal.id, editedTitle.trim());
    } else if (!editedTitle.trim()) {
      // If empty, revert to original
      setEditedTitle(goal.title);
    }
    setIsEditing(false);
  }, [editedTitle, goal.id, goal.title, onUpdateGoal, saveTimeout]);

  const handleCancel = useCallback(() => {
    setEditedTitle(goal.title);
    setIsEditing(false);
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      setSaveTimeout(null);
    }
  }, [goal.title, saveTimeout]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "hover:shadow-md transition-shadow",
        isDragging && "shadow-lg"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Drag Handle and Goal Title */}
          <div className="flex items-center gap-2 w-[200px] flex-shrink-0">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded flex-shrink-0"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="flex-1 min-w-0 overflow-x-auto goal-scroll-container">
              {isEditing ? (
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
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDeleteGoal(goal.id)}
              className="text-destructive hover:text-destructive h-8 w-8 flex-shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Checkboxes Row */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-x-auto scroll-smooth goal-scroll-container"
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
                
                // Check if date is in the future
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dateToCheck = new Date(date);
                dateToCheck.setHours(0, 0, 0, 0);
                const isFutureDate = dateToCheck > today;

                // Add the checkbox button with enhanced date visibility
                elements.push(
                  <button
                    key={`${dateKey}-${index}`}
                    onClick={async () => {
                      if (!isCurrentMonth || isFutureDate) return;
                      // Check if auth is required
                      try {
                        await onToggleCompletion(goal.id, dateKey);
                      } catch (error: any) {
                        if (error.message === "Authentication required" && onAuthRequired) {
                          onAuthRequired();
                        }
                      }
                    }}
                    disabled={!isCurrentMonth || isFutureDate}
                    className={cn(
                      "w-10 h-10 border rounded flex flex-col items-center justify-center transition-all flex-shrink-0 group relative",
                      completed
                        ? "bg-green-500 border-green-600 text-white"
                        : "bg-background border-input hover:bg-accent",
                      (!isCurrentMonth || isFutureDate) && "cursor-not-allowed opacity-50"
                    )}
                    title={isFutureDate 
                      ? "Future dates cannot be completed" 
                      : `${goal.title} - ${format(date, "MMM d, yyyy")}`}
                  >
                    {completed && <Check className="h-4 w-4" />}
                    {/* Show date on hover for better visibility */}
                    {!isFutureDate && (
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
  );
}

