FROM launcher.gcr.io/google/nodejs AS builder
COPY . /app/
RUN yarn --unsafe-perm --frozen-lockfile --non-interactive install --production=false
RUN yarn build

FROM launcher.gcr.io/google/nodejs
ENV NODE_ENV=production
ENV PORT=8000
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/build build
RUN yarn --unsafe-perm --frozen-lockfile install --non-interactive --production=true
