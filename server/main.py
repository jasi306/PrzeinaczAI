from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from openai import OpenAI

load_dotenv()

client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
)


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

@app.get("/prompt/")
async def get_message(msg: str):
    response = client.responses.create(
        model="gpt-4o-mini",
        instructions="Jesteś zwięzły i precyzyjny.",
        input=f"{msg}",
    )
    print(response)
    return {"msg": f"ChatGPT powiedzial: {response.output_text}"}

@app.get("/")
async def root():
    return {"message": "Hello World"}