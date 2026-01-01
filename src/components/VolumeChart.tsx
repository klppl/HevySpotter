"use client";

import React from "react";
import { SimplifiedWorkout } from "@/lib/api-client";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function VolumeChart({ workouts, className }: { workouts: SimplifiedWorkout[]; className?: string }) {
    // Fix for Recharts dimension warning: ensure client-side rendering
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    // 1. Generate last 12 months keys (YYYY-MM)
    const monthsMap = new Map<string, number>();
    const today = new Date();

    // Safety: use local time construction for keys
    for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        // Format: YYYY-MM
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const key = `${year}-${month}`;
        monthsMap.set(key, 0);
    }

    // 2. Aggregate Volume
    workouts.forEach(workout => {
        const wDate = new Date(workout.date);
        // Format workout date key similarly
        const year = wDate.getFullYear();
        const month = String(wDate.getMonth() + 1).padStart(2, '0');
        const key = `${year}-${month}`;

        if (monthsMap.has(key)) {
            let vol = 0;
            workout.exercises.forEach((ex) => {
                ex.sets.forEach((setStr) => {
                    const parts = setStr.split(" x ");
                    if (parts.length >= 2) {
                        const weight = parseFloat(parts[0].replace("kg", ""));
                        const reps = parseFloat(parts[1].replace(" reps", ""));
                        if (!isNaN(weight) && !isNaN(reps)) {
                            vol += weight * reps;
                        }
                    }
                });
            });
            monthsMap.set(key, (monthsMap.get(key) || 0) + vol);
        }
    });

    // 3. Convert to array
    const data = Array.from(monthsMap.entries()).map(([key, volume]) => {
        // key is "YYYY-MM"
        const [year, month] = key.split("-");
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
        const shortName = dateObj.toLocaleString('default', { month: 'short' }); // "Jan"
        return {
            date: key,
            displayDate: shortName,
            volume: volume
        };
    });

    return (
        <div className={className || "h-[300px] w-full"}>
            {isMounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <LineChart data={data}>
                        <XAxis
                            dataKey="displayDate"
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            interval={0}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }}
                            itemStyle={{ color: "#00f0ff" }}
                            labelStyle={{ color: "#94a3b8" }}
                            formatter={(value: any) => [`${(Number(value) || 0).toLocaleString()} kg`, "Volume"]}
                        />
                        <Line
                            type="monotone"
                            dataKey="volume"
                            stroke="#00f0ff"
                            strokeWidth={3}
                            dot={{ fill: "#00f0ff", r: 4 }}
                            activeDot={{ r: 6, fill: "#fff" }}
                            label={{
                                position: 'top',
                                dy: -10,
                                formatter: (val: any) => val > 0 ? `${(Number(val) / 1000).toFixed(1)}k` : '',
                                fill: '#e2e8f0',
                                fontSize: 11,
                                fontWeight: 500
                            }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-xs">Loading Chart...</div>
            )}
        </div>
    );
}
