import Link from "next/link";

export default function NotFound() {
  return (
    <main className="empty-state-page">
      <div className="empty-state-card">
        <p className="eyebrow">Not Found</p>
        <h1>This debate could not be found.</h1>
        <p>
          If sharing is not configured yet, local debates still work but public links will not.
        </p>
        <Link href="/" className="ghost-link">
          Go back home
        </Link>
      </div>
    </main>
  );
}
