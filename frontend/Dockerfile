FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Vite bakes import.meta.env.VITE_* values into the static bundle at BUILD time, not
# runtime - so this has to be a build ARG (Railway automatically forwards a Dockerfile
# service's configured variables as build args) rather than something set later via
# the container's environment.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist

# -s enables SPA fallback (every unknown path serves index.html, required for React
# Router's client-side routes like /app/clients/:id) - listens on Railway's injected
# PORT, falling back to 4173 for local `docker run` without one set.
CMD ["sh", "-c", "serve -s dist -l ${PORT:-4173}"]
