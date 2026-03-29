from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.gemini import GeminiError, generate_reply
from app.schemas import ChatRequest, ChatResponse

app = FastAPI(title="Devil's Advocate API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    if request.messages[-1].role != "user":
        raise HTTPException(status_code=400, detail="Last message must come from the user.")

    try:
        reply = await generate_reply(request.messages)
    except GeminiError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return ChatResponse(reply=reply)
