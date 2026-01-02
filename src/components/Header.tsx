"use client";

import { Settings, RefreshCw, HelpCircle, ShieldCheck, Github, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
                <div className="h-4 w-[1px] bg-border" />
                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                        >
                            <HelpCircle className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <span className="text-primary font-bold">HevySpotter</span> Info
                            </DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col gap-6 py-4">
                            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                                <h4 className="flex items-center gap-2 font-bold text-primary mb-2">
                                    <ShieldCheck className="h-4 w-4" />
                                    Privacy First
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Everything happens directly in your browser. Your Hevy data and API keys never leave your device. We don't store anything on our servers.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm text-foreground">
                                    <div className="bg-secondary/10 p-2 rounded-md">
                                        <Github className="h-4 w-4 text-secondary" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold">Open Source</p>
                                        <a
                                            href="https://github.com/klppl/HevySpotter"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-muted-foreground hover:text-primary underline transition-colors"
                                        >
                                            github.com/klppl/HevySpotter
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-foreground">
                                    <div className="bg-orange-500/10 p-2 rounded-md">
                                        <Heart className="h-4 w-4 text-orange-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold">Vibe Coded</p>
                                        <p className="text-xs text-muted-foreground">
                                            Built with passion to help you lift heavier.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </header>
    );
}
