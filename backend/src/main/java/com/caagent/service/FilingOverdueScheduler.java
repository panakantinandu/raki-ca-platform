package com.caagent.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Previously there was no job computing the OVERDUE filing status at all - it only ever came
 * from demo seed data or a manual status change. This job closes that gap: any PENDING /
 * IN_PROGRESS filing whose due date has passed gets marked OVERDUE and its owner notified.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class FilingOverdueScheduler {

    private final FilingService filingService;

    // Daily at 03:00 server time - after the 02:00 recurring-filing-template job, so any filing
    // that job creates today is evaluated for overdue status too (it won't be, since new filings
    // are always dated today-or-later, but ordering after it is the more sensible sequence).
    @Scheduled(cron = "0 0 3 * * *")
    public void runDailyOverdueCheck() {
        log.info("Running scheduled overdue-filing check.");
        filingService.markOverdueAndNotify();
    }
}
