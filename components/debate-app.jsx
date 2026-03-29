"use client";

import { useState } from "react";

import { intensityOptions, presetTopics } from "@/lib/constants";

const initialAssistantMessage = {
  id: "intro",
  role: "assistant",
  content:
    "Pick a topic or write your own claim. I will take the opposite side and make the strongest case against you.",
};

function buildTitle(messages) {
  const firstUserMessage = messages.find((message) => message.role === "user");
  if (!firstUserMessage) {
    return "Untitled debate";
  }

  return firstUserMessage.content.slice(0, 80);
}

function ShareButton({ onShare, isSaving, shareUrl }) {
  return (
    <button className="share-button" type="button" onClick={onShare} disabled={isSaving}>
      {shareUrl ? "Copy share link again" : isSaving ? "Saving..." : "Share this debate"}
    </button>
  );
}

function formatScoreValue(value) {
  return value == null ? "N/A" : `${value}/10`;
}

export default function DebateApp() {
  const [messages, setMessages] = useState([initialAssistantMessage]);
  const [draft, setDraft] = useState("");
  const [intensity, setIntensity] = useState("intense");
  const [isDebating, setIsDebating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || isDebating) {
      return;
    }

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      score: null,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft("");
    setError("");
    setShareUrl("");
    setIsDebating(true);

    try {
      const debateResponse = await fetch("/api/debate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intensity,
          messages: nextMessages
            .filter((message) => message.id !== initialAssistantMessage.id)
            .map(({ role, content }) => ({ role, content })),
        }),
      });

      const debatePayload = await debateResponse.json();
      if (!debateResponse.ok) {
        throw new Error(debatePayload.error || "Debate request failed.");
      }

      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: debatePayload.reply,
      };

      const scoredMessages = [...nextMessages, assistantMessage];
      setMessages(scoredMessages);

      void (async () => {
        try {
          const scoreResponse = await fetch("/api/score", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              intensity,
              userMessage: userMessage.content,
              aiReply: assistantMessage.content,
            }),
          });

          const scorePayload = await scoreResponse.json();
          if (!scoreResponse.ok) {
            throw new Error(scorePayload.error || "Scoring request failed.");
          }

          setMessages((currentMessages) =>
            currentMessages.map((message) =>
              message.id === userMessage.id
                ? {
                    ...message,
                    score: scorePayload,
                  }
                : message,
            ),
          );
        } catch (scoreError) {
          setMessages((currentMessages) =>
            currentMessages.map((message) =>
              message.id === userMessage.id
                ? {
                    ...message,
                    score: {
                      logic: null,
                      evidence: null,
                      clarity: null,
                      feedback:
                        scoreError instanceof Error
                          ? scoreError.message
                          : "Scoring was unavailable for this turn.",
                    },
                  }
                : message,
            ),
          );
        }
      })();
    } catch (submitError) {
      setMessages((currentMessages) => currentMessages.filter((message) => message.id !== userMessage.id));
      setError(submitError instanceof Error ? submitError.message : "Something went wrong.");
    } finally {
      setIsDebating(false);
    }
  }

  function handleTopicClick(topic) {
    setDraft(topic.prompt);
  }

  async function handleShare() {
    setError("");

    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/debates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: buildTitle(messages),
          intensity,
          messages,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to save debate.");
      }

      const nextShareUrl = `${window.location.origin}/debate/${payload.id}`;
      setShareUrl(nextShareUrl);
      await navigator.clipboard.writeText(nextShareUrl);
    } catch (shareError) {
      setError(
        shareError instanceof Error
          ? shareError.message
          : "Sharing is not available right now.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Devil&apos;s Advocate V2</p>
          <h1>Debate against an AI that never gives you the easy win.</h1>
          <p className="hero-text">
            Pick a topic, choose how ruthless the pushback should feel, and sharpen your case one exchange at a time.
          </p>
        </div>

        <div className="control-grid">
          <section className="control-card">
            <div className="control-header">
              <h2>Intensity</h2>
              <p>Changes how confrontational the opponent sounds.</p>
            </div>
            <div className="intensity-row">
              {intensityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={option.value === intensity ? "chip chip-active" : "chip"}
                  onClick={() => setIntensity(option.value)}
                >
                  <span>{option.label}</span>
                  <small>{option.description}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="control-card">
            <div className="control-header">
              <h2>Topic picker</h2>
              <p>Use one of these to kick off the first message faster.</p>
            </div>
            <div className="topic-grid">
              {presetTopics.map((topic) => (
                <button
                  key={topic.title}
                  type="button"
                  className="topic-card"
                  onClick={() => handleTopicClick(topic)}
                >
                  <strong>{topic.title}</strong>
                  <span>{topic.prompt}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="chat-panel">
        <div className="chat-toolbar">
          <div>
            <p className="eyebrow">Live Debate</p>
            <h2>Conversation</h2>
          </div>
          <ShareButton onShare={handleShare} isSaving={isSaving} shareUrl={shareUrl} />
        </div>

        <div className="message-list">
          {messages.map((message) => (
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

          {isDebating ? (
            <article className="message assistant-message">
              <span className="message-role">AI</span>
              <p>Building the strongest counterargument...</p>
            </article>
          ) : null}
        </div>

        <form className="composer" onSubmit={handleSubmit}>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={4}
            placeholder="State your claim, opinion, or hot take."
          />
          <div className="composer-footer">
            <p className="composer-hint">
              The AI will oppose your position and then score how well you argued it.
            </p>
            <button className="send-button" type="submit" disabled={isDebating || !draft.trim()}>
              Send argument
            </button>
          </div>
          {error ? <p className="error-text">{error}</p> : null}
          {shareUrl ? <p className="success-text">Copied share link: {shareUrl}</p> : null}
        </form>
      </section>
    </main>
  );
}
