package com.caagent.service;

import com.caagent.exception.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

/**
 * Thin direct-HTTP wrapper around Anthropic's Messages API - a single endpoint doesn't justify
 * pulling in the full SDK as a dependency, and the raw API is simple enough to call directly
 * with the JDK's built-in HttpClient + the Jackson ObjectMapper already on the classpath.
 *
 * Fails application startup immediately if no API key is configured - same fail-fast pattern
 * as JwtUtil for app.jwt.secret - since document extraction cannot function without one and a
 * missing key should never surface as a mysterious 500 on first use in production.
 */
@Component
@Slf4j
public class AnthropicClient {

    private static final String API_URL = "https://api.anthropic.com/v1/messages";
    private static final String ANTHROPIC_VERSION = "2023-06-01";

    private final String apiKey;
    private final String model;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public AnthropicClient(
            @Value("${app.anthropic.api-key}") String apiKey,
            @Value("${app.anthropic.model}") String model,
            ObjectMapper objectMapper
    ) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                "app.anthropic.api-key is required. Set the ANTHROPIC_API_KEY environment variable - " +
                "AI document extraction cannot function without it.");
        }
        this.apiKey = apiKey;
        this.model = model;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /**
     * Sends one document (as base64) plus a text prompt to Claude and returns the raw text of
     * its reply. Never swallows a failure: throws a clear ApiException on network error, timeout,
     * or a non-200 response, so the caller can surface it instead of silently returning nothing.
     */
    public String extract(byte[] fileBytes, String mediaType, String prompt) {
        String requestBody = buildRequestBody(fileBytes, mediaType, prompt);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_URL))
                .timeout(Duration.ofSeconds(45))
                .header("x-api-key", apiKey)
                .header("anthropic-version", ANTHROPIC_VERSION)
                .header("content-type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (IOException e) {
            log.error("Anthropic API call failed (network error)", e);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "EXTRACTION_UNAVAILABLE",
                    "Could not reach the document extraction service. Please try again shortly.");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.GATEWAY_TIMEOUT, "EXTRACTION_TIMEOUT",
                    "Document extraction timed out. Please try again.");
        }

        if (response.statusCode() != 200) {
            log.error("Anthropic API returned HTTP {}: {}", response.statusCode(), response.body());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "EXTRACTION_FAILED",
                    "The document extraction service returned an error (HTTP " + response.statusCode() + ").");
        }

        return extractTextFromResponse(response.body());
    }

    private String buildRequestBody(byte[] fileBytes, String mediaType, String prompt) {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", model);
        body.put("max_tokens", 1024);

        ArrayNode messages = body.putArray("messages");
        ObjectNode userMessage = messages.addObject();
        userMessage.put("role", "user");

        ArrayNode content = userMessage.putArray("content");

        ObjectNode documentBlock = content.addObject();
        documentBlock.put("type", "application/pdf".equals(mediaType) ? "document" : "image");
        ObjectNode source = documentBlock.putObject("source");
        source.put("type", "base64");
        source.put("media_type", mediaType);
        source.put("data", Base64.getEncoder().encodeToString(fileBytes));

        ObjectNode textBlock = content.addObject();
        textBlock.put("type", "text");
        textBlock.put("text", prompt);

        try {
            return objectMapper.writeValueAsString(body);
        } catch (IOException e) {
            // Only possible if ObjectNode serialization itself is broken - a programming error,
            // not a runtime condition callers should have to handle.
            throw new IllegalStateException("Failed to build Anthropic request body", e);
        }
    }

    private String extractTextFromResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode contentArray = root.path("content");
            if (contentArray.isArray()) {
                for (JsonNode block : contentArray) {
                    if ("text".equals(block.path("type").asText())) {
                        return block.path("text").asText();
                    }
                }
            }
            log.error("Anthropic response had no text content block: {}", responseBody);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "EXTRACTION_FAILED",
                    "The document extraction service returned an unexpected response.");
        } catch (IOException e) {
            log.error("Could not parse Anthropic response as JSON: {}", responseBody);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "EXTRACTION_FAILED",
                    "Could not parse the extraction service's response.");
        }
    }
}
