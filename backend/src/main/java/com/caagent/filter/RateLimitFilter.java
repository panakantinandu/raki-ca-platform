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

/**
 * Rate limiting backed by Redis rather than local memory. This is the detail
 * that makes rate limits actually hold once you scale horizontally: if buckets
 * lived in each instance's JVM heap, a client could get 10x the intended quota
 * simply by hitting a load balancer with 10 instances behind it. With Redis,
 * every instance shares the same bucket state.
 *
 * Two tiers:
 *  - Auth endpoints (/api/auth/**): tight limit, deters credential stuffing / brute force.
 *  - Everything else: looser general-purpose limit per IP.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final ProxyManager<String> proxyManager;

    private final int authCapacity;
    private final int authRefillTokens;
    private final long authRefillSeconds;

    private final int generalCapacity;
    private final int generalRefillTokens;
    private final long generalRefillSeconds;

    public RateLimitFilter(
            ProxyManager<String> proxyManager,
            @Value("${app.rate-limit.auth-endpoints.capacity}") int authCapacity,
            @Value("${app.rate-limit.auth-endpoints.refill-tokens}") int authRefillTokens,
            @Value("${app.rate-limit.auth-endpoints.refill-duration-seconds}") long authRefillSeconds,
            @Value("${app.rate-limit.general-endpoints.capacity}") int generalCapacity,
            @Value("${app.rate-limit.general-endpoints.refill-tokens}") int generalRefillTokens,
            @Value("${app.rate-limit.general-endpoints.refill-duration-seconds}") long generalRefillSeconds
    ) {
        this.proxyManager = proxyManager;
        this.authCapacity = authCapacity;
        this.authRefillTokens = authRefillTokens;
        this.authRefillSeconds = authRefillSeconds;
        this.generalCapacity = generalCapacity;
        this.generalRefillTokens = generalRefillTokens;
        this.generalRefillSeconds = generalRefillSeconds;
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

        String bucketKey = (isAuthEndpoint ? "rl:auth:" : "rl:general:") + clientIp;

        Supplier<BucketConfiguration> configSupplier = isAuthEndpoint
                ? () -> BucketConfiguration.builder()
                    .addLimit(Bandwidth.classic(authCapacity,
                            io.github.bucket4j.Refill.intervally(authRefillTokens, Duration.ofSeconds(authRefillSeconds))))
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
