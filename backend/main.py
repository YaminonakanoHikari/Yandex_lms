import os
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth

from backend.runner import run_code
from backend.tasks import TASKS
from backend.database import SessionLocal, User, Progress, init_db
from backend.auth import hash_password, verify_password, create_token, decode_token
import anthropic

load_dotenv()

NGROK_URL = os.environ.get("NGROK_URL", "https://likeable-shauna-interjectionally.ngrok-free.dev")
FRONTEND_URL = f"{NGROK_URL}/frontend"

app = FastAPI()
app.mount("/frontend", StaticFiles(directory="frontend", html=True), name="frontend")
app.add_middleware(SessionMiddleware, secret_key=os.environ.get("SECRET_KEY", "замени-на-случайную-строку"))
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

init_db()
bearer = HTTPBearer()

oauth = OAuth()
oauth.register(
    name='google',
    client_id=os.environ.get('GOOGLE_CLIENT_ID', ''),
    client_secret=os.environ.get('GOOGLE_CLIENT_SECRET', ''),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile',
        'timeout': 30,
    },
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer), db: Session = Depends(get_db)):
    payload = decode_token(creds.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Неверный токен")
    user = db.query(User).filter(User.username == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    return user

class RegisterSchema(BaseModel):
    username: str
    email: str
    password: str

class LoginSchema(BaseModel):
    username: str
    password: str

class Submission(BaseModel):
    task_id: str
    code: str

@app.post("/register")
def register(data: RegisterSchema, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Имя пользователя занято")
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email уже используется")
    user = User(username=data.username, email=data.email, hashed_password=hash_password(data.password))
    db.add(user)
    db.commit()
    return {"token": create_token({"sub": user.username}), "username": user.username}

@app.post("/login")
def login(data: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")
    return {"token": create_token({"sub": user.username}), "username": user.username}

@app.get("/me")
def me(user: User = Depends(get_current_user)):
    return {"username": user.username, "email": user.email}

@app.get("/auth/google")
async def google_login(request: Request):
    redirect_uri = f"{NGROK_URL}/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/auth/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ошибка авторизации Google: {e}")

    userinfo = token.get('userinfo')
    email = userinfo['email']
    name = userinfo.get('name', email.split('@')[0]).replace(' ', '_')

    user = db.query(User).filter(User.email == email).first()
    if not user:
        username = name
        counter = 1
        while db.query(User).filter(User.username == username).first():
            username = f"{name}_{counter}"
            counter += 1
        user = User(username=username, email=email, hashed_password="")
        db.add(user)
        db.commit()

    jwt_token = create_token({"sub": user.username})
    return RedirectResponse(f"{FRONTEND_URL}/index.html?token={jwt_token}&username={user.username}")

@app.get("/tasks")
def get_tasks():
    return TASKS

@app.post("/submit")
def submit(sub: Submission, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = next((t for t in TASKS if t["id"] == sub.task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    results = []
    for test in task["tests"]:
        result = run_code(sub.code, test["input"])
        ok = result["output"].strip() == test["expected"].strip()
        results.append({
            "input": test["input"],
            "expected": test["expected"],
            "actual": result["output"].strip(),
            "ok": ok,
            "error": result.get("error")
        })

    passed = sum(r["ok"] for r in results)
    total = len(results)

    if passed == total:
        prog = db.query(Progress).filter_by(user_id=user.id, task_id=sub.task_id).first()
        if not prog:
            prog = Progress(user_id=user.id, task_id=sub.task_id)
            db.add(prog)
        prog.solved = True
        prog.score = task["points"]
        db.commit()

    return {"results": results, "passed": passed, "total": total}

@app.get("/progress")
def get_progress(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(Progress).filter_by(user_id=user.id).all()
    return {r.task_id: {"solved": r.solved, "score": r.score} for r in rows}

@app.post("/review")
def review(sub: Submission, user: User = Depends(get_current_user)):
    task = next((t for t in TASKS if t["id"] == sub.task_id), None)
    task_title = task["title"] if task else "неизвестная задача"
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))
    msg = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=500,
        messages=[{"role": "user", "content": f"Ты преподаватель Python. Задача: '{task_title}'.\nПроверь код ученика, дай краткое ревью по-русски. Не давай готовое решение.\n```python\n{sub.code}\n```"}]
    )
    return {"review": msg.content[0].text}