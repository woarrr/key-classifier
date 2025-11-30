# Используем легкий Python 3.10
FROM python:3.10-slim

# Рабочая папка внутри контейнера
WORKDIR /app

# Копируем список зависимостей
COPY requirements.txt .

# Устанавливаем библиотеки
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь код бэкенда (main.py, preprocessing.py, модель и json)
COPY . .

# Открываем порт 8000
EXPOSE 8000

# Команда запуска
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]