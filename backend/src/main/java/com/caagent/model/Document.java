package com.caagent.model;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "filing_id")
    private Filing filing;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    // Local disk path in dev; swap for an S3/GCS object key in production -
    // see README "Scaling document storage" section.
    @Column(name = "storage_key", nullable = false)
    private String storageKey;

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant uploadedAt = Instant.now();

    // AI-extracted fields (gstin, documentNumber, amount, date, vendorName) - always
    // CA-reviewed and confirmed before being relied on anywhere else in the app.
    @Type(JsonType.class)
    @Column(name = "extracted_data", columnDefinition = "jsonb")
    private Map<String, Object> extractedData;

    @Enumerated(EnumType.STRING)
    @Column(name = "extraction_status", length = 20)
    private ExtractionStatus extractionStatus;

    @Column(name = "extracted_at")
    private Instant extractedAt;

    public enum ExtractionStatus { PENDING, COMPLETED, FAILED }
}
