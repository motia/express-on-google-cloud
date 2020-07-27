FROM launcher.gcr.io/google/nodejs AS builder
COPY . /app/
RUN yarn --unsafe-perm --frozen-lockfile --non-interactive install --production=false
RUN yarn build

FROM launcher.gcr.io/google/nodejs
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
COPY --from=builder /app /app/
COPY --from=builder /app/build /app/build
RUN yarn --unsafe-perm --frozen-lockfile install --non-interactive --production=true
