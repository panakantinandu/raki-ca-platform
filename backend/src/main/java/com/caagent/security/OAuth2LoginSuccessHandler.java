package com.caagent.security;

import com.caagent.model.User;
import com.caagent.repository.UserRepository;
import com.caagent.service.AuthService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

/**
 * On successful Google login, find-or-create the local user record, then
 * redirect back to the frontend with a one-time-use short-lived token in the
 * URL fragment (never a query param, so it isn't logged by proxies), which the
 * frontend immediately exchanges for a real access/refresh token pair.
 */
@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final AuthService authService;
    private final String frontendBaseUrl;

    public OAuth2LoginSuccessHandler(
            UserRepository userRepository,
            AuthService authService,
            @Value("${app.frontend.base-url}") String frontendBaseUrl
    ) {
        this.userRepository = userRepository;
        this.authService = authService;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                         Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String googleSub = oAuth2User.getAttribute("sub");

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User created = User.builder()
                    .id(UUID.randomUUID())
                    .fullName(name != null ? name : email)
                    .email(email)
                    .authProvider(User.AuthProvider.GOOGLE)
                    .providerId(googleSub)
                    .emailVerified(true)
                    .role(User.Role.FIRM_ADMIN)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
            return userRepository.save(created);
        });

        var tokenPair = authService.issueTokensForUser(user, request);

        String redirectUrl = frontendBaseUrl + "/oauth/callback"
                + "#access_token=" + URLEncoder.encode(tokenPair.accessToken(), StandardCharsets.UTF_8)
                + "&refresh_token=" + URLEncoder.encode(tokenPair.refreshToken(), StandardCharsets.UTF_8);

        response.sendRedirect(redirectUrl);
    }
}
