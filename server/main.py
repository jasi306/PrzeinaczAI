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
    placeholder = """   Piasek, ten pozornie niewyczerpany towar, zaczyna nam się kończyć, kurde!
                        A przecież z tego gówna robią drogi, chałupy i te wszystkie graty, co ich używamy na co dzień.
                        Jak będziemy go tak zarzynać, to będą jaja.

                        W miastach i na plażach już teraz dochodzi do zadym, bo się kłócą o to, kto ten piasek wywlecze i gdzie go załaduje.
                        Jak lokalne łóżko rzeki pustoszeje, to trzeba lecieć po piach na drugi koniec świata.
                        A to kosztuje i środowisko dostaje po dupie.

                        Trzeba by zacząć myśleć, kurde, lepiej.
                        Recykling tego, co już zbudowaliśmy, i szukanie jakichś zamienników.
                        Bo jak ten piach naprawdę się skończy, to nasze przyszłe projekty mogą zostać w pizdu."""
    return {"msg": f"{placeholder}"}