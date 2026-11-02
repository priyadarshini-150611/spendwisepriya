
package com.spendwise.dto;

import com.spendwise.entity.Budget;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BudgetResponse(
        Long budgetId,
        String category,
        BigDecimal budgetAmount,
        LocalDate budgetMonth,
        String description) {

    public static BudgetResponse fromEntity(Budget budget) {
        return new BudgetResponse(
                budget.getBudgetId(),
                budget.getCategory(),
                budget.getBudgetAmount(),
                budget.getBudgetMonth(),
                budget.getDescription());
    }
}
