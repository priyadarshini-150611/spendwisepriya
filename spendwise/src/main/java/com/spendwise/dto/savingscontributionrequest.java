
package com.spendwise.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SavingsContributionRequest(
        BigDecimal amount,
        LocalDate contributionDate,
        String note
) {
}
