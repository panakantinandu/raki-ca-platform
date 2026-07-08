package com.caagent.controller;

import com.caagent.dto.ClientRequest;
import com.caagent.dto.ShareLinkResponse;
import com.caagent.model.Client;
import com.caagent.security.UserPrincipal;
import com.caagent.service.ClientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;

    @GetMapping
    public Page<Client> list(@AuthenticationPrincipal UserPrincipal principal, Pageable pageable) {
        return clientService.listClients(principal.getUserId(), pageable);
    }

    @GetMapping("/{id}")
    public Client get(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        return clientService.getClient(principal.getUserId(), id);
    }

    @PostMapping
    public ResponseEntity<Client> create(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody ClientRequest req) {
        return ResponseEntity.ok(clientService.createClient(principal.getUserId(), req));
    }

    @PutMapping("/{id}")
    public Client update(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id, @Valid @RequestBody ClientRequest req) {
        return clientService.updateClient(principal.getUserId(), id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        clientService.deleteClient(principal.getUserId(), id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/share-link")
    public ShareLinkResponse setShareLink(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id,
                                           @RequestParam boolean enabled) {
        return clientService.setShareEnabled(principal.getUserId(), id, enabled);
    }
}
