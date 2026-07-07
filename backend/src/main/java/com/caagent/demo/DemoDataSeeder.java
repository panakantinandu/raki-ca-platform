package com.caagent.demo;

import com.caagent.model.*;
import com.caagent.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

/**
 * Populates the database with a realistic-looking demo account so the dashboard isn't
 * empty when showing the product to someone. Only ever runs under the "demo" Spring
 * profile (SPRING_PROFILES_ACTIVE=demo) - never active in "prod" or the default profile,
 * so there's no risk of this touching a real production database. Idempotent: skips
 * entirely if the demo account already exists, so restarting the app doesn't duplicate data.
 */
@Component
@Profile("demo")
@RequiredArgsConstructor
@Slf4j
public class DemoDataSeeder implements ApplicationRunner {

    private static final String DEMO_EMAIL = "demo@vidhi.app";
    private static final String DEMO_PASSWORD = "Demo@1234";

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PlanRepository planRepository;
    private final ClientRepository clientRepository;
    private final FilingRepository filingRepository;
    private final DocumentRepository documentRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.storage.local-dir:/tmp/caagent-uploads}")
    private String localStorageDir;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.existsByEmail(DEMO_EMAIL)) {
            log.info("Demo data already present ({}) - skipping seed.", DEMO_EMAIL);
            return;
        }

        log.info("Seeding demo data for {} / {}", DEMO_EMAIL, DEMO_PASSWORD);

        User demoUser = userRepository.save(User.builder()
                .id(UUID.randomUUID())
                .fullName("Demo Account")
                .email(DEMO_EMAIL)
                .passwordHash(passwordEncoder.encode(DEMO_PASSWORD))
                .authProvider(User.AuthProvider.LOCAL)
                .role(User.Role.FIRM_ADMIN)
                .firmName("Vidhi & Associates")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());

        Plan growthPlan = planRepository.findByCode("GROWTH")
                .orElseThrow(() -> new IllegalStateException("GROWTH plan not seeded - run V2 migration first."));

        subscriptionRepository.save(Subscription.builder()
                .id(UUID.randomUUID())
                .user(demoUser)
                .plan(growthPlan)
                .status(Subscription.Status.ACTIVE)
                .currentPeriodStart(Instant.now().minus(10, ChronoUnit.DAYS))
                .currentPeriodEnd(Instant.now().plus(20, ChronoUnit.DAYS))
                .trialEndsAt(Instant.now().plus(20, ChronoUnit.DAYS))
                .build());

        List<Client> clients = seedClients(demoUser);
        seedFilings(demoUser, clients);
        seedDocuments(demoUser, clients);

        log.info("Demo data seeded: {} clients, filings and sample documents created.", clients.size());
    }

    private record ClientSeed(String name, Client.EntityType type, String gstin, String pan, String email, String phone) {}

    private List<Client> seedClients(User owner) {
        List<ClientSeed> seeds = List.of(
                new ClientSeed("Shree Balaji Traders", Client.EntityType.PROPRIETORSHIP, "27AAAPB1234C1Z5", "AAAPB1234C", "accounts@shreebalaji.in", "9820011223"),
                new ClientSeed("Kunal Mehta", Client.EntityType.INDIVIDUAL, null, "BXYPM5678D", "kunal.mehta@gmail.com", "9812345678"),
                new ClientSeed("Sundaram & Iyer Associates", Client.EntityType.PARTNERSHIP, "33AABFS4321E1Z8", "AABFS4321E", "info@sundaramiyer.co.in", "9840099887"),
                new ClientSeed("Nexgen Fabrics Pvt Ltd", Client.EntityType.COMPANY, "24AACCN9988F1Z2", "AACCN9988F", "finance@nexgenfabrics.com", "9925566778"),
                new ClientSeed("Patel Hardware Store", Client.EntityType.PROPRIETORSHIP, "24AAAPP7654G1Z6", "AAAPP7654G", "patelhardware@yahoo.in", "9898123456"),
                new ClientSeed("Verma Legal & Tax LLP", Client.EntityType.LLP, "07AAAFV3322H1Z1", "AAAFV3322H", "contact@vermalegal.com", "9911223344"),
                new ClientSeed("Ritu Singh", Client.EntityType.INDIVIDUAL, null, "CZXPS2211J", "ritu.singh88@outlook.com", "9873456712"),
                new ClientSeed("Om Sai Enterprises", Client.EntityType.PROPRIETORSHIP, "29AAAPO5566K1Z4", "AAAPO5566K", "omsaienterprises@gmail.com", "9845678901"),
                new ClientSeed("Bharat Textiles Manufacturing Co", Client.EntityType.COMPANY, "36AABCB7788L1Z9", "AABCB7788L", "gst@bharattextiles.in", "9963217890")
        );

        return seeds.stream()
                .map(s -> clientRepository.save(Client.builder()
                        .id(UUID.randomUUID())
                        .owner(owner)
                        .name(s.name())
                        .entityType(s.type())
                        .gstin(s.gstin())
                        .pan(s.pan())
                        .email(s.email())
                        .phone(s.phone())
                        .status(Client.Status.ACTIVE)
                        .build()))
                .toList();
    }

    private record FilingSeed(int clientIndex, Filing.FilingType type, String period, long dueDateOffsetDays, Filing.Status status, boolean filed) {}

    private void seedFilings(User owner, List<Client> clients) {
        List<FilingSeed> seeds = List.of(
                // Overdue - due date already passed, never filed.
                new FilingSeed(0, Filing.FilingType.GSTR3B, "May-2026", -12, Filing.Status.OVERDUE, false),
                new FilingSeed(3, Filing.FilingType.GSTR1, "May-2026", -8, Filing.Status.OVERDUE, false),
                new FilingSeed(6, Filing.FilingType.TDS, "Q4 FY25-26", -3, Filing.Status.OVERDUE, false),
                // Due this week.
                new FilingSeed(1, Filing.FilingType.ITR, "FY2025-26", 2, Filing.Status.PENDING, false),
                new FilingSeed(4, Filing.FilingType.GSTR3B, "Jun-2026", 4, Filing.Status.PENDING, false),
                new FilingSeed(7, Filing.FilingType.GSTR1, "Jun-2026", 6, Filing.Status.PENDING, false),
                // Due later - not urgent, just fills out the pipeline.
                new FilingSeed(2, Filing.FilingType.TDS, "Q1 FY26-27", 18, Filing.Status.PENDING, false),
                new FilingSeed(8, Filing.FilingType.ITR, "FY2025-26", 25, Filing.Status.PENDING, false),
                // Already filed.
                new FilingSeed(5, Filing.FilingType.GSTR3B, "Apr-2026", -35, Filing.Status.FILED, true),
                new FilingSeed(0, Filing.FilingType.GSTR1, "Apr-2026", -35, Filing.Status.FILED, true),
                new FilingSeed(3, Filing.FilingType.TDS, "Q3 FY25-26", -50, Filing.Status.FILED, true)
        );

        for (FilingSeed s : seeds) {
            Filing filing = Filing.builder()
                    .id(UUID.randomUUID())
                    .owner(owner)
                    .client(clients.get(s.clientIndex()))
                    .filingType(s.type())
                    .periodLabel(s.period())
                    .dueDate(LocalDate.now().plusDays(s.dueDateOffsetDays()))
                    .status(s.status())
                    .filedAt(s.filed() ? Instant.now().plus(s.dueDateOffsetDays() + 2, ChronoUnit.DAYS) : null)
                    .build();
            filingRepository.save(filing);
        }
    }

    private void seedDocuments(User owner, List<Client> clients) {
        try {
            Path dir = Path.of(localStorageDir);
            Files.createDirectories(dir);

            seedOneDocument(dir, owner, clients.get(0), "GSTR3B_May2026_ShreeBalaji.pdf");
            seedOneDocument(dir, owner, clients.get(3), "PAN_Card_NexgenFabrics.pdf");
        } catch (IOException e) {
            // Sample documents are purely cosmetic for the demo - never let a storage
            // hiccup (e.g. a restrictive filesystem on the deploy target) roll back the
            // rest of the seeded data, or worse, take down application startup entirely.
            log.warn("Could not write demo sample documents - continuing without them ({}).", e.getMessage());
        }
    }

    private void seedOneDocument(Path dir, User owner, Client client, String displayName) throws IOException {
        byte[] pdfBytes = minimalPdf();
        String storedName = UUID.randomUUID() + "-" + displayName;
        Path target = dir.resolve(storedName);
        Files.write(target, pdfBytes);

        documentRepository.save(Document.builder()
                .id(UUID.randomUUID())
                .owner(owner)
                .client(client)
                .fileName(displayName)
                .contentType("application/pdf")
                .sizeBytes(pdfBytes.length)
                .storageKey(target.toString())
                .build());
    }

    /** A tiny but structurally valid single-page PDF, just enough to open in a viewer. */
    private byte[] minimalPdf() {
        String pdf = "%PDF-1.4\n"
                + "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
                + "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
                + "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\n"
                + "trailer<</Root 1 0 R>>\n"
                + "%%EOF";
        return pdf.getBytes(StandardCharsets.US_ASCII);
    }
}
