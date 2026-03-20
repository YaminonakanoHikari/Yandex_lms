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
    {
        "id": "re_umbrella",
        "title": "★ Корпорация Амбрелла",
        "topic": "Словари",
        "type": "extra",
        "points": 40,
        "desc": "Корпорация Амбрелла проводит эксперименты над зомби. У каждого зомби есть уровень заражения от 1 до 10. Нужно подсчитать сколько зомби каждого уровня находится в секторе, и вывести только те уровни где зомби больше одного — от самого опасного уровня к наименее опасному.\n\nЕсли зомби одного уровня всего один — S.T.A.R.S. уже справились, не выводи его.",
        "input_fmt": "Первая строка — число n (количество зомби). Следующие n строк — целое число от 1 до 10 (уровень заражения каждого зомби).",
        "output_fmt": "Строки вида 'Уровень X: N зомби', отсортированные по убыванию уровня. Выводить только уровни где N > 1.",
        "examples": [
            {
                "input": "7\n3\n10\n3\n5\n10\n3\n5",
                "output": "Уровень 10: 2 зомби\nУровень 5: 2 зомби\nУровень 3: 3 зомби"
            }
        ],
        "tests": [
            {
                "input": "7\n3\n10\n3\n5\n10\n3\n5",
                "expected": "Уровень 10: 2 зомби\nУровень 5: 2 зомби\nУровень 3: 3 зомби"
            },
            {
                "input": "5\n1\n2\n3\n4\n5",
                "expected": ""
            },
            {
                "input": "6\n7\n7\n7\n2\n2\n1",
                "expected": "Уровень 7: 3 зомби\nУровень 2: 2 зомби"
            },
            {
                "input": "4\n10\n10\n10\n10",
                "expected": "Уровень 10: 4 зомби"
            },
        ]
    },
    {
        "id": "re_virus",
        "title": "★ Вирус T",
        "topic": "Списки",
        "type": "extra",
        "points": 40,
        "desc": "Вирус T распространяется по городу. Город представлен в виде строки из символов: '.' — чистая зона, 'Z' — заражённая зона. Каждый час каждая чистая зона рядом с заражённой тоже заражается (только соседи слева и справа). Выведи состояние города через k часов.",
        "input_fmt": "Первая строка — строка из символов '.' и 'Z'. Вторая строка — число k (количество часов).",
        "output_fmt": "Строка состояния города через k часов.",
        "examples": [
            {"input": "...Z...\n2", "output": ".ZZZZZ."},
            {"input": "Z....Z\n1", "output": "ZZ..ZZ"},
        ],
        "tests": [
            {"input": "...Z...\n2", "expected": ".ZZZZZ."},
            {"input": "Z....Z\n1", "expected": "ZZ..ZZ"},
            {"input": "......\n3", "expected": "......"},
            {"input": "ZZZZZ\n5", "expected": "ZZZZZ"},
            {"input": ".Z.\n1", "expected": "ZZZ"},
        ]
    },
    {
        "id": "re_stars",
        "title": "★ Отчёт S.T.A.R.S.",
        "topic": "Строки",
        "type": "extra",
        "points": 35,
        "desc": "Крис Редфилд пишет отчёт о миссии. В отчёте встречаются имена агентов — они всегда написаны заглавными буквами и состоят только из латинских букв. Найди все уникальные имена агентов в тексте и выведи их в алфавитном порядке.\n\nСлово считается именем если оно состоит только из заглавных латинских букв и его длина не менее 2 символов.",
        "input_fmt": "Несколько строк текста (вводится до конца файла через sys.stdin).",
        "output_fmt": "Уникальные имена в алфавитном порядке, каждое на новой строке.",
        "examples": [
            {
                "input": "CHRIS and JILL went to the mansion. CHRIS saw a zombie near JILL.",
                "output": "CHRIS\nJILL"
            }
        ],
        "tests": [
            {
                "input": "CHRIS and JILL went to the mansion. CHRIS saw a zombie near JILL.",
                "expected": "CHRIS\nJILL"
            },
            {
                "input": "LEON saved ASHLEY from the castle. LEON is a hero.",
                "expected": "ASHLEY\nLEON"
            },
            {
                "input": "no names here at all",
                "expected": ""
            },
            {
                "input": "ALBERT WESKER is the villain. CHRIS fights WESKER.",
                "expected": "ALBERT\nCHRIS\nWESKER"
            },
        ]
    },
]