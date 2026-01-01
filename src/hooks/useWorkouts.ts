"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAllWorkouts, transformWorkouts, SimplifiedWorkout } from "@/lib/api-client";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { useEffect, useState } from "react";

const CACHE_KEY = "hevy_workouts_cache";
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

interface CachedData {
    timestamp: number;
    workouts: SimplifiedWorkout[];
}

export function useWorkouts() {
    const hevyApiKey = useAppStore((state) => state.hevyApiKey);
    const queryClient = useQueryClient();
    const [isSyncing, setIsSyncing] = useState(false);

    // Helper to load from local storage
    const loadFromCache = (): SimplifiedWorkout[] | null => {
        if (typeof window === "undefined") return null;
        try {
            const stored = localStorage.getItem(CACHE_KEY);
            if (!stored) return null;

            const data: CachedData = JSON.parse(stored);
            return data.workouts;
        } catch (e) {
            console.error("[useWorkouts] Cache read failed", e);
            return null;
        }
    };

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["workouts", hevyApiKey],
        queryFn: async () => {
            const cached = loadFromCache();
            if (cached && cached.length > 0) {
                const stored = localStorage.getItem(CACHE_KEY);
                if (stored) {
                    const parsed: CachedData = JSON.parse(stored);
                    if (Date.now() - parsed.timestamp < CACHE_DURATION) {
                        return cached;
                    }
                }
            }

            if (!hevyApiKey) return [];

            setIsSyncing(true);
            try {
                const rawData = await fetchAllWorkouts(hevyApiKey);
                const transformed = transformWorkouts(rawData);

                // Save to cache
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    timestamp: Date.now(),
                    workouts: transformed
                }));

                return transformed;
            } catch (e: any) {
                console.error("[useWorkouts] Sync failed:", e);
                throw e;
            } finally {
                setIsSyncing(false);
            }
        },
        enabled: !!hevyApiKey,
        initialData: loadFromCache() || undefined,
        staleTime: Infinity,
    });

    // Log errors if query failed
    useEffect(() => {
        if (isError) {
            console.error("[useWorkouts] Query Error State:", error);
        }
    }, [isError, error]);

    // Manual Sync Function
    const sync = async () => {
        if (!hevyApiKey) {
            toast.error("No API Key configured");
            return;
        }

        setIsSyncing(true);
        const toastId = toast.loading("Syncing with Hevy cloud...");

        try {
            const rawData = await fetchAllWorkouts(hevyApiKey);
            const transformed = transformWorkouts(rawData);

            localStorage.setItem(CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                workouts: transformed
            }));

            // Update React Query cache
            queryClient.setQueryData(["workouts", hevyApiKey], transformed);
            toast.success("Sync complete!", { id: toastId });
        } catch (e: any) {
            console.error("[ManualSync] Failed:", e);
            toast.error(`Sync failed: ${e.message}`, { id: toastId });
        } finally {
            setIsSyncing(false);
        }
    };

    return { data, isLoading: isLoading && !data, isError, isSyncing, sync };
}
