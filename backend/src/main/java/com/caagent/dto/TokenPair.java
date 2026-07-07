package com.caagent.dto;

public record TokenPair(String accessToken, String refreshToken, long expiresInSeconds) {}
