"use client";

import { Settings, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { useWorkouts } from "@/hooks/useWorkouts";

export function Header() {
    const setSettingsOpen = useAppStore((state) => state.setSettingsOpen);
    const { sync, isSyncing } = useWorkouts();

    return (
        <header className="flex h-16 w-full items-center justify-between border-b border-border bg-background/50 px-6 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tighter text-foreground">
                    HEVY<span className="text-primary">SPOTTER</span>
                </h1>
            </div>
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    onClick={() => sync()}
                    disabled={isSyncing}
                    className="text-xs font-bold tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                    <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
                    {isSyncing ? "SYNCING..." : "SYNC HEVY"}
                </Button>
                <div className="h-4 w-[1px] bg-border" />
                <Button
                    variant="ghost"
                    onClick={() => setSettingsOpen(true)}
                    className="text-xs font-bold tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                    <Settings className="h-3 w-3" />
                    SETTINGS
                </Button>
            </div>
        </header>
    );
}
