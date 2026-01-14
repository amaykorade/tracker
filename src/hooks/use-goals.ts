import { useState, useCallback, useEffect } from "react";
import { Goal, GoalCompletion } from "@/types";
import { db } from "@/lib/firebase";
import { useAuth } from "./use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  onSnapshot,
  setDoc,
  updateDoc,
  Timestamp,
  writeBatch,
} from "firebase/firestore";

const LOCAL_STORAGE_GOALS_KEY = "tracker_goals";
const LOCAL_STORAGE_MOTIVATION_KEY = "tracker_motivation";
const LOCAL_STORAGE_DEFAULTS_ADDED_KEY = "tracker_defaults_added";

export function useGoals() {
  const { user, isPro } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [completions, setCompletions] = useState<Map<string, GoalCompletion>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [motivation, setMotivation] = useState<string>("");

  // Add default goals for new users
  const addDefaultGoals = useCallback(async () => {
    const defaultGoals = [
      { title: "Reading", sortOrder: 0 },
      { title: "Fitness", sortOrder: 1 },
    ];

    try {
      if (user) {
        // User is authenticated - add to Firestore
        const batch = writeBatch(db);
        for (const defaultGoal of defaultGoals) {
          const goalRef = doc(collection(db, "goals"));
          batch.set(goalRef, {
            title: defaultGoal.title,
            createdAt: Timestamp.now(),
            sortOrder: defaultGoal.sortOrder,
          });
        }
        await batch.commit();
      } else {
        // User is not authenticated - add to localStorage
        const newGoals: Goal[] = defaultGoals.map((dg, index) => ({
          id: `temp-${Date.now()}-${index}`,
          title: dg.title,
          createdAt: new Date(),
          sortOrder: dg.sortOrder,
        }));
        localStorage.setItem(LOCAL_STORAGE_GOALS_KEY, JSON.stringify(newGoals));
        setGoals(newGoals);
      }
      // Mark defaults as added
      localStorage.setItem(LOCAL_STORAGE_DEFAULTS_ADDED_KEY, "true");
    } catch (error) {
      console.error("Error adding default goals:", error);
    }
  }, [user]);

  // Load goals from Firestore (authenticated) or localStorage (unauthenticated)
  useEffect(() => {
    if (user) {
      // User is authenticated - load from Firestore
      const goalsRef = collection(db, "goals");
      const unsubscribeGoals = onSnapshot(
        goalsRef,
        async (snapshot) => {
          const goalsData: Goal[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            goalsData.push({
              id: doc.id,
              title: data.title,
              createdAt: data.createdAt?.toDate() || new Date(),
              sortOrder: data.sortOrder ?? 0,
            });
          });
          // Sort by sortOrder, then by createdAt
          goalsData.sort((a, b) => {
            if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
              return a.sortOrder - b.sortOrder;
            }
            return a.createdAt.getTime() - b.createdAt.getTime();
          });
          setGoals(goalsData);
          setLoading(false);

          // Add default goals if this is a new user (no goals and defaults not added)
          if (goalsData.length === 0) {
            const defaultsAdded = localStorage.getItem(LOCAL_STORAGE_DEFAULTS_ADDED_KEY);
            if (!defaultsAdded) {
              await addDefaultGoals();
            }
          }
        },
        (error) => {
          console.error("Error loading goals from Firestore:", error);
          setLoading(false);
          // Fallback to empty array on error
          setGoals([]);
        }
      );

      return () => unsubscribeGoals();
    } else {
      // User is not authenticated - load from localStorage
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_GOALS_KEY);
        if (stored) {
          const goalsData: Goal[] = JSON.parse(stored);
          // Convert string dates back to Date objects
          const goalsWithDates = goalsData.map(goal => ({
            ...goal,
            createdAt: goal.createdAt instanceof Date 
              ? goal.createdAt 
              : new Date(goal.createdAt),
          }));
          setGoals(goalsWithDates);
        } else {
          // Check if defaults have been added
          const defaultsAdded = localStorage.getItem(LOCAL_STORAGE_DEFAULTS_ADDED_KEY);
          if (!defaultsAdded) {
            // Add default goals for new user
            const defaultGoals: Goal[] = [
              {
                id: `temp-${Date.now()}-0`,
                title: "Reading",
                createdAt: new Date(),
                sortOrder: 0,
              },
              {
                id: `temp-${Date.now()}-1`,
                title: "Fitness",
                createdAt: new Date(),
                sortOrder: 1,
              },
            ];
            localStorage.setItem(LOCAL_STORAGE_GOALS_KEY, JSON.stringify(defaultGoals));
            localStorage.setItem(LOCAL_STORAGE_DEFAULTS_ADDED_KEY, "true");
            setGoals(defaultGoals);
          } else {
            setGoals([]);
          }
        }
      } catch (error) {
        console.error("Error loading goals from localStorage:", error);
        setGoals([]);
      }
      setLoading(false);
    }
  }, [user, addDefaultGoals]);

  // Load completions from Firestore (authenticated) or localStorage (unauthenticated)
  useEffect(() => {
    if (user) {
      // User is authenticated - load from Firestore
      const completionsRef = collection(db, "completions");
      const unsubscribeCompletions = onSnapshot(
        completionsRef,
        (snapshot) => {
          const completionsMap = new Map<string, GoalCompletion>();
          snapshot.forEach((doc) => {
            const data = doc.data();
            const key = `${data.goalId}-${data.date}`;
            completionsMap.set(key, {
              goalId: data.goalId,
              date: data.date,
              completed: data.completed || true,
            });
          });
          setCompletions(completionsMap);
        },
        (error) => {
          console.error("Error loading completions from Firestore:", error);
          // Fallback to empty map on error
          setCompletions(new Map());
        }
      );

      return () => unsubscribeCompletions();
    } else {
      // User is not authenticated - completions are not stored (they need to login to track)
      setCompletions(new Map());
    }
  }, [user]);

  // Load motivation from Firestore (authenticated) or localStorage (unauthenticated)
  useEffect(() => {
    if (user) {
      // User is authenticated - load from Firestore
      const motivationRef = doc(db, "settings", "motivation");
      const unsubscribe = onSnapshot(
        motivationRef,
        (snapshot) => {
          if (snapshot.exists()) {
            setMotivation(snapshot.data().text || "");
          } else {
            setMotivation("");
          }
        },
        (error) => {
          // Document doesn't exist yet, which is fine
          setMotivation("");
        }
      );

      return () => unsubscribe();
    } else {
      // User is not authenticated - load from localStorage
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_MOTIVATION_KEY);
        setMotivation(stored || "");
      } catch (error) {
        console.error("Error loading motivation from localStorage:", error);
        setMotivation("");
      }
    }
  }, [user]);

  const updateMotivation = useCallback(async (text: string) => {
    try {
      if (user) {
        const motivationRef = doc(db, "settings", "motivation");
        await setDoc(motivationRef, { text }, { merge: true });
      } else {
        localStorage.setItem(LOCAL_STORAGE_MOTIVATION_KEY, text);
      }
      setMotivation(text);
    } catch (error) {
      console.error("Error updating motivation:", error);
      throw error;
    }
  }, [user]);

  const addGoal = useCallback(async (title: string) => {
    try {
      // Enforce free tier goal limit for non-Pro users (authenticated or guest)
      if (!isPro && goals.length >= 3) {
        toast({
          title: "Goal limit reached",
          description: "Free plan allows up to 3 goals. Upgrade to Pro to add more goals.",
        });
        // Soft-fail: show toast but don't throw, to avoid unhandled promise rejections in UI
        return;
      }

      // Get the highest sortOrder and add 1
      const maxSortOrder = goals.length > 0 
        ? Math.max(...goals.map(g => g.sortOrder ?? 0))
        : -1;
      
      const newGoal: Goal = {
        id: `temp-${Date.now()}-${Math.random()}`,
        title,
        createdAt: new Date(),
        sortOrder: maxSortOrder + 1,
      };

      if (user) {
        // User is authenticated - save to Firestore
        const docRef = await addDoc(collection(db, "goals"), {
          title,
          createdAt: Timestamp.now(),
          sortOrder: maxSortOrder + 1,
        });
        newGoal.id = docRef.id;
      } else {
        // User is not authenticated - save to localStorage
        const updatedGoals = [...goals, newGoal];
        localStorage.setItem(LOCAL_STORAGE_GOALS_KEY, JSON.stringify(updatedGoals));
        setGoals(updatedGoals);
      }
      
      return newGoal;
    } catch (error) {
      console.error("Error adding goal:", error);
      throw error;
    }
  }, [goals, user, isPro, toast]);

  const deleteGoal = useCallback(async (id: string) => {
    try {
      if (user) {
        // User is authenticated - delete from Firestore
        await deleteDoc(doc(db, "goals", id));
        
        // Delete all completions for this goal
        const completionsRef = collection(db, "completions");
        const q = query(completionsRef, where("goalId", "==", id));
        const snapshot = await getDocs(q);
        
        const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      } else {
        // User is not authenticated - delete from localStorage
        const updatedGoals = goals.filter(g => g.id !== id);
        localStorage.setItem(LOCAL_STORAGE_GOALS_KEY, JSON.stringify(updatedGoals));
        setGoals(updatedGoals);
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
      throw error;
    }
  }, [goals, user]);

  const toggleCompletion = useCallback(
    async (goalId: string, date: string) => {
      if (!user) {
        // User must be authenticated to toggle completion
        throw new Error("Authentication required");
      }
      
      try {
        const key = `${goalId}-${date}`;
        const completionRef = doc(db, "completions", key);
        const existing = completions.has(key);
        
        if (existing) {
          // Delete completion
          await deleteDoc(completionRef);
        } else {
          // Add completion
          await setDoc(completionRef, {
            goalId,
            date,
            completed: true,
          });
        }
      } catch (error) {
        console.error("Error toggling completion:", error);
        throw error;
      }
    },
    [completions, user]
  );

  const isCompleted = useCallback(
    (goalId: string, date: string): boolean => {
      const key = `${goalId}-${date}`;
      return completions.has(key);
    },
    [completions]
  );

  const updateGoal = useCallback(
    async (id: string, title: string) => {
      try {
        if (user) {
          // User is authenticated - update in Firestore
          if (!id.startsWith("temp-")) {
            const goalRef = doc(db, "goals", id);
            await updateDoc(goalRef, { title });
          }
        } else {
          // User is not authenticated - update in localStorage
          const updatedGoals = goals.map((goal) =>
            goal.id === id ? { ...goal, title } : goal
          );
          localStorage.setItem(LOCAL_STORAGE_GOALS_KEY, JSON.stringify(updatedGoals));
          setGoals(updatedGoals);
        }
      } catch (error) {
        console.error("Error updating goal:", error);
        throw error;
      }
    },
    [goals, user]
  );

  const reorderGoals = useCallback(
    async (activeId: string, overId: string) => {
      try {
        const activeIndex = goals.findIndex((g) => g.id === activeId);
        const overIndex = goals.findIndex((g) => g.id === overId);

        if (activeIndex === -1 || overIndex === -1) return;

        const newGoals = [...goals];
        const [movedGoal] = newGoals.splice(activeIndex, 1);
        newGoals.splice(overIndex, 0, movedGoal);

        if (user) {
          // User is authenticated - update in Firestore
          const batch = writeBatch(db);
          newGoals.forEach((goal, index) => {
            // Skip temp IDs (localStorage goals that haven't been migrated yet)
            if (!goal.id.startsWith("temp-")) {
              const goalRef = doc(db, "goals", goal.id);
              batch.update(goalRef, { sortOrder: index });
            }
          });
          await batch.commit();
        } else {
          // User is not authenticated - update in localStorage
          newGoals.forEach((goal, index) => {
            goal.sortOrder = index;
          });
          localStorage.setItem(LOCAL_STORAGE_GOALS_KEY, JSON.stringify(newGoals));
          setGoals(newGoals);
        }
      } catch (error) {
        console.error("Error reordering goals:", error);
        throw error;
      }
    },
    [goals, user]
  );

  // Migrate localStorage data to Firestore after login
  const migrateLocalDataToFirestore = useCallback(async () => {
    if (!user) return;

    try {
      // Migrate goals
      const storedGoals = localStorage.getItem(LOCAL_STORAGE_GOALS_KEY);
      if (storedGoals) {
        const localGoals: Goal[] = JSON.parse(storedGoals);
        const goalsToMigrate = localGoals.filter(goal => goal.id.startsWith("temp-"));
        
        if (goalsToMigrate.length > 0) {
          const batch = writeBatch(db);
          
          for (const goal of goalsToMigrate) {
            const goalRef = doc(collection(db, "goals"));
            // Convert string date back to Date object if needed
            const createdAt = goal.createdAt instanceof Date 
              ? goal.createdAt 
              : new Date(goal.createdAt);
            
            batch.set(goalRef, {
              title: goal.title,
              createdAt: Timestamp.fromDate(createdAt),
              sortOrder: goal.sortOrder ?? 0,
            });
          }
          
          await batch.commit();
        }
        
        // Clear localStorage after successful migration
        localStorage.removeItem(LOCAL_STORAGE_GOALS_KEY);
      }

      // Migrate motivation (only if Firestore doesn't have one)
      const storedMotivation = localStorage.getItem(LOCAL_STORAGE_MOTIVATION_KEY);
      if (storedMotivation) {
        const motivationRef = doc(db, "settings", "motivation");
        // Use merge to not overwrite existing motivation
        await setDoc(motivationRef, { text: storedMotivation }, { merge: true });
        localStorage.removeItem(LOCAL_STORAGE_MOTIVATION_KEY);
      }
    } catch (error) {
      console.error("Error migrating local data to Firestore:", error);
    }
  }, [user]);

  // Migrate data when user logs in
  useEffect(() => {
    if (user) {
      migrateLocalDataToFirestore();
    }
  }, [user, migrateLocalDataToFirestore]);

  return {
    goals,
    completions,
    loading,
    motivation,
    updateMotivation,
    addGoal,
    updateGoal,
    deleteGoal,
    toggleCompletion,
    isCompleted,
    reorderGoals,
  };
}

