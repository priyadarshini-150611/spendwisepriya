package com.spendwise.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record IncomeResponse(
    Long incomeId,
    String source,
    BigDecimal amount,
    LocalDate incomeDate,
    String category,
    String description
) {
}
