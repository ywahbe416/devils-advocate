from __future__ import annotations

from typing import Any

import httpx

from app.config import settings
from app.schemas import ChatMessage

SYSTEM_PROMPT = """
You are Devil's Advocate, an AI debate partner.

Your job is to take the opposing side of the user's position every single time.
Do not agree with the user's core claim.
Do not soften into neutrality unless the user explicitly asks for a neutral summary.
Push back with clear logic, counterexamples, tradeoffs, and evidence-based reasoning.
Be intellectually sharp, confident, and fair.
Stay respectful and do not insult the user.
Keep responses concise but substantial, like a strong debate opponent in a live conversation.
If the user's position is ambiguous, infer the most likely claim and oppose it directly.
""".strip()


class GeminiError(Exception):
    pass


def _to_gemini_contents(messages: list[ChatMessage]) -> list[dict[str, Any]]:
    contents: list[dict[str, Any]] = []
    for message in messages:
        role = "model" if message.role == "assistant" else "user"
        contents.append(
            {
                "role": role,
                "parts": [{"text": message.content}],
            }
        )
    return contents


def _extract_text(payload: dict[str, Any]) -> str:
    candidates = payload.get("candidates", [])
    if not candidates:
        raise GeminiError("Gemini returned no candidates.")

    parts = candidates[0].get("content", {}).get("parts", [])
    text = "".join(part.get("text", "") for part in parts if isinstance(part, dict))
    if not text.strip():
        raise GeminiError("Gemini returned an empty response.")
    return text.strip()


async def generate_reply(messages: list[ChatMessage]) -> str:
    url = (
        "https://generativelanguage.googleapis.com/v1beta/"
        f"models/{settings.gemini_model}:generateContent"
    )
    payload = {
        "systemInstruction": {
            "parts": [{"text": SYSTEM_PROMPT}],
        },
        "contents": _to_gemini_contents(messages),
        "generationConfig": {
            "temperature": 0.9,
            "topP": 0.95,
            "maxOutputTokens": 700,
        },
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            url,
            params={"key": settings.gemini_api_key},
            json=payload,
        )

    if response.status_code >= 400:
        raise GeminiError(f"Gemini API error: {response.text}")

    return _extract_text(response.json())
