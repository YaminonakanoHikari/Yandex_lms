import subprocess
import tempfile
import os
from backend.runner import check_syntax


def run_code_docker(code: str, input_data: str, timeout: int = 5) -> dict:
    # Сначала проверяем AST
    error = check_syntax(code)
    if error:
        return {"output": "", "error": error}

    with tempfile.NamedTemporaryFile(
        mode='w', suffix='.py', delete=False, dir='/tmp', prefix='lms_'
    ) as f:
        f.write(code)
        fname = f.name

    try:
        result = subprocess.run(
            [
                "docker", "run",
                "--rm",                          # удалить контейнер после
                "--network", "none",             # нет интернета
                "--memory", "64m",               # максимум 64MB RAM
                "--memory-swap", "64m",          # без свопа
                "--cpus", "0.5",                 # половина ядра
                "--pids-limit", "32",            # максимум 32 процесса
                "--read-only",                   # файловая система только для чтения
                "--tmpfs", "/tmp:size=10m",      # временная папка 10MB
                "-v", f"{fname}:/code.py:ro",   # монтируем код
                "python:3.11-slim",
                "python", "/code.py"
            ],
            input=input_data,
            capture_output=True,
            text=True,
            timeout=timeout + 2
        )
        return {
            "output": result.stdout.strip(),
            "error": result.stderr.strip() if result.stderr.strip() else None
        }
    except subprocess.TimeoutExpired:
        return {"output": "", "error": "Превышено время выполнения"}
    except FileNotFoundError:
        # Docker не установлен — fallback на обычный runner
        from backend.runner import run_code
        return run_code(code, input_data, timeout)
    except Exception as e:
        return {"output": "", "error": str(e)}
    finally:
        try:
            os.unlink(fname)
        except Exception:
            pass