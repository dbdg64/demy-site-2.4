FROM node:22-bookworm-slim

WORKDIR /app

# Install build tools needed for better-sqlite3 native compilation
RUN apt-get update -qq && apt-get install -y -qq python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY prototype/package*.json ./
RUN npm install

COPY prototype/ .

ENV PORT=10000
EXPOSE 10000

CMD ["node", "server.js"]
