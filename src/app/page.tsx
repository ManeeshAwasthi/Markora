export default function Home() {
  return (
    <main
      style={{
        backgroundColor: "#0a0a0a",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ maxWidth: "900px", width: "100%", padding: "0 24px" }}>
        <h1 style={{ color: "#ffffff", fontSize: "3rem", margin: "0 0 16px 0" }}>
          Markora
        </h1>
        <p style={{ color: "#666666", fontSize: "1.125rem", margin: 0 }}>
          Financial news sentiment analyzer — Phase 1 scaffold complete ✓
        </p>
      </div>
    </main>
  );
}
