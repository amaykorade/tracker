"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import {
  User,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, Timestamp, onSnapshot } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  /** Subscription plan, defaults to "free" when not set or user is unauthenticated */
  plan: "free" | "pro";
  /** Billing interval for Pro plan */
  billingInterval: "monthly" | "yearly" | null;
  /** When the Pro plan expires; null for free users */
  planExpiresAt: Date | null;
  /** Convenience flag derived from plan and expiry */
  isPro: boolean;
  /** Allow editing past dates (for marketing/demo purposes) */
  allowPastDateEditing: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly" | null>(null);
  const [planExpiresAt, setPlanExpiresAt] = useState<Date | null>(null);
  const [allowPastDateEditing, setAllowPastDateEditing] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check if user document exists, if not create it with account creation date
          const userRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userRef);

          if (!userDoc.exists()) {
            // New user - create user document with account creation date
            await setDoc(userRef, {
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              accountCreatedAt: Timestamp.now(),
              lastLoginAt: Timestamp.now(),
              // Default all new users to free plan; this can be upgraded later
              plan: "free",
              billingInterval: null,
              planExpiresAt: null,
              // Default: false (only today allowed), can be set to true for marketing
              allowPastDateEditing: false,
            });
            setPlan("free");
            setBillingInterval(null);
            setPlanExpiresAt(null);
            setAllowPastDateEditing(false);
          } else {
            // Existing user - update last login time and sync profile data
            const data = userDoc.data();
            const userPlan = (data.plan as "free" | "pro") ?? "free";

            await setDoc(
              userRef,
              {
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                lastLoginAt: Timestamp.now(),
                // Do not overwrite existing plan unless it's missing
                ...(data.plan ? {} : { plan: userPlan }),
              },
              { merge: true }
            );

            setPlan(userPlan);
            setBillingInterval(
              data.billingInterval === "monthly" || data.billingInterval === "yearly"
                ? data.billingInterval
                : null
            );
            setPlanExpiresAt(
              data.planExpiresAt && typeof data.planExpiresAt.toDate === "function"
                ? data.planExpiresAt.toDate()
                : null
            );
            // Read allowPastDateEditing setting (defaults to false)
            setAllowPastDateEditing(data.allowPastDateEditing === true);
          }
        } catch (error) {
          console.error("Error saving user data:", error);
          // Continue even if user data save fails
        }
      } else {
        // When logged out, reset plan to free
        setPlan("free");
        setBillingInterval(null);
        setPlanExpiresAt(null);
        setAllowPastDateEditing(false);
      }
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  // Keep plan in sync with user document in Firestore
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      async (snapshot) => {
        const data = snapshot.data();
        if (!data) return;

        let nextPlan: "free" | "pro" =
          data.plan === "pro" || data.plan === "free" ? data.plan : "free";
        let nextBilling: "monthly" | "yearly" | null =
          data.billingInterval === "monthly" || data.billingInterval === "yearly"
            ? data.billingInterval
            : null;
        let nextExpires: Date | null =
          data.planExpiresAt && typeof data.planExpiresAt.toDate === "function"
            ? data.planExpiresAt.toDate()
            : null;

        // If Pro but expired, downgrade to free
        if (nextPlan === "pro" && nextExpires && nextExpires.getTime() <= Date.now()) {
          nextPlan = "free";
          nextBilling = null;
          nextExpires = null;
          try {
            await setDoc(
              userRef,
              { plan: "free", billingInterval: null, planExpiresAt: null },
              { merge: true }
            );
          } catch {
            // Ignore downgrade write errors on client
          }
        }

        setPlan(nextPlan);
        setBillingInterval(nextBilling);
        setPlanExpiresAt(nextExpires);
        // Update allowPastDateEditing from Firestore
        setAllowPastDateEditing(data.allowPastDateEditing === true);
      },
      () => {
        // On error, do not change current plan state
      }
    );

    return () => unsubscribe();
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        plan,
        billingInterval,
        planExpiresAt,
        isPro: plan === "pro" && (!planExpiresAt || planExpiresAt.getTime() > Date.now()),
        allowPastDateEditing,
        signInWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

