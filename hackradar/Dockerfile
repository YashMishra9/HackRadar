FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libatk-bridge2.0-0 libx11-xcb1 libxcomposite1 libxdamage1 \
    libxrandr2 libgbm1 libasound2 libpangocairo-1.0-0 libgtk-3-0 \
    fonts-liberation libu2f-udev libvulkan1 wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm install
RUN rm -rf /root/.cache/puppeteer && cd backend && npx puppeteer browsers install chrome
COPY backend ./backend
COPY frontend ./frontend

WORKDIR /app/backend
EXPOSE 4000
CMD ["node", "src/server.js"]