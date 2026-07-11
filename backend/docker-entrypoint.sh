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

# MaxRAMPercentage only bounds the *heap* - metaspace, thread stacks, direct buffers, and
# JIT-compiled code are separate, uncapped-by-default native memory that heap sizing alone
# doesn't protect against. On a small-memory container (e.g. Railway's lower tiers) that
# combination is a known cause of an OOM kill during startup specifically, when class loading
# and JIT activity briefly peak - the process gets SIGKILLed with zero chance to log anything,
# which looks exactly like a silent crash. Lowering the heap percentage (leaving more headroom
# for that native memory) and explicitly capping metaspace closes that gap.
exec su-exec spring:spring java -XX:+UseContainerSupport -XX:MaxRAMPercentage=50.0 -XX:MaxMetaspaceSize=192m -jar app.jar
