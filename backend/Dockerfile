FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
# su-exec: lets the entrypoint start as root (needed to chown a runtime-mounted volume,
# see docker-entrypoint.sh) and then drop to the unprivileged "spring" user before java
# actually runs - much lighter than installing full sudo/gosu for this one step.
RUN apk add --no-cache su-exec
RUN addgroup -S spring && adduser -S spring -G spring
COPY --from=build /app/target/*.jar app.jar
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Document uploads (app.storage.local-dir) default to /tmp/caagent-uploads. This chown makes
# it writable by the unprivileged "spring" user for local `docker run`/docker-compose use -
# but it is NOT sufficient on every platform: some (Railway included) mount a fresh, root-owned
# tmpfs over /tmp at container start, overriding whatever this image bakes in, and /tmp is
# wiped on every redeploy regardless. In any such environment, set LOCAL_STORAGE_DIR to a real
# persistent, writable mount (e.g. a Railway Volume) via an env var - see backend/.env.example.
# The entrypoint script below also (re-)chowns whatever LOCAL_STORAGE_DIR resolves to at
# container start, which is what actually matters for a volume mounted after this build runs.
RUN mkdir -p /tmp/caagent-uploads && chown -R spring:spring /tmp/caagent-uploads

# Deliberately no `USER spring:spring` here - the container must start as root so the
# entrypoint can chown a runtime-mounted volume before dropping privileges itself.
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
