import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";
import { Overlay } from "@/components/companion/overlay";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [Scene, setScene] = useState<ComponentType | null>(null);
  useEffect(() => {
    void import("@/components/companion/experience").then((m) => {
      setScene(() => m.Experience);
    });
  }, []);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg">
      {Scene ? <Scene /> : <div className="absolute inset-0 bg-bg" />}
      <Overlay />
    </main>
  );
}
