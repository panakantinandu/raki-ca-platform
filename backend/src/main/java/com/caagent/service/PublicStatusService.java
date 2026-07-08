package com.caagent.service;

import com.caagent.dto.PublicClientStatusResponse;
import com.caagent.exception.ApiException;
import com.caagent.model.Client;
import com.caagent.repository.ClientRepository;
import com.caagent.repository.FilingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PublicStatusService {

    private final ClientRepository clientRepository;
    private final FilingRepository filingRepository;

    /**
     * A token that's invalid, belongs to a disabled share link, or never existed at all
     * takes this exact same path to the exact same generic error - there is no way for a
     * caller to distinguish "this link was turned off" from "this link never existed".
     */
    public PublicClientStatusResponse getStatus(String token) {
        Client client = clientRepository.findByShareTokenAndShareEnabledTrue(token)
                .orElseThrow(() -> ApiException.notFound("Not found."));

        var filings = filingRepository.findByClientIdOrderByDueDateDesc(client.getId()).stream()
                .map(f -> new PublicClientStatusResponse.FilingStatus(
                        f.getFilingType().name(), f.getPeriodLabel(), f.getStatus().name(), f.getDueDate()))
                .toList();

        return new PublicClientStatusResponse(client.getName(), filings);
    }
}
