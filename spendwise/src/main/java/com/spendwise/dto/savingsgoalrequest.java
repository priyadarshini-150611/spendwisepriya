
package com.spendwise.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SavingsGoalRequest(
        String name,
        BigDecimal target,
        BigDecimal saved,
        LocalDate deadline,
        String description
) {
}
