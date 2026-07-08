package com.caagent.service;

import com.caagent.dto.BulkFilingCreateRequest;
import com.caagent.dto.FilingRequest;
import com.caagent.exception.ApiException;
import com.caagent.model.Client;
import com.caagent.model.Filing;
import com.caagent.model.User;
import com.caagent.repository.FilingRepository;
import com.caagent.repository.UserRepository;
import com.caagent.util.InputSanitizer;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FilingService {

    private final FilingRepository filingRepository;
    private final UserRepository userRepository;
    private final ClientService clientService;

    public record CalendarEntry(UUID filingId, String clientName, String filingType, String periodLabel,
                                 LocalDate dueDate, String status) {}

    public record BulkCreateResult(UUID clientId, boolean success, String message, Filing filing) {}

    public record BulkMarkFiledResult(UUID filingId, boolean success, String message) {}

    public Page<Filing> listFilings(UUID ownerId, UUID clientId, Pageable pageable) {
        if (clientId != null) {
            return filingRepository.findByOwnerIdAndClientId(ownerId, clientId, pageable);
        }
        return filingRepository.findByOwnerId(ownerId, pageable);
    }

    public List<CalendarEntry> getCalendarFilings(UUID ownerId, int month, int year) {
        if (month < 1 || month > 12) {
            throw ApiException.badRequest("Month must be between 1 and 12.");
        }
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());

        return filingRepository.findByOwnerIdAndDueDateBetween(ownerId, start, end).stream()
                .map(f -> new CalendarEntry(f.getId(), f.getClient().getName(), f.getFilingType().name(),
                        f.getPeriodLabel(), f.getDueDate(), f.getStatus().name()))
                .toList();
    }

    @Transactional
    public Filing createFiling(UUID ownerId, FilingRequest req) {
        Client client = clientService.getClient(ownerId, req.clientId());
        User owner = userRepository.getReferenceById(ownerId);

        Filing filing = Filing.builder()
                .id(UUID.randomUUID())
                .owner(owner)
                .client(client)
                .filingType(Filing.FilingType.valueOf(req.filingType()))
                .periodLabel(InputSanitizer.sanitizePlainText(req.periodLabel()))
                .dueDate(req.dueDate())
                .notes(InputSanitizer.sanitizePlainText(req.notes()))
                .build();

        return filingRepository.save(filing);
    }

    @Transactional
    public Filing markFiled(UUID ownerId, UUID filingId) {
        Filing filing = filingRepository.findByIdAndOwnerId(filingId, ownerId)
                .orElseThrow(() -> ApiException.notFound("Filing not found."));
        filing.setStatus(Filing.Status.FILED);
        filing.setFiledAt(Instant.now());
        return filingRepository.save(filing);
    }

    /**
     * Creates one Filing per client ID. Each client is resolved and saved independently so a
     * client ID that doesn't belong to this owner (wrong account, typo, deleted) is reported as
     * a per-item failure rather than aborting the whole batch - no ApiException escapes this
     * method, so the other clients' filings still commit when the transaction completes.
     */
    @Transactional
    public List<BulkCreateResult> bulkCreateFilings(UUID ownerId, BulkFilingCreateRequest req) {
        User owner = userRepository.getReferenceById(ownerId);
        Filing.FilingType filingType;
        try {
            filingType = Filing.FilingType.valueOf(req.filingType());
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Unknown filing type: " + req.filingType());
        }
        String periodLabel = InputSanitizer.sanitizePlainText(req.periodLabel());
        String notes = InputSanitizer.sanitizePlainText(req.notes());

        List<BulkCreateResult> results = new ArrayList<>();
        for (UUID clientId : req.clientIds()) {
            try {
                Client client = clientService.getClient(ownerId, clientId);
                Filing filing = Filing.builder()
                        .id(UUID.randomUUID())
                        .owner(owner)
                        .client(client)
                        .filingType(filingType)
                        .periodLabel(periodLabel)
                        .dueDate(req.dueDate())
                        .notes(notes)
                        .build();
                filingRepository.save(filing);
                results.add(new BulkCreateResult(clientId, true, null, filing));
            } catch (ApiException e) {
                results.add(new BulkCreateResult(clientId, false, e.getMessage(), null));
            }
        }
        return results;
    }

    /**
     * Marks each filing as filed independently, same not-owned-here-is-a-per-item-failure
     * approach as bulkCreateFilings.
     */
    @Transactional
    public List<BulkMarkFiledResult> bulkMarkFiled(UUID ownerId, List<UUID> filingIds) {
        List<BulkMarkFiledResult> results = new ArrayList<>();
        for (UUID filingId : filingIds) {
            try {
                markFiled(ownerId, filingId);
                results.add(new BulkMarkFiledResult(filingId, true, null));
            } catch (ApiException e) {
                results.add(new BulkMarkFiledResult(filingId, false, e.getMessage()));
            }
        }
        return results;
    }

    @Transactional
    public Filing updateStatus(UUID ownerId, UUID filingId, String status) {
        Filing filing = filingRepository.findByIdAndOwnerId(filingId, ownerId)
                .orElseThrow(() -> ApiException.notFound("Filing not found."));
        filing.setStatus(Filing.Status.valueOf(status));
        if (filing.getStatus() == Filing.Status.FILED) {
            filing.setFiledAt(Instant.now());
        }
        return filingRepository.save(filing);
    }
}
