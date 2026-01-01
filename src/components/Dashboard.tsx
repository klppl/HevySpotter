"use client";

import { Activity, TrendingUp, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWorkouts } from "@/hooks/useWorkouts";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { VolumeChart } from "@/components/VolumeChart";
import { AIAnalysisCard } from "@/components/AIAnalysisCard";
import { cn } from "@/lib/utils";

export function Dashboard() {
    const { data: workouts, isLoading, isError, isSyncing, sync } = useWorkouts();

    // If loading but we have NO data (first load, no cache), show spinner.
    // If loading (syncing) but we HAVE data (from cache), show data + syncing indicator.
    const showSpinner = isLoading && (!workouts || workouts.length === 0);

    if (showSpinner) {
        return (
            <main className="container mx-auto p-6 space-y-6">
                <div className="flex items-center justify-center h-[50vh]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </main>
        );
    }

    if (isError && (!workouts || workouts.length === 0)) {
        return (
            <main className="container mx-auto p-6 space-y-6">
                <div className="text-destructive text-center">
                    Failed to load workouts. Please check your API Key in settings.
                </div>
            </main>
        );
    }

    const safeWorkouts = workouts || [];

    return (
        <main className="container mx-auto p-6 space-y-6 animate-in fade-in duration-500">

            <div className="flex flex-col gap-6">

                {/* Card 1: Activity Heatmap */}
                <Card className="shadow-lg shadow-primary/5 hover:shadow-primary/10 transition-all border-primary/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-bold text-primary">Activity (Last 12 Months)</CardTitle>
                        <Activity className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <ActivityHeatmap workouts={safeWorkouts} />
                    </CardContent>
                </Card>

                {/* Card 2: Volume Progression */}
                <Card className="shadow-lg transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-bold text-primary">Volume Trend (Last 12 Months)</CardTitle>
                        <TrendingUp className="h-5 w-5 text-primary" />
                    </CardHeader>
                    {/* 
            Absolute positioning fix for Recharts Warning:
            ResponsiveContainer needs a parent with strict dimensions. 
            CardContent has padding, so we make it relative and use absolute inset for the chart.
          */}
                    <CardContent className="p-6 h-[400px]">
                        <VolumeChart workouts={safeWorkouts} className="h-full w-full" />
                    </CardContent>
                </Card>

                {/* Card 3: Coach's Eye */}
                <div>
                    <AIAnalysisCard workouts={safeWorkouts} />
                </div>
            </div>
        </main>
    );
}
