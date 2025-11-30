# Этап 1: Сборка (Build)
FROM node:18-alpine as build

WORKDIR /app

# Копируем package.json и ставим зависимости
COPY package.json package-lock.json* ./
RUN npm install

# Копируем исходный код
COPY . .

# Собираем проект (создается папка dist)
RUN npm run build

# Этап 2: Запуск на Nginx (Production)
FROM nginx:alpine

# Копируем собранные файлы из этапа 1 в папку Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Копируем наш конфиг Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]