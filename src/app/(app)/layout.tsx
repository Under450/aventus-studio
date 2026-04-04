import { Sidebar } from "@/components/sidebar";
import { RightPanel } from "@/components/right-panel";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, minHeight: "100vh", background: "var(--studio-bg)" }}>
        {children}
      </main>
      <RightPanel />
    </div>
  );
}
