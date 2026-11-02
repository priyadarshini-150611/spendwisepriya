
package com.spendwise.dto;

import java.math.BigDecimal;
import java.util.List;

public record BudgetSummaryResponse(
    BigDecimal totalBudget,
    BigDecimal totalSpent,
    BigDecimal remainingBudget,
    BigDecimal percentageUsed,
    List<CategoryBudgetSummary> categories
) {
    public record CategoryBudgetSummary(
        String category,
        BigDecimal budgetAmount,
        BigDecimal spentAmount,
        BigDecimal remainingAmount,
        BigDecimal percentageUsed
    ) {}
}
