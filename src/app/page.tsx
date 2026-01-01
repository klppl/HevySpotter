import { Header } from "@/components/Header";
import { Dashboard } from "@/components/Dashboard";
import { SettingsModal } from "@/components/SettingsModal";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      <Header />
      <Dashboard />
      <SettingsModal />
    </div>
  );
}
