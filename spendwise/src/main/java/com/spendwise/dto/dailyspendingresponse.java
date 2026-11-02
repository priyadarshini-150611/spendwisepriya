package com.spendwise.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailySpendingResponse(
    LocalDate date,
    BigDecimal total
) {
}
