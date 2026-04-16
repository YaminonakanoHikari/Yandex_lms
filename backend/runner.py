import subprocess
import tempfile
import os
import ast


def check_syntax(code: str) -> str | None:
    """Проверяем AST — нет ли опасных конструкций."""
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return f"Синтаксическая ошибка: {e}"

    BANNED = {
        'import': ['os', 'sys', 'subprocess', 'socket', 'shutil',
                   'pathlib', 'importlib', 'builtins', 'ctypes'],
    }

    for node in ast.walk(tree):
        # Запрещаем опасные импорты
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            names = []
            if isinstance(node, ast.Import):
                names = [alias.name.split('.')[0] for alias in node.names]
            elif isinstance(node, ast.ImportFrom) and node.module:
                names = [node.module.split('.')[0]]
            for name in names:
                if name in BANNED['import']:
                    return f"Запрещённый импорт: {name}"

        # Запрещаем __import__, eval, exec, open
        if isinstance(node, ast.Call):
            func = node.func
            if isinstance(func, ast.Name):
                if func.id in ('eval', 'exec', '__import__', 'open',
                               'compile', 'globals', 'locals', 'vars'):
                    return f"Запрещённая функция: {func.id}"
            if isinstance(func, ast.Attribute):
                if func.attr in ('system', 'popen', 'spawn', 'exec',
                                 'eval', 'remove', 'rmdir', 'unlink'):
                    return f"Запрещённый метод: {func.attr}"

    return None  # всё чисто


def run_code(code: str, input_data: str, timeout: int = 5) -> dict:
    # Проверяем AST до запуска
    error = check_syntax(code)
    if error:
        return {"output": "", "error": error}

    with tempfile.NamedTemporaryFile(
        mode='w', suffix='.py', delete=False, dir='/tmp'
    ) as f:
        f.write(code)
        fname = f.name

    try:
        result = subprocess.run(
            ["python", fname],
            input=input_data,
            capture_output=True,
            text=True,
            timeout=timeout,
            # Ограничиваем ресурсы
            env={
                "PATH": "/usr/bin:/bin",
                "HOME": "/tmp",
            }
        )
        stdout = result.stdout.strip()
        stderr = result.stderr.strip()
        return {"output": stdout, "error": stderr if stderr else None}

    except subprocess.TimeoutExpired:
        return {"output": "", "error": "Превышено время выполнения (5 сек)"}
    except Exception as e:
        return {"output": "", "error": str(e)}
    finally:
        try:
            os.unlink(fname)
        except Exception:
            pass