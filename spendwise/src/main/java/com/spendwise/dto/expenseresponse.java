
package com.spendwise.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ExpenseResponse(
    Long expenseId,
    String description,
    BigDecimal amount,
    LocalDate expenseDate,
    String category,
    String paymentMethod
) {
}
