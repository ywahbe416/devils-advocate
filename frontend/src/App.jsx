import { useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const openingMessage = {
  role: "assistant",
  content:
    "State a belief, opinion, or hot take. I’ll take the other side and push back hard.",
};

function App() {
  const [messages, setMessages] = useState([openingMessage]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) {
      return;
    }

    const nextMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages.filter(
            (message, index) => !(index === 0 && message === openingMessage),
          ),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Request failed.");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.reply },
      ]);
    } catch (submitError) {
      setError(submitError.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="chat-card">
        <header className="chat-header">
          <div>
            <p className="eyebrow">Debate App</p>
            <h1>Devil&apos;s Advocate</h1>
          </div>
          <p className="subhead">
            Every message you send becomes the position the AI argues against.
          </p>
        </header>

        <div className="messages">
          {messages.map((message, index) => (
            <article
              key={`${message.role}-${index}`}
              className={`message message-${message.role}`}
            >
              <span className="message-label">
                {message.role === "user" ? "You" : "AI"}
              </span>
              <p>{message.content}</p>
            </article>
          ))}

          {isLoading ? (
            <article className="message message-assistant">
              <span className="message-label">AI</span>
              <p>Thinking of the strongest counterargument...</p>
            </article>
          ) : null}
        </div>

        <form className="composer" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="claim-input">
            Enter your argument
          </label>
          <textarea
            id="claim-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type your claim here..."
            rows={4}
          />
          <div className="composer-footer">
            <p className="helper-text">
              Try: “Remote work is better than office work.”
            </p>
            <button type="submit" disabled={isLoading || !input.trim()}>
              Send
            </button>
          </div>
          {error ? <p className="error-text">{error}</p> : null}
        </form>
      </section>
    </main>
  );
}

export default App;
