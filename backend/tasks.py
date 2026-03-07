TASKS = [
    {
        "id": "sum",
        "title": "Сумма чисел",
        "topic": "Циклы",
        "type": "classwork",
        "points": 10,
        "desc": "Прочитай n чисел и выведи их сумму.",
        "input_fmt": "Первая строка — n, далее n чисел каждое на своей строке.",
        "output_fmt": "Одно число — сумма.",
        "examples": [{"input": "3\n1\n2\n3", "output": "6"}],
        "tests": [
            {"input": "3\n1\n2\n3", "expected": "6"},
            {"input": "1\n42", "expected": "42"},
            {"input": "4\n-1\n-2\n-3\n-4", "expected": "-10"},
        ]
    },
    {
        "id": "factorial",
        "title": "Факториал",
        "topic": "Циклы",
        "type": "homework",
        "points": 20,
        "desc": "Вычисли n! (факториал числа n). Напомним: 0! = 1.",
        "input_fmt": "Одно целое неотрицательное число n (0 ≤ n ≤ 20).",
        "output_fmt": "Одно число — n!",
        "examples": [{"input": "5", "output": "120"}, {"input": "0", "output": "1"}],
        "tests": [
            {"input": "0", "expected": "1"},
            {"input": "1", "expected": "1"},
            {"input": "5", "expected": "120"},
            {"input": "10", "expected": "3628800"},
        ]
    },
    {
        "id": "fibonacci",
        "title": "Числа Фибоначчи",
        "topic": "Циклы",
        "type": "homework",
        "points": 20,
        "desc": "Выведи первые n чисел последовательности Фибоначчи: 1, 1, 2, 3, 5, 8...",
        "input_fmt": "Одно натуральное число n.",
        "output_fmt": "n чисел через пробел.",
        "examples": [{"input": "7", "output": "1 1 2 3 5 8 13"}],
        "tests": [
            {"input": "1", "expected": "1"},
            {"input": "2", "expected": "1 1"},
            {"input": "7", "expected": "1 1 2 3 5 8 13"},
            {"input": "10", "expected": "1 1 2 3 5 8 13 21 34 55"},
        ]
    },
    {
        "id": "pascal",
        "title": "Треугольник Паскаля",
        "topic": "Циклы",
        "type": "extra",
        "points": 40,
        "desc": "Выведи первые n рядов треугольника Паскаля. Первый ряд — 1, каждый следующий — попарные суммы соседних элементов плюс единицы по краям.",
        "input_fmt": "Натуральное число n.",
        "output_fmt": "n строк, числа в строке разделены пробелами.",
        "examples": [{"input": "4", "output": "1\n1 1\n1 2 1\n1 3 3 1"}],
        "tests": [
            {"input": "1", "expected": "1"},
            {"input": "4", "expected": "1\n1 1\n1 2 1\n1 3 3 1"},
            {"input": "6", "expected": "1\n1 1\n1 2 1\n1 3 3 1\n1 4 6 4 1\n1 5 10 10 5 1"},
        ]
    },
    {
        "id": "word_count",
        "title": "Подсчёт слов",
        "topic": "Словари",
        "type": "classwork",
        "points": 15,
        "desc": "Подсчитай сколько раз каждое слово встречается в строке. Выведи в алфавитном порядке.",
        "input_fmt": "Одна строка со словами через пробел.",
        "output_fmt": "Строки вида 'слово: N', в алфавитном порядке.",
        "examples": [{"input": "apple banana apple cherry banana apple", "output": "apple: 3\nbanana: 2\ncherry: 1"}],
        "tests": [
            {"input": "apple banana apple cherry banana apple", "expected": "apple: 3\nbanana: 2\ncherry: 1"},
            {"input": "cat cat cat", "expected": "cat: 3"},
            {"input": "a b c a b a", "expected": "a: 3\nb: 2\nc: 1"},
        ]
    },
]