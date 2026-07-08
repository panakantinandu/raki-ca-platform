package com.caagent.dto;

import java.time.LocalDate;
import java.util.List;

// Deliberately minimal: only what a client needs to see their own filing status.
// No notes, no documents, no GSTIN/PAN/contact info, no other clients.
public record PublicClientStatusResponse(String clientName, List<FilingStatus> filings) {
    public record FilingStatus(String filingType, String periodLabel, String status, LocalDate dueDate) {}
}
