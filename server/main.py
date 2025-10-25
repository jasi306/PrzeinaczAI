from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from pydantic import BaseModel
from google import genai

load_dotenv()

client = genai.Client()

app = FastAPI()

origins = [
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Item(BaseModel):
    title: str
    persona: str
    absurd_level: int
    personaDescription: str
    textContent: str
    # url: str
    # excerpt: str
    # htmlContent: str

@app.post("/text/")
async def create_item(item: Item):
    # response = client.models.generate_content(
    #     model="gemini-2.5-flash-lite",
    #     contents=f"Przepisz tekst w stylu {item.persona}. Nie dodawaj komentarzy ani wyjaśnień. Zachowaj spójność, i płynność oryginalnego tekstu. Dodaj <br> w odpowiednich miejscach. Tekst: {item.textContent}",
    # )
    # return {"msg": f"{response.text}"}
    placeholder = f"{item.persona} (Absurd level: {item.absurd_level}):"
    return {"msg": f"{placeholder}"}