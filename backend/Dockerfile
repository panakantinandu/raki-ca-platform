FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring
COPY --from=build /app/target/*.jar app.jar

# Document uploads (app.storage.local-dir) default to /tmp/caagent-uploads. This chown makes
# it writable by the unprivileged "spring" user for local `docker run`/docker-compose use -
# but it is NOT sufficient on every platform: some (Railway included) mount a fresh, root-owned
# tmpfs over /tmp at container start, overriding whatever this image bakes in, and /tmp is
# wiped on every redeploy regardless. In any such environment, set LOCAL_STORAGE_DIR to a real
# persistent, writable mount (e.g. a Railway Volume) via an env var - see backend/.env.example.
RUN mkdir -p /tmp/caagent-uploads && chown -R spring:spring /tmp/caagent-uploads

USER spring:spring
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
