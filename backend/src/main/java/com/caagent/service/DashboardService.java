package com.caagent.service;

import com.caagent.model.Filing;
import com.caagent.repository.ClientRepository;
import com.caagent.repository.FilingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ClientRepository clientRepository;
    private final FilingRepository filingRepository;

    // Flat illustrative estimate of the late fee avoided per on-time filing. Real GST/ITR/TDS
    // late fees are NOT flat: they vary by filing type, turnover, and days delayed (e.g. GST
    // late fees accrue per day under CGST + SGST, capped differently by turnover slab; ITR/TDS
    // penalties follow entirely different sections of the Income Tax Act). This constant exists
    // only to give the CA a rough, motivating sense of scale on the dashboard - it is never
    // presented as an exact or guaranteed figure (see the "estimated" label in the UI).
    @Value("${app.fees-avoided.per-filing-estimate-inr:200}")
    private int perFilingEstimateInr;

    public record DashboardStats(
            long totalClients,
            long pendingFilings,
            long overdueFilings,
            long filedThisMonth,
            List<UpcomingDeadline> upcomingDeadlines,
            FeesAvoidedEstimate feesAvoidedEstimate
    ) {}

    public record UpcomingDeadline(UUID filingId, String clientName, String filingType, String periodLabel, LocalDate dueDate) {}

    /**
     * onTimeFilingCount x perFilingEstimateInr = estimatedInr. Deliberately not called "savings"
     * or "amount saved" anywhere - it's an illustrative estimate, not a guaranteed number.
     */
    public record FeesAvoidedEstimate(long onTimeFilingCount, int perFilingEstimateInr, long estimatedInr) {}

    public DashboardStats getStats(UUID ownerId) {
        long totalClients = clientRepository.countByOwnerId(ownerId);
        long pending = filingRepository.countByOwnerIdAndStatus(ownerId, Filing.Status.PENDING);
        long overdue = filingRepository.countByOwnerIdAndStatus(ownerId, Filing.Status.OVERDUE);
        long filed = filingRepository.countByOwnerIdAndStatus(ownerId, Filing.Status.FILED);

        LocalDate today = LocalDate.now();
        List<UpcomingDeadline> upcoming = filingRepository
                .findByOwnerIdAndDueDateBetween(ownerId, today, today.plusDays(14))
                .stream()
                .map(f -> new UpcomingDeadline(f.getId(), f.getClient().getName(), f.getFilingType().name(), f.getPeriodLabel(), f.getDueDate()))
                .toList();

        return new DashboardStats(totalClients, pending, overdue, filed, upcoming, computeFeesAvoidedEstimate(ownerId, today));
    }

    private FeesAvoidedEstimate computeFeesAvoidedEstimate(UUID ownerId, LocalDate today) {
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate monthEnd = today.withDayOfMonth(today.lengthOfMonth());

        long onTimeCount = filingRepository
                .findByOwnerIdAndStatusAndDueDateBetween(ownerId, Filing.Status.FILED, monthStart, monthEnd)
                .stream()
                // "Before their due date": filed on or before the calendar day it was due.
                .filter(f -> f.getFiledAt() != null
                        && !f.getFiledAt().atZone(ZoneId.systemDefault()).toLocalDate().isAfter(f.getDueDate()))
                .count();

        return new FeesAvoidedEstimate(onTimeCount, perFilingEstimateInr, onTimeCount * (long) perFilingEstimateInr);
    }
}
