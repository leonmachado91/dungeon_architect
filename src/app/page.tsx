"use client";

import { Header, Sidebar, Canvas, Toolbar, InspectorPanel } from "@/components/layout";
import { AppProvider } from "@/components/providers";
import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { useMapStore } from "@/stores";

function MainLayout() {
  const selectedSpaceId = useMapStore((state) => state.selectedSpaceId);
  const selectedEntityId = useMapStore((state) => state.selectedEntityId);

  const hasSelection = selectedSpaceId || selectedEntityId;

  return (
    <>
      {/* Mobile Block - Show message on small screens */}
      <div className="md:hidden fixed inset-0 z-50 bg-[var(--bg-hard)] flex flex-col items-center justify-center p-8 text-center">
        <MaterialIcon name="desktop_windows" size="lg" className="text-[var(--yellow)] mb-4" />
        <h1 className="text-xl font-serif text-[var(--fg)] mb-2">
          Tela Desktop Necessária
        </h1>
        <p className="text-[var(--fg-alt)] max-w-sm">
          O Dungeon Architect requer uma tela de desktop ou tablet para a melhor experiência.
          Acesse de um dispositivo maior.
        </p>
      </div>

      {/* Main App - Hidden on mobile */}
      <div className="hidden md:flex h-screen flex-col overflow-hidden">
        <Header />

        {/* Main content area with Canvas as underlay */}
        <div className="flex-1 relative overflow-hidden">
          {/* Canvas - Full size, always in background (Bug #6 fix) */}
          <main
            className="absolute inset-0 z-0"
            role="application"
            aria-label="Canvas do editor de mapas"
          >
            <Canvas />
            <Toolbar />
          </main>

          {/* Inspector Panel - Left overlay when something is selected */}
          {hasSelection && (
            <aside className="absolute left-0 top-0 bottom-0 w-72 z-10 border-r border-[var(--gray)]/20 bg-[var(--bg)] shadow-lg overflow-hidden">
              <InspectorPanel />
            </aside>
          )}

          {/* Sidebar - Right overlay */}
          <aside className="absolute right-0 top-0 bottom-0 z-10">
            <Sidebar />
          </aside>
        </div>
      </div>
    </>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

