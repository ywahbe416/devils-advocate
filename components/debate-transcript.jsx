import Link from "next/link";

function formatScoreValue(value) {
  return value == null ? "N/A" : `${value}/10`;
}

export default function DebateTranscript({ debate }) {
  return (
    <main className="page-shell">
      <section className="chat-panel transcript-panel">
        <div className="chat-toolbar">
          <div>
            <p className="eyebrow">Shared Debate</p>
            <h1>{debate.title || "Untitled debate"}</h1>
            <p className="transcript-meta">Intensity: {debate.intensity}</p>
          </div>
          <Link href="/" className="share-button share-link">
            Start your own debate
          </Link>
        </div>

        <div className="message-list">
          {debate.messages.map((message) => (
            <article
              key={message.id}
              className={message.role === "user" ? "message user-message" : "message assistant-message"}
            >
              <span className="message-role">{message.role === "user" ? "You" : "AI"}</span>
              <p>{message.content}</p>
              {message.role === "user" && message.score ? (
                <div className="score-card">
                  <div className="score-grid">
                    <span>Logic: {formatScoreValue(message.score.logic)}</span>
                    <span>Evidence: {formatScoreValue(message.score.evidence)}</span>
                    <span>Clarity: {formatScoreValue(message.score.clarity)}</span>
                  </div>
                  <p>{message.score.feedback}</p>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
