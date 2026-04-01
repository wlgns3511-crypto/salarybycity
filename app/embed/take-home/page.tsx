import { Metadata } from "next";
import { TakeHomeCalculator } from "@/components/TakeHomeCalculator";

export const metadata: Metadata = {
  title: "Take-Home Pay Calculator - Embeddable Widget",
  robots: "noindex, nofollow",
  openGraph: { url: "/embed/take-home/" },
};

export default function EmbedTakeHomePage() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <TakeHomeCalculator />
      <p style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", marginTop: 12 }}>
        Powered by{" "}
        <a href="https://salarybycity.com" target="_blank" rel="noopener" style={{ color: "#3b82f6", textDecoration: "underline" }}>
          SalaryByCity
        </a>
      </p>
    </div>
  );
}
