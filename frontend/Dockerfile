FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile

COPY . .

ENV NEXT_PUBLIC_API_URL=http://localhost:8000
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
