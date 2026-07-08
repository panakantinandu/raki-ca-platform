package com.caagent.filter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.function.Supplier;
import java.util.regex.Pattern;

/**
 * Rate limiting backed by Redis rather than local memory. This is the detail
 * that makes rate limits actually hold once you scale horizontally: if buckets
 * lived in each instance's JVM heap, a client could get 10x the intended quota
 * simply by hitting a load balancer with 10 instances behind it. With Redis,
 * every instance shares the same bucket state.
 *
 * Three tiers:
 *  - Auth endpoints (/api/auth/**): tight limit, deters credential stuffing / brute force.
 *  - Document extraction (POST /api/documents/{id}/extract): its own, tighter limit - each
 *    call costs real money against the Anthropic API, independent of the general API traffic.
 *  - Everything else: looser general-purpose limit per IP.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Pattern EXTRACT_PATH = Pattern.compile("^/api/documents/[^/]+/extract$");

    private final ProxyManager<String> proxyManager;

    private final int authCapacity;
    private final int authRefillTokens;
    private final long authRefillSeconds;

    private final int generalCapacity;
    private final int generalRefillTokens;
    private final long generalRefillSeconds;

    private final int extractionCapacity;
    private final int extractionRefillTokens;
    private final long extractionRefillSeconds;

    public RateLimitFilter(
            ProxyManager<String> proxyManager,
            @Value("${app.rate-limit.auth-endpoints.capacity}") int authCapacity,
            @Value("${app.rate-limit.auth-endpoints.refill-tokens}") int authRefillTokens,
            @Value("${app.rate-limit.auth-endpoints.refill-duration-seconds}") long authRefillSeconds,
            @Value("${app.rate-limit.general-endpoints.capacity}") int generalCapacity,
            @Value("${app.rate-limit.general-endpoints.refill-tokens}") int generalRefillTokens,
            @Value("${app.rate-limit.general-endpoints.refill-duration-seconds}") long generalRefillSeconds,
            @Value("${app.rate-limit-extraction.capacity}") int extractionCapacity,
            @Value("${app.rate-limit-extraction.refill-tokens}") int extractionRefillTokens,
            @Value("${app.rate-limit-extraction.refill-duration-seconds}") long extractionRefillSeconds
    ) {
        this.proxyManager = proxyManager;
        this.authCapacity = authCapacity;
        this.authRefillTokens = authRefillTokens;
        this.authRefillSeconds = authRefillSeconds;
        this.generalCapacity = generalCapacity;
        this.generalRefillTokens = generalRefillTokens;
        this.generalRefillSeconds = generalRefillSeconds;
        this.extractionCapacity = extractionCapacity;
        this.extractionRefillTokens = extractionRefillTokens;
        this.extractionRefillSeconds = extractionRefillSeconds;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getRequestURI();
        String clientIp = resolveClientIp(request);
        boolean isAuthEndpoint = path.startsWith("/api/auth/");
        boolean isExtractionEndpoint = "POST".equalsIgnoreCase(request.getMethod()) && EXTRACT_PATH.matcher(path).matches();

        String bucketKeyPrefix = isAuthEndpoint ? "rl:auth:" : isExtractionEndpoint ? "rl:extract:" : "rl:general:";
        String bucketKey = bucketKeyPrefix + clientIp;

        Supplier<BucketConfiguration> configSupplier = isAuthEndpoint
                ? () -> BucketConfiguration.builder()
                    .addLimit(Bandwidth.classic(authCapacity,
                            io.github.bucket4j.Refill.intervally(authRefillTokens, Duration.ofSeconds(authRefillSeconds))))
                    .build()
                : isExtractionEndpoint
                ? () -> BucketConfiguration.builder()
                    .addLimit(Bandwidth.classic(extractionCapacity,
                            io.github.bucket4j.Refill.intervally(extractionRefillTokens, Duration.ofSeconds(extractionRefillSeconds))))
                    .build()
                : () -> BucketConfiguration.builder()
                    .addLimit(Bandwidth.classic(generalCapacity,
                            io.github.bucket4j.Refill.intervally(generalRefillTokens, Duration.ofSeconds(generalRefillSeconds))))
                    .build();

        Bucket bucket = proxyManager.builder().build(bucketKey, configSupplier);

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(429); // Too Many Requests
            response.setContentType("application/json");
            response.getWriter().write(
                "{\"error\":\"RATE_LIMITED\",\"message\":\"Too many requests. Please slow down and try again shortly.\"}");
        }
    }

    /** Trusts X-Forwarded-For only because forward-headers-strategy=framework is set, i.e. we're behind a trusted LB. */
    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
