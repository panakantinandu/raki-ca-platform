package com.caagent.service;

import com.caagent.model.Filing;
import com.caagent.repository.ClientRepository;
import com.caagent.repository.FilingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ClientRepository clientRepository;
    private final FilingRepository filingRepository;

    public record DashboardStats(
            long totalClients,
            long pendingFilings,
            long overdueFilings,
            long filedThisMonth,
            List<UpcomingDeadline> upcomingDeadlines
    ) {}

    public record UpcomingDeadline(UUID filingId, String clientName, String filingType, String periodLabel, LocalDate dueDate) {}

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

        return new DashboardStats(totalClients, pending, overdue, filed, upcoming);
    }
}
