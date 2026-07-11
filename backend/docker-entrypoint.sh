#!/bin/sh
set -e

# LOCAL_STORAGE_DIR may point at a volume mounted at container *start* (e.g. a Railway
# Volume) - its ownership is decided by the platform when it's attached, not by anything
# this image's Dockerfile did at build time, and Railway mounts volumes owned by root by
# default. This container starts as root specifically to fix that: create the storage dir
# and chown it to the unprivileged "spring" user the app actually runs as, then drop
# privileges via su-exec before starting java. `exec` replaces this shell with su-exec (and
# su-exec in turn execs java) so signals like SIGTERM still reach the JVM directly for a
# clean shutdown - it never runs as a child of a lingering shell process.
STORAGE_DIR="${LOCAL_STORAGE_DIR:-/tmp/caagent-uploads}"
mkdir -p "$STORAGE_DIR"
chown -R spring:spring "$STORAGE_DIR"

exec su-exec spring:spring java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -jar app.jar
