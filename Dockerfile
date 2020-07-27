FROM launcher.gcr.io/google/nodejs AS builder
COPY . /app/
RUN yarn --unsafe-perm --frozen-lockfile install
RUN yarn build

FROM launcher.gcr.io/google/nodejs
ENV NODE_ENV=production
ENV PORT=8000
COPY --from=builder /app /app/
RUN yarn --unsafe-perm --frozen-lockfile install
