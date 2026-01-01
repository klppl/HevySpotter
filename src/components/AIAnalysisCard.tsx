"use client";

import { useState, useEffect } from "react";
import { Brain, CheckCircle2, AlertTriangle, Lightbulb, Loader2, ArrowRight, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { analyzeWorkouts, SimplifiedWorkout, AnalysisResponse, getTopExerciseTemplates, generateAIWorkout, getRoutineFolders, createRoutineFolder, createRoutine } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AIAnalysisCard({ workouts }: { workouts: SimplifiedWorkout[] }) {
    const openAiApiKey = useAppStore((state) => state.openAiApiKey);
    const trainingPhilosophy = useAppStore((state) => state.trainingPhilosophy);
    const setTrainingPhilosophy = useAppStore((state) => state.setTrainingPhilosophy);

    const [isMounted, setIsMounted] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratorLoading, setIsGeneratorLoading] = useState(false);
    const [sessionCount, setSessionCount] = useState(5);
    const [tempPhilosophy, setTempPhilosophy] = useState("");

    useEffect(() => {
        setIsMounted(true);
        setTempPhilosophy(trainingPhilosophy || "");

        const cached = localStorage.getItem("hevy_ai_analysis");
        if (cached) {
            try {
                setAnalysis(JSON.parse(cached));
            } catch (e) {
                console.error("Failed to parse cached analysis", e);
            }
        }
    }, [trainingPhilosophy]);

    const handleAnalyze = async () => {
        if (!openAiApiKey) {
            toast.error("OpenAI API Key missing. Please check Settings.");
            return;
        }
        if (workouts.length === 0) {
            toast.error("No workouts to analyze.");
            return;
        }

        setTrainingPhilosophy(tempPhilosophy);

        setIsLoading(true);
        try {
            const targetWorkouts = workouts.slice(0, sessionCount);

            const result = await analyzeWorkouts(openAiApiKey, targetWorkouts, tempPhilosophy);
            setAnalysis(result);
            localStorage.setItem("hevy_ai_analysis", JSON.stringify(result));
            toast.success("Analysis complete.");
        } catch (error: any) {
            toast.error("Analysis failed: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearAnalysis = () => {
        setAnalysis(null);
        localStorage.removeItem("hevy_ai_analysis");
        toast.info("Analysis summary deleted.");
    };

    return (
        <Card className="shadow-lg shadow-secondary/5 hover:shadow-secondary/10 transition-all border-secondary/20 bg-gradient-to-b from-card to-background flex flex-col w-full h-full min-h-[400px]">
            {/* ... header ... */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 shrink-0 border-b-0">
                <CardTitle className="text-lg font-bold text-secondary tracking-wide flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI COACH
                </CardTitle>
                {analysis && (
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleClearAnalysis}
                        className="h-7 text-xs px-2"
                    >
                        Delete Summary
                    </Button>
                )}
            </CardHeader>
            <CardContent className="flex-1 p-6">
                {analysis ? (
                    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                        {/* Header Summary */}
                        <div className="p-4 rounded-lg bg-secondary/5 border-l-4 border-secondary">
                            <h3 className="text-lg font-semibold text-foreground mb-1">Summary</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {analysis.summary}
                            </p>
                            <div className="mt-2 text-xs text-secondary/70 font-mono">
                                Scope: Analyzed {sessionCount} most recent sessions.
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-3">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wider">
                                    <TrendingUpIcon className="h-4 w-4" /> Progressions
                                </h4>
                                {analysis.trends.map((item, i) => (
                                    <div key={i} className="p-3 rounded-md bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors">
                                        <p className="text-sm text-foreground flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                            {item}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col gap-3">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-destructive uppercase tracking-wider">
                                    <AlertTriangle className="h-4 w-4" /> Attention Needed
                                </h4>
                                {analysis.neglect.map((item, i) => (
                                    <div key={i} className="p-3 rounded-md bg-destructive/5 border border-destructive/20 hover:bg-destructive/10 transition-colors">
                                        <p className="text-sm text-foreground flex items-start gap-2">
                                            <ArrowRight className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                                            {item}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col gap-3">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-secondary uppercase tracking-wider">
                                    <Lightbulb className="h-4 w-4" /> Recommendations
                                </h4>
                                {analysis.recommendations.map((item, i) => (
                                    <div key={i} className="p-3 rounded-md bg-secondary/5 border border-secondary/20 hover:bg-secondary/10 transition-colors">
                                        <p className="text-sm text-foreground flex items-start gap-2">
                                            <ArrowRight className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                                            {item}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Reset Button - Moved to Header */}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-2 gap-6 min-h-[300px]">

                        {/* Training Philosophy Input */}
                        <div className="w-full space-y-2 text-left">
                            <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                                Training Philosophy / Context <span className="opacity-50 font-normal normal-case">(Optional)</span>
                            </label>
                            <textarea
                                className="w-full h-32 bg-secondary/5 border border-secondary/20 rounded-md p-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-secondary resize-none placeholder:text-muted-foreground/30"
                                placeholder="Paste your specific goal, protocol, or focus area here (e.g., 'Kelei Protocol', 'Upper Body Focus'). The AI will analyze your workouts against this standard."
                                value={tempPhilosophy}
                                onChange={(e) => setTempPhilosophy(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setTrainingPhilosophy(tempPhilosophy);
                                        toast.success("Training context saved.");
                                    }}
                                    className="text-xs h-7 border-secondary/20 hover:bg-secondary/10 hover:text-secondary"
                                >
                                    Save Context
                                </Button>
                            </div>
                        </div>

                        <div className="text-center space-y-2">
                            {isMounted && workouts.length === 0 && (
                                <p className="text-destructive text-sm font-semibold max-w-sm mx-auto">
                                    No workout data detected. Sync some workouts to get started.
                                </p>
                            )}

                            {/* Session Count Selector */}
                            <div className="flex flex-col items-center gap-2 mt-4">
                                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                    Analyze Previous Sessions
                                </label>
                                <div className="flex items-center gap-2 bg-background/50 border border-secondary/20 rounded-lg p-1">
                                    {[3, 5, 10, 20].map((count) => (
                                        <button
                                            key={count}
                                            onClick={() => setSessionCount(count)}
                                            className={cn(
                                                "px-3 py-1.5 text-sm font-mono rounded-md transition-all",
                                                sessionCount === count
                                                    ? "bg-secondary text-secondary-foreground shadow-sm font-bold"
                                                    : "text-muted-foreground hover:text-secondary hover:bg-secondary/10"
                                            )}
                                        >
                                            {count}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Button
                            size="lg"
                            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold px-8 shadow-[0_0_20px_rgba(132,204,22,0.3)] transition-all hover:scale-105"
                            onClick={handleAnalyze}
                            disabled={!isMounted || isLoading || workouts.length === 0}
                        >
                            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Brain className="mr-2 h-5 w-5" />}
                            {isLoading ? "ANALYZING NEURAL PATTERNS..." : `ANALYZE LAST ${sessionCount} SESSIONS`}
                        </Button>
                    </div>
                )}

                {analysis && (
                    <div className="mt-8 border-t border-secondary/10 pt-6">
                        <Button
                            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold shadow-lg transform hover:scale-[1.02] transition-all"
                            onClick={async () => {
                                if (!openAiApiKey) return;
                                const hevyKey = useAppStore.getState().hevyApiKey;
                                if (!hevyKey) {
                                    toast.error("Hevy API Key missing");
                                    return;
                                }

                                setIsGeneratorLoading(true);
                                try {
                                    toast.info("Fetching exercises (300+)...");
                                    const templates = await getTopExerciseTemplates(hevyKey);

                                    toast.info("Designing workout...");
                                    const workoutPlan = await generateAIWorkout(openAiApiKey, analysis, templates, tempPhilosophy);

                                    // Validate generated exercises
                                    const validTemplateIds = new Set(templates.map((t: any) => t.id));
                                    const validExercises = workoutPlan.exercises.filter((ex: any) => {
                                        if (validTemplateIds.has(ex.exercise_template_id)) return true;
                                        console.warn(`[AI Coach] Skipping invalid exercise ID: ${ex.exercise_template_id}`);
                                        return false;
                                    });

                                    if (validExercises.length === 0) {
                                        throw new Error("No valid exercises found in generated workout.");
                                    }

                                    toast.info("Saving to Hevy...");

                                    const folders = await getRoutineFolders(hevyKey);
                                    let aiFolder = folders.routine_folders.find((f: any) => f.title === "AI");
                                    if (!aiFolder) {
                                        const newFolderRes = await createRoutineFolder(hevyKey, "AI");
                                        aiFolder = newFolderRes.routine_folder;
                                    }

                                    const routinePayload = {
                                        title: workoutPlan.title,
                                        folder_id: aiFolder.id,
                                        exercises: validExercises.map((ex: any) => {
                                            let sets = ex.sets.map((s: any) => ({
                                                type: s.type || "normal",
                                                weight_kg: s.weight_kg ? parseFloat(String(s.weight_kg)) : undefined,
                                                reps: s.reps ? parseInt(String(s.reps)) : undefined,
                                            }));

                                            // Enforce minimum 3 sets
                                            if (sets.length > 0 && sets.length < 3) {
                                                const lastSet = sets[sets.length - 1];
                                                while (sets.length < 3) {
                                                    sets.push({ ...lastSet });
                                                }
                                            } else if (sets.length === 0) {
                                                // Fallback if AI generates 0 sets
                                                sets = [
                                                    { type: "normal", reps: 10 },
                                                    { type: "normal", reps: 10 },
                                                    { type: "normal", reps: 10 }
                                                ];
                                            }

                                            return {
                                                exercise_template_id: ex.exercise_template_id,
                                                sets: sets
                                            };
                                        })
                                    };

                                    await createRoutine(hevyKey, routinePayload);
                                    toast.success(`Created routine: "${workoutPlan.title}" in 'AI' folder!`);

                                } catch (e: any) {
                                    console.error(e);
                                    toast.error("Failed to generate workout: " + e.message);
                                } finally {
                                    setIsGeneratorLoading(false);
                                }
                            }}
                            disabled={isGeneratorLoading}
                        >
                            {isGeneratorLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    CREATING ROUTINE...
                                </>
                            ) : (
                                <>
                                    <Dumbbell className="mr-2 h-5 w-5" />
                                    GENERATE WORKOUT FROM ANALYSIS
                                </>
                            )}
                        </Button>
                        <p className="text-center text-xs text-muted-foreground mt-2">
                            Creates a new routine in an "AI" folder in Hevy.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function TrendingUpIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
        </svg>
    );
}

function Dumbbell({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m6.5 6.5 11 11" />
            <path d="m21 21-1-1" />
            <path d="m3 3 1 1" />
            <path d="m18 22 4-4" />
            <path d="m2 6 4-4" />
            <path d="m3 10 7-7" />
            <path d="m14 21 7-7" />
        </svg>
    )
}
