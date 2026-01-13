"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Chrome } from "lucide-react";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AuthDialog({ open, onOpenChange, onSuccess }: AuthDialogProps) {
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setLoading(true);

    try {
      await signInWithGoogle();
      onOpenChange(false);
      onSuccess?.();
      toast({
        title: "Signed in successfully",
        description: "You can now track your goals!",
      });
    } catch (err: any) {
      // Don't show error if user closed the popup
      if (err.code === "auth/popup-closed-by-user") {
        // Silently handle - user intentionally closed the popup
        onOpenChange(false);
        return;
      }

      // Only show user-friendly error messages
      let errorMessage = "Unable to sign in. Please try again.";
      
      if (err.code === "auth/account-exists-with-different-credential") {
        errorMessage = "An account with this email already exists. Please use a different sign-in method.";
      } else if (err.code === "auth/popup-blocked") {
        errorMessage = "Popup was blocked. Please allow popups for this site and try again.";
      } else if (err.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (err.message && err.message.includes("user")) {
        // Only show errors that are user-related
        errorMessage = err.message;
      }

      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign In to Track Progress</DialogTitle>
          <DialogDescription>
            Sign in with Google to mark goals as complete and track your progress across devices.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <Chrome className="h-4 w-4 mr-2" />
                Continue with Google
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

