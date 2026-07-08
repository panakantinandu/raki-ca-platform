package com.caagent.model;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Plan {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(name = "price_inr_monthly", nullable = false)
    private int priceInrMonthly;

    @Column(name = "max_clients")
    private Integer maxClients; // null = unlimited

    @Column(name = "max_seats", nullable = false)
    private int maxSeats;

    @Column(name = "max_extractions_monthly")
    private Integer maxExtractionsMonthly; // null = unlimited

    // Founding-member launch pricing: a limited-slot discounted price, kept alongside the
    // regular price above. Null/0-remaining means founding pricing isn't (or is no longer)
    // available for this plan, and the regular price applies.
    @Column(name = "founding_price_inr_monthly")
    private Integer foundingPriceInrMonthly;

    @Column(name = "founding_slots_total")
    private Integer foundingSlotsTotal;

    @Column(name = "founding_slots_remaining")
    private Integer foundingSlotsRemaining;

    @Column(name = "founding_price_lock_months")
    private Integer foundingPriceLockMonths;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb", nullable = false)
    private List<String> features;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    /** Convenience for API consumers: true when there's still a founding-price slot to claim. */
    public boolean isFoundingActive() {
        return foundingPriceInrMonthly != null && foundingSlotsRemaining != null && foundingSlotsRemaining > 0;
    }
}
