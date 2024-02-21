FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY yarn.lock package.json ./
RUN yarn install

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN yarn generate
RUN yarn build

FROM node:18-alpine AS runner
WORKDIR /app


COPY --from=builder /app ./


CMD ["yarn", "start"]
