package com.caagent.service;

import com.caagent.dto.ClientRequest;
import com.caagent.dto.ShareLinkResponse;
import com.caagent.exception.ApiException;
import com.caagent.model.Client;
import com.caagent.model.Subscription;
import com.caagent.model.User;
import com.caagent.repository.ClientRepository;
import com.caagent.repository.UserRepository;
import com.caagent.util.InputSanitizer;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClientService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    private final SubscriptionService subscriptionService;

    public Page<Client> listClients(UUID ownerId, Pageable pageable) {
        return clientRepository.findByOwnerId(ownerId, pageable);
    }

    public Client getClient(UUID ownerId, UUID clientId) {
        return clientRepository.findByIdAndOwnerId(clientId, ownerId)
                .orElseThrow(() -> ApiException.notFound("Client not found."));
    }

    @Transactional
    public Client createClient(UUID ownerId, ClientRequest req) {
        // Enforce the plan's client cap server-side - never trust a client-side limit alone.
        Subscription subscription = subscriptionService.getCurrentSubscription(ownerId);
        Integer maxClients = subscription.getPlan().getMaxClients();
        if (maxClients != null) {
            long currentCount = clientRepository.countByOwnerId(ownerId);
            if (currentCount >= maxClients) {
                throw ApiException.forbidden(
                    "Your current plan allows up to " + maxClients + " clients. Upgrade your plan to add more.");
            }
        }

        User owner = userRepository.getReferenceById(ownerId);

        Client client = Client.builder()
                .id(UUID.randomUUID())
                .owner(owner)
                .name(InputSanitizer.sanitizePlainText(req.name()))
                .entityType(Client.EntityType.valueOf(req.entityType()))
                .gstin(req.gstin())
                .pan(req.pan())
                .email(req.email())
                .phone(req.phone())
                .notes(InputSanitizer.sanitizePlainText(req.notes()))
                .build();

        return clientRepository.save(client);
    }

    @Transactional
    public Client updateClient(UUID ownerId, UUID clientId, ClientRequest req) {
        Client client = getClient(ownerId, clientId);
        client.setName(InputSanitizer.sanitizePlainText(req.name()));
        client.setEntityType(Client.EntityType.valueOf(req.entityType()));
        client.setGstin(req.gstin());
        client.setPan(req.pan());
        client.setEmail(req.email());
        client.setPhone(req.phone());
        client.setNotes(InputSanitizer.sanitizePlainText(req.notes()));
        return clientRepository.save(client);
    }

    @Transactional
    public void deleteClient(UUID ownerId, UUID clientId) {
        Client client = getClient(ownerId, clientId);
        clientRepository.delete(client);
    }

    @Transactional
    public ShareLinkResponse setShareEnabled(UUID ownerId, UUID clientId, boolean enabled) {
        Client client = getClient(ownerId, clientId);
        if (enabled && client.getShareToken() == null) {
            client.setShareToken(generateShareToken());
        }
        client.setShareEnabled(enabled);
        clientRepository.save(client);
        return new ShareLinkResponse(client.isShareEnabled(), client.getShareToken());
    }

    /** 256 bits of randomness, URL-safe - long and unguessable, and never the client's own UUID. */
    private String generateShareToken() {
        String token;
        do {
            byte[] bytes = new byte[32];
            SECURE_RANDOM.nextBytes(bytes);
            token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        } while (clientRepository.existsByShareToken(token));
        return token;
    }
}
