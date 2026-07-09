package com.caagent.service;

import com.caagent.dto.FilingTemplateRequest;
import com.caagent.exception.ApiException;
import com.caagent.model.Client;
import com.caagent.model.Filing;
import com.caagent.model.FilingTemplate;
import com.caagent.model.Notification;
import com.caagent.model.User;
import com.caagent.repository.FilingRepository;
import com.caagent.repository.FilingTemplateRepository;
import com.caagent.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FilingTemplateService {

    // Matches the "MMM-yyyy" period label convention used elsewhere for monthly filings
    // (see DemoDataSeeder, e.g. "May-2026").
    private static final DateTimeFormatter PERIOD_FORMAT = DateTimeFormatter.ofPattern("MMM-yyyy", Locale.ENGLISH);

    private final FilingTemplateRepository filingTemplateRepository;
    private final FilingRepository filingRepository;
    private final UserRepository userRepository;
    private final ClientService clientService;
    private final NotificationService notificationService;

    public List<FilingTemplate> listForClient(UUID ownerId, UUID clientId) {
        // Confirms the client belongs to this owner (throws 404 otherwise) before listing.
        clientService.getClient(ownerId, clientId);
        return filingTemplateRepository.findByOwnerIdAndClientId(ownerId, clientId);
    }

    @Transactional
    public FilingTemplate createTemplate(UUID ownerId, FilingTemplateRequest req) {
        Client client = clientService.getClient(ownerId, req.clientId());
        User owner = userRepository.getReferenceById(ownerId);

        FilingTemplate template = FilingTemplate.builder()
                .id(UUID.randomUUID())
                .owner(owner)
                .client(client)
                .filingType(Filing.FilingType.valueOf(req.filingType()))
                .dayOfMonthDue(req.dayOfMonthDue())
                .active(true)
                .build();

        return filingTemplateRepository.save(template);
    }

    @Transactional
    public FilingTemplate deactivate(UUID ownerId, UUID templateId) {
        FilingTemplate template = filingTemplateRepository.findByIdAndOwnerId(templateId, ownerId)
                .orElseThrow(() -> ApiException.notFound("Filing template not found."));
        template.setActive(false);
        return filingTemplateRepository.save(template);
    }

    /**
     * Runs daily (see FilingTemplateScheduler): for every active template, ensures the current
     * period's Filing exists, creating it if not. Safe to call any number of times for the same
     * period - the existence check against (owner, client, filingType, periodLabel) is what makes
     * re-running the job a no-op instead of creating duplicates.
     */
    @Transactional
    public int generateDueFilings() {
        LocalDate today = LocalDate.now();
        int created = 0;

        for (FilingTemplate template : filingTemplateRepository.findAllActive()) {
            int dueDay = Math.min(template.getDayOfMonthDue(), today.lengthOfMonth());
            LocalDate dueDate = today.withDayOfMonth(dueDay);
            String periodLabel = PERIOD_FORMAT.format(today);

            UUID ownerId = template.getOwner().getId();
            UUID clientId = template.getClient().getId();

            boolean exists = filingRepository.existsByOwnerIdAndClientIdAndFilingTypeAndPeriodLabel(
                    ownerId, clientId, template.getFilingType(), periodLabel);
            if (exists) {
                continue;
            }

            Filing filing = Filing.builder()
                    .id(UUID.randomUUID())
                    .owner(template.getOwner())
                    .client(template.getClient())
                    .filingType(template.getFilingType())
                    .periodLabel(periodLabel)
                    .dueDate(dueDate)
                    .build();
            filingRepository.save(filing);
            created++;

            notificationService.create(ownerId, Notification.Type.RECURRING_FILING_CREATED,
                    "A new " + filing.getFilingType() + " filing for " + template.getClient().getName()
                            + " (" + periodLabel + ") was created from your recurring template, due " + dueDate + ".",
                    filing.getId(), "FILING");
        }

        log.info("Recurring filing template job: created {} filing(s) for period.", created);
        return created;
    }
}
