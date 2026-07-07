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

# Document uploads (app.storage.local-dir) default to /tmp/caagent-uploads. The container
# runs as the unprivileged "spring" user below, and /tmp's default ownership/permissions
# aren't guaranteed writable by it on every platform - explicitly create and own the
# directory here (as root, before USER switches) so it's writable regardless.
RUN mkdir -p /tmp/caagent-uploads && chown -R spring:spring /tmp/caagent-uploads

USER spring:spring
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
