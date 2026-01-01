"use client";

import React from "react";
import { SimplifiedWorkout } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Trophy, Clock, Sunrise, CalendarX, List, BarChart2, TrendingUp } from "lucide-react";

export function ActivityHeatmap({ workouts }: { workouts: SimplifiedWorkout[] }) {
    const [isMounted, setIsMounted] = React.useState(false);

    // Configuration constants
    const COL_WIDTH = 24;
    const LEFT_OFFSET = 32;

    // Process data for the heatmap AND insights
    const { weeks, monthLabels, insights } = React.useMemo(() => {
        const today = new Date();
        const dailyDuration = new Map<string, number>();
        const weekdayCounts = new Array(7).fill(0); // 0=Sun, 1=Mon...

        // 1. Calculate Daily Duration & Weekday Stats
        workouts.forEach(w => {
            const dur = w.durationMinutes || 0;
            dailyDuration.set(w.date, (dailyDuration.get(w.date) || 0) + dur);

            // Stats
            const d = new Date(w.date);
            const dayIdx = d.getDay();
            weekdayCounts[dayIdx]++;
        });

        // Insight Logic
        const totalWorkouts = workouts.length;
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        let insightTitle = "Getting Started";
        let insightDesc = "Log more workouts to unlock insights.";
        let InsightIcon = Trophy; // Default icon

        if (totalWorkouts > 5) {
            // Find Top Day
            let maxDay = 0;
            let maxCount = -1;

            weekdayCounts.forEach((count, idx) => {
                if (count > maxCount) {
                    maxCount = count;
                    maxDay = idx;
                }
            });

            const pct = Math.round((maxCount / totalWorkouts) * 100);

            // "Monday Warrior (90% attendance)" style
            insightTitle = `${days[maxDay]} Warrior`;
            insightDesc = `${pct}% of your sessions happen on ${days[maxDay]}s.`;
            InsightIcon = Trophy;
        }

        // Compute additional insights
        const totalMinutes = workouts.reduce((sum, w) => sum + (w.durationMinutes || 0), 0);
        const avgDuration = totalWorkouts ? Math.round(totalMinutes / totalWorkouts) : 0;

        // Determine least active day
        const minCount = Math.min(...weekdayCounts);
        const leastDayIdx = weekdayCounts.findIndex(c => c === minCount);
        const leastDay = days[leastDayIdx];
        const minPct = totalWorkouts ? Math.round((minCount / totalWorkouts) * 100) : 0;

        // Average workouts per week (based on TOTAL_WEEKS)
        const avgWorkoutsPerWeek = (totalWorkouts / 53).toFixed(1);

        const insights = [
            // Days Group
            { title: insightTitle, desc: insightDesc, Icon: InsightIcon },
            { title: `${leastDay} Sleeper`, desc: `Only ${minPct}% of your sessions happen on ${leastDay}s.`, Icon: CalendarX },

            // Frequency Group
            { title: "Total Workouts", desc: `${totalWorkouts}`, Icon: List },
            { title: "Avg Workouts/Week", desc: `${avgWorkoutsPerWeek}`, Icon: BarChart2 },

            // Duration Group
            { title: "Total Minutes", desc: `${totalMinutes} mins`, Icon: BarChart2 },
            { title: "Avg Workout Time", desc: `${avgDuration} mins`, Icon: Clock },
        ];

        // 2. Setup Grid (Anchor: END at Today)
        const TOTAL_WEEKS = 53;

        const weeksArr = [];
        const months = [] as { label: string; weekIndex: number }[];

        const currentWeekMonday = new Date(today);
        const day = currentWeekMonday.getDay();
        const diff = currentWeekMonday.getDate() - day + (day === 0 ? -6 : 1);
        currentWeekMonday.setDate(diff);

        const startMonday = new Date(currentWeekMonday);
        startMonday.setDate(currentWeekMonday.getDate() - ((TOTAL_WEEKS - 1) * 7));

        let currentDate = new Date(startMonday);

        for (let wIndex = 0; wIndex < TOTAL_WEEKS; wIndex++) {
            const week = [];
            const m = currentDate.toLocaleString('default', { month: 'short' });
            if (months.length === 0 || months[months.length - 1].label !== m) {
                months.push({ label: m, weekIndex: wIndex });
            }

            for (let i = 0; i < 7; i++) {
                const dateStr = currentDate.toISOString().split("T")[0];
                const minutes = dailyDuration.get(dateStr) || 0;

                let level = 0;
                if (minutes > 0) {
                    if (minutes <= 20) level = 1;
                    else if (minutes <= 40) level = 2;
                    else if (minutes <= 70) level = 3;
                    else level = 4;
                }

                week.push({
                    date: dateStr,
                    duration: minutes,
                    level: level,
                    dayIndex: i,
                });
                currentDate.setDate(currentDate.getDate() + 1);
            }
            weeksArr.push(week);
        }


        return {
            weeks: weeksArr,
            monthLabels: months,
            insights,
        };
    }, [workouts]);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const getLevelColor = (level: number) => {
        switch (level) {
            case 0: return "bg-muted/10 hover:bg-muted/20";
            case 1: return "bg-fuchsia-600/40 hover:bg-fuchsia-600/50"; // Deep Berry/Fuchsia (cleaner than muddy rose)
            case 2: return "bg-violet-500/60 hover:bg-violet-500/70";   // Vibrant Violet
            case 3: return "bg-sky-500/80 hover:bg-sky-500/90";         // Bright Blue/Sky
            case 4: return "bg-cyan-400 hover:bg-cyan-300";             // Solid Cyan (No Glow)
            default: return "bg-muted/10 hover:bg-muted/20";
        }
    };

    if (!isMounted) return <div className="h-full w-full animate-pulse bg-muted/10 rounded-lg min-h-[220px]"></div>;

    // insights are provided by the memo hook

    return (
        <TooltipProvider>
            <div className="w-full flex flex-col items-start gap-6">

                {/* 1. Heatmap Container */}
                <div className="w-full overflow-x-auto pb-2 scrollbar-hide select-none flex justify-center">
                    {/* Centering the grid helps it look balanced if huge */}
                    <div className="flex flex-col gap-1 px-2">
                        {/* Month Labels */}
                        <div className="flex text-xs text-muted-foreground mb-2 relative h-4 pl-8">
                            {monthLabels
                                .filter((m, i, arr) => {
                                    if (i === 0 && arr[1] && arr[1].weekIndex - m.weekIndex < 4) return false;
                                    return true;
                                })
                                .map((m) => (
                                    <span
                                        key={`${m.label} - ${m.weekIndex}`}
                                        className="absolute transform -translate-x-1/2 font-medium"
                                        style={{ left: `${LEFT_OFFSET + (m.weekIndex * COL_WIDTH) + COL_WIDTH}px` }}
                                    >
                                        {m.label}
                                    </span>
                                ))}
                        </div>

                        <div className="flex gap-2">
                            {/* Day Labels */}
                            <div className="flex flex-col gap-1 text-[11px] text-muted-foreground pt-[0px] w-8 text-right pr-2 shrink-0">
                                <span className="h-5 flex items-center justify-end">Mon</span>
                                <span className="h-5 flex items-center justify-end">Tue</span>
                                <span className="h-5 flex items-center justify-end">Wed</span>
                                <span className="h-5 flex items-center justify-end">Thu</span>
                                <span className="h-5 flex items-center justify-end">Fri</span>
                                <span className="h-5 flex items-center justify-end">Sat</span>
                                <span className="h-5 flex items-center justify-end">Sun</span>
                            </div>

                            {/* Grid */}
                            <div className="flex gap-1">
                                {weeks.map((week, wIndex) => (
                                    <div key={wIndex} className="flex flex-col gap-1">
                                        {week.map((day) => (
                                            <Tooltip key={day.date} delayDuration={50}>
                                                <TooltipTrigger asChild>
                                                    <div
                                                        className={cn(
                                                            "w-5 h-5 rounded-md transition-all duration-300",
                                                            getLevelColor(day.level)
                                                        )}
                                                    />
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-background border-border text-foreground text-xs p-2">
                                                    <div className="font-semibold mb-1">{day.date}</div>
                                                    <div className="text-muted-foreground">
                                                        {day.duration > 0
                                                            ? `${day.duration} mins`
                                                            : "No workout"}
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground mt-3 px-2">
                            <span>Less</span>
                            <div className="flex gap-1">
                                <div className="w-5 h-5 rounded-md bg-muted/10" />
                                <div className="w-5 h-5 rounded-md bg-fuchsia-600/40" />
                                <div className="w-5 h-5 rounded-md bg-violet-500/60" />
                                <div className="w-5 h-5 rounded-md bg-sky-500/80" />
                                <div className="w-5 h-5 rounded-md bg-cyan-400" />
                            </div>
                            <span>More</span>
                        </div>
                    </div>
                </div>

                {/* 2. Insight Sidebar (Now Bottom Bar) */}
                <div className="w-full flex flex-wrap justify-center gap-4">
                    {insights.map((ins, idx) => (
                        <div key={idx} className="bg-muted/5 border border-primary/10 rounded-lg p-3 flex flex-col items-center text-center gap-1 text-xs w-48">
                            <div className="flex items-center gap-2 mb-1">
                                <ins.Icon className="h-4 w-4 text-primary animate-pulse" />
                                <span className="font-bold uppercase tracking-wider text-muted-foreground">{ins.title}</span>
                            </div>
                            <p className="text-muted-foreground">{ins.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </TooltipProvider>
    );
}
