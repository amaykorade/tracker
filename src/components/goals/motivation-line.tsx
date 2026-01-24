"use client";

import { useState, useRef, useEffect } from "react";
import { Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MotivationLineProps {
  motivation: string;
  onUpdate: (text: string) => void;
}

export function MotivationLine({ motivation, onUpdate }: MotivationLineProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(motivation);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(motivation);
  }, [motivation]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    onUpdate(value.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setValue(motivation);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 flex-1 flex-wrap sm:flex-nowrap">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your motivation..."
          className="flex-1 min-w-0 text-sm sm:text-base"
        />
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={handleSave} className="h-8 w-8 flex-shrink-0 touch-manipulation">
            <Check className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={handleCancel} className="h-8 w-8 flex-shrink-0 touch-manipulation">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-1 group min-w-0">
      {motivation ? (
        <p className="text-sm sm:text-lg font-medium text-foreground flex-1 min-w-0 break-words">{motivation}</p>
      ) : (
        <p className="text-sm sm:text-lg font-medium text-muted-foreground flex-1 italic min-w-0 break-words">
          Click to add your motivation...
        </p>
      )}
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className="h-8 w-8 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation"
      >
        <Edit2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

