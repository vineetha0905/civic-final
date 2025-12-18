from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.pipeline import classify_report

app = FastAPI(title="Civic ML Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health():
    return {"status": "ML API running"}

@app.post("/submit")
def submit_report(data: dict):
    return classify_report(data)
