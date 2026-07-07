package com.caagent;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * CA Agent Platform - AI-powered practice management for Chartered Accountants.
 *
 * Design notes for horizontal scaling:
 * - This application is fully stateless. No session state, no in-memory caches
 *   that aren't backed by Redis. Any number of instances can run behind a load
 *   balancer without sticky sessions.
 * - JWT auth means no server-side session store is needed.
 * - Rate limiting buckets live in Redis (shared across instances), not in local memory.
 * - Scale out by increasing replica count (see docker-compose.yml / k8s notes in README).
 */
@SpringBootApplication
@EnableAsync
@EnableScheduling
public class CaAgentApplication {
    public static void main(String[] args) {
        SpringApplication.run(CaAgentApplication.class, args);
    }
}
