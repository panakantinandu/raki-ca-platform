package com.caagent.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class FilingTemplateScheduler {

    private final FilingTemplateService filingTemplateService;

    // Daily at 02:00 server time - well outside business hours, and comfortably before
    // any CA is checking their filing calendar for the day.
    @Scheduled(cron = "0 0 2 * * *")
    public void runDailyTemplateJob() {
        log.info("Running scheduled recurring filing template job.");
        filingTemplateService.generateDueFilings();
    }
}
