FROM node:20-alpine

WORKDIR /app

COPY prototype/package*.json ./
RUN npm install

COPY prototype/ .

ENV PORT=10000

EXPOSE 10000

CMD ["node", "server.js"]
