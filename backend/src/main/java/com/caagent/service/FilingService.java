package com.caagent.service;

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
