package com.caagent.dto;

import jakarta.validation.constraints.Size;

// Fields the CA confirmed (possibly correcting the AI's guess). All optional/nullable -
// an invoice missing a GSTIN, for example, is a legitimate correction, not a validation error.
public record ExtractedDataRequest(
        @Size(max = 20) String gstin,
        @Size(max = 100) String documentNumber,
        @Size(max = 50) String amount,
        @Size(max = 30) String date,
        @Size(max = 200) String vendorName
) {}
