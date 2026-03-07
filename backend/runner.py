import subprocess, tempfile, os

def run_code(code: str, input_data: str, timeout: int = 5) -> dict:
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(code)
        fname = f.name
    try:
        result = subprocess.run(
            ["python", fname],
            input=input_data,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        return {"output": result.stdout, "error": result.stderr}
    except subprocess.TimeoutExpired:
        return {"output": "", "error": "Превышено время выполнения"}
    finally:
        os.unlink(fname)