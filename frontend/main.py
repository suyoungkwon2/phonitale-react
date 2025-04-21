from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import os
from pydantic import BaseModel
import datetime

app = FastAPI()

# Get the directory where main.py is located
frontend_dir = os.path.dirname(os.path.abspath(__file__))
static_dir = os.path.join(frontend_dir, "static")
templates_dir = os.path.join(frontend_dir, "templates")

# Create static and templates directories if they don't exist
os.makedirs(static_dir, exist_ok=True)
os.makedirs(templates_dir, exist_ok=True)

# Mount static files directory
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Setup templates directory
templates = Jinja2Templates(directory=templates_dir)

# Define a Pydantic model for the request body
class ConsentData(BaseModel):
    name: str
    phone: str
    email: str

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    # Render the index.html template
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/consent", response_class=HTMLResponse)
async def get_consent_page(request: Request):
    return templates.TemplateResponse("consent.html", {"request": request})

@app.post("/api/consent")
async def submit_consent(consent_data: ConsentData):
    # Here you would typically call your Lambda function via API Gateway
    # to save the data to DynamoDB and record the timestamp.
    # For now, we'll just print the received data and a conceptual timestamp.
    timestamp = datetime.datetime.now().isoformat()
    print(f"Received consent data at {timestamp}:")
    print(f"  Name: {consent_data.name}")
    print(f"  Phone: {consent_data.phone}")
    print(f"  Email: {consent_data.email}")
    
    # Simulate a successful submission
    # In a real scenario, check the response from the Lambda call
    return JSONResponse(content={"message": "Consent submitted successfully"}, status_code=200)

@app.get("/instruction", response_class=HTMLResponse)
async def get_instruction_page(request: Request):
    return templates.TemplateResponse("instruction.html", {"request": request})

# Round specific routes using path parameters
@app.get("/round/{round_number}/start", response_class=HTMLResponse)
async def get_round_start_page(request: Request, round_number: int):
    return templates.TemplateResponse("round_start.html", {"request": request, "round_number": round_number})

@app.get("/round/{round_number}/learning/start", response_class=HTMLResponse)
async def get_learning_start_page(request: Request, round_number: int):
    return templates.TemplateResponse("learning_start.html", {"request": request, "round_number": round_number})

@app.get("/round/{round_number}/learning", response_class=HTMLResponse)
async def get_learning_page(request: Request, round_number: int):
    return templates.TemplateResponse("learning.html", {"request": request, "round_number": round_number})

@app.get("/round/{round_number}/recognition/start", response_class=HTMLResponse)
async def get_recognition_start_page(request: Request, round_number: int):
    return templates.TemplateResponse("recognition_start.html", {"request": request, "round_number": round_number})

@app.get("/round/{round_number}/recognition", response_class=HTMLResponse)
async def get_recognition_page(request: Request, round_number: int):
    return templates.TemplateResponse("recognition.html", {"request": request, "round_number": round_number})

@app.get("/round/{round_number}/generation/start", response_class=HTMLResponse)
async def get_generation_start_page(request: Request, round_number: int):
    return templates.TemplateResponse("generation_start.html", {"request": request, "round_number": round_number})

@app.get("/round/{round_number}/generation", response_class=HTMLResponse)
async def get_generation_page(request: Request, round_number: int):
    return templates.TemplateResponse("generation.html", {"request": request, "round_number": round_number})

# Survey and End routes
@app.get("/survey/start", response_class=HTMLResponse)
async def get_survey_start_page(request: Request):
    return templates.TemplateResponse("survey_start.html", {"request": request})

@app.get("/survey", response_class=HTMLResponse)
async def get_survey_page(request: Request):
    return templates.TemplateResponse("survey.html", {"request": request})

@app.get("/end", response_class=HTMLResponse)
async def get_end_page(request: Request):
    return templates.TemplateResponse("end.html", {"request": request})

# Example route using templates (requires templates/item.html)
# @app.get("/items/{id}", response_class=HTMLResponse)

# --- To run the server ---
# Make sure you are in the 'frontend' directory in your terminal
# Then run: uvicorn main:app --reload