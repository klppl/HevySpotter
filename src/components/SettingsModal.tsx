"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { Lock, Save } from "lucide-react";
import { toast } from "sonner"; // Assuming sonner is installed or we use basic alert? I will use basic alert or need to install sonner. Better to just save silently or show "Saved" state.

export function SettingsModal() {
    const { hevyApiKey, openAiApiKey, setHevyApiKey, setOpenAiApiKey, isSettingsOpen, setSettingsOpen } = useAppStore();
    const [hevyKey, setHevyKey] = useState("");
    const [openaiKey, setOpenaiKey] = useState("");

    useEffect(() => {
        if (isSettingsOpen) {
            setHevyKey(hevyApiKey || "");
            setOpenaiKey(openAiApiKey || "");
        }
    }, [isSettingsOpen, hevyApiKey, openAiApiKey]);

    const handleSave = () => {
        setHevyApiKey(hevyKey);
        setOpenAiApiKey(openaiKey);
        setSettingsOpen(false);
    };

    return (
        <Dialog open={isSettingsOpen} onOpenChange={setSettingsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>API Configuration</DialogTitle>
                    <DialogDescription>
                        Enter your API keys to enable HevySpotter features. Keys are stored locally in your browser.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="hevy" className="text-right">
                            Hevy Key
                        </Label>
                        <Input
                            id="hevy"
                            type="password"
                            value={hevyKey}
                            onChange={(e) => setHevyKey(e.target.value)}
                            className="col-span-3 font-mono"
                            placeholder="hevy_..."
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="openai" className="text-right">
                            OpenAI Key
                        </Label>
                        <Input
                            id="openai"
                            type="password"
                            value={openaiKey}
                            onChange={(e) => setOpenaiKey(e.target.value)}
                            className="col-span-3 font-mono"
                            placeholder="sk-..."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSave} className="w-full sm:w-auto">
                        <Save className="mr-2 h-4 w-4" /> Save Configuration
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
