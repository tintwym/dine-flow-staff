import QRCode from "qrcode";
import Link from "next/link";
import { guestOrderUrl } from "@/lib/menu";
import "./qrs.css";

export const metadata = {
  title: "DineFlow · Table QR placards",
  description: "One unique QR code per table",
};

const TABLE_COUNT = 10;

export default async function TableQrsPage() {
  const base =
    process.env.NEXT_PUBLIC_GUEST_ORDER_BASE_URL?.trim() ||
    "https://dine-flow-restaurant.vercel.app";

  const placards = await Promise.all(
    Array.from({ length: TABLE_COUNT }, async (_, i) => {
      const table = i + 1;
      const url = guestOrderUrl(base, table);
      const dataUrl = await QRCode.toDataURL(url, {
        width: 320,
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#1c1917", light: "#ffffff" },
      });
      return { table, url, dataUrl, code: `TBL-${table}` };
    }),
  );

  return (
    <main className="qrs-page">
      <header className="qrs-hero">
        <p className="qrs-eyebrow">Office · print placards</p>
        <h1>Table QR codes</h1>
        <p>
          Print and place one code on each table. Guests scan to open that
          table&apos;s order page on the customer site.
        </p>
        <div className="qrs-actions">
          <Link className="staff-btn" href="/">
            ← Back to office
          </Link>
          <p className="qrs-print-tip">Tip: press ⌘P / Ctrl+P to print placards</p>
        </div>
      </header>

      <div className="qrs-grid">
        {placards.map((p) => (
          <article key={p.table} className="qrs-card">
            <div className="qrs-label">
              <strong>Table {p.table}</strong>
              <span>{p.code}</span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.dataUrl} alt={`Unique QR for table ${p.table}`} />
            <p className="qrs-scan">Scan to order</p>
            <code className="qrs-url">{p.url}</code>
          </article>
        ))}
      </div>
    </main>
  );
}
