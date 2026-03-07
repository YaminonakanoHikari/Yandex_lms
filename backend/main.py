import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.runner import run_code
from backend.tasks import TASKS
import anthropic

app = FastAPI()

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class Submission(BaseModel):
    task_id: str
    code: str

@app.get("/tasks")
def get_tasks():
    return TASKS

@app.post("/submit")
def submit(sub: Submission):
    task = next((t for t in TASKS if t["id"] == sub.task_id), None)
    if not task:
        return {"error": "Task not found"}

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

    return {
        "results": results,
        "passed": sum(r["ok"] for r in results),
        "total": len(results)
    }

@app.post("/review")
def review(sub: Submission):
    task = next((t for t in TASKS if t["id"] == sub.task_id), None)
    task_title = task["title"] if task else "неизвестная задача"

    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))
    msg = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=500,
        messages=[{
            "role": "user",
            "content": f"Ты преподаватель Python. Задача: '{task_title}'.\nПроверь код ученика и дай краткое ревью по-русски — что хорошо, что можно улучшить. Не давай готовое решение.\n```python\n{sub.code}\n```"
        }]
    )
    return {"review": msg.content[0].text}
