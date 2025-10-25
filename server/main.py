from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from dotenv import load_dotenv
import os
from pydantic import BaseModel
from google import genai
import requests
import uuid
from pathlib import Path

load_dotenv()

client = genai.Client()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================================
# PRESETY GŁOSÓW
# Klucz słownika to string którego używamy jako "preset" w req.preset.
# Każdy preset zawiera voice_id oraz voice_settings.
# =====================================================================

VOICES = {
    "geralt": {
        "voice_id": "0zMIfPaPiC1cQkyeuau6",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.8,
            "style": 0.8,
            "use_speaker_boost": True,
            "speed": 0.85
        },
        # 13% speaker boost z interfejsu zapisane tutaj jako True
    },

    "robert": {
        "voice_id": "fiRQlbVntN1VQEB6liIU",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.8,
            "style": 0.1,
            "use_speaker_boost": True,
            "speed": 1.0
        }
    },

    "joda": {
        "voice_id": "8Gg9X8A0A0WIZ08saHS5",
        "voice_settings": {
            "stability": 0.75,
            "similarity_boost": 0.35,
            "style": 0.8,
            "use_speaker_boost": True,
            "speed": 0.77
        }
    },
}

# katalog na wygenerowane pliki mp3
AUDIO_DIR = Path("generated_audio")
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

ELEVEN_API_KEY = os.getenv("ELEVENLABS_API_KEY")


# =====================================================================
# KOŃCÓWKA /text/
# =====================================================================

class Item(BaseModel):
    #title: str
    persona: str
    absurd_level: int
    personaDescription: str
    textContent: str

@app.post("/text/")
async def create_item(item: Item):
    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=f"Zinterpretuj w stylu {item.persona}. {item.personaDescription}. Skroc mocno wypowiedz. Nie dodawaj komentarzy ani wyjaśnień. Dodaj <br> w odpowiednich miejscach. Tekst: {item.textContent}",
    )
    return {"msg": f"{response.text}"}
    # placeholder = f"{item.persona} (Absurd level: {item.absurd_level}, {item.personaDescription}):"
    # return {"msg": f"{placeholder}"}


# =====================================================================
# KOŃCÓWKA /tts/
# =====================================================================

class TTSRequest(BaseModel):
    text: str
    preset: str        # np. "kapitan-bomba", "robert", "geralt"
    model_id: str | None = "eleven_multilingual_v2"

@app.post("/tts/")
async def tts_generate(req: TTSRequest):
    voice_cfg = VOICES[req.preset]

    tts_url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_cfg['voice_id']}"

    headers = {
        "xi-api-key": ELEVEN_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }

    # ============================================================
    # KRYTYCZNA ZMIANA NR 1: kopiujemy voice_settings i usuwamy "speed"
    # bo ElevenLabs nie przyjmuje "speed" w voice_settings tego endpointu.
    # Jeśli tego nie zrobimy, API nie oddaje audio tylko tekst/echo
    # i wtedy zapisujesz czysty tekst do pliku .mp3.
    vs = dict(voice_cfg["voice_settings"])
    if "speed" in vs:
        del vs["speed"]
    # ============================================================

    body = {
        "text": req.text,
        "model_id": req.model_id,
        "voice_settings": vs,
    }

    # verify=False żeby nie krztusić się na SSL w Twoim środowisku WSL
    r = requests.post(tts_url, json=body, headers=headers, verify=False)

    # ============================================================
    # KRYTYCZNA ZMIANA NR 2: debug do terminala
    # To powie co naprawdę przyszło z ElevenLabs.
    print("DEBUG TTS status:", r.status_code)
    print("DEBUG TTS headers:", r.headers)
    # ============================================================

    audio_bytes = r.content

    file_name = f"{uuid.uuid4().hex}.mp3"
    file_path = AUDIO_DIR / file_name

    with open(file_path, "wb") as f:
        f.write(audio_bytes)

    return {
        "file_name": file_name,
        "download_url": f"/tts/{file_name}",
        "debug_status": r.status_code,
        "debug_content_type": r.headers.get("Content-Type", "no-header"),
        "debug_len": len(audio_bytes),
    }


@app.get("/tts/{file_name}")
async def tts_download(file_name: str):
    file_path = AUDIO_DIR / file_name
    return FileResponse(
        path=file_path,
        media_type="audio/mpeg",
        filename=file_name
    )
