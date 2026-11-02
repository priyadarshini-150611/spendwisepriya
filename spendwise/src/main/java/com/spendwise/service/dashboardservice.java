
package com.spendwise.service;

import com.spendwise.repository.ExpenseRepository;
import com.spendwise.repository.IncomeRepository;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;

@Service
public class DashboardService {

    private final IncomeRepository incomeRepository;
    private final ExpenseRepository expenseRepository;

    public DashboardService(
            IncomeRepository incomeRepository,
            ExpenseRepository expenseRepository) {
        this.incomeRepository = incomeRepository;
        this.expenseRepository = expenseRepository;
    }

    public Map<String, BigDecimal> getFinancialSummary(Long userId) {

        BigDecimal totalIncome =
                incomeRepository.sumAmountByUserId(userId);

        BigDecimal totalExpenses =
                expenseRepository.sumAmountByUserId(userId);

        BigDecimal balance = totalIncome.subtract(totalExpenses);

        return Map.of(
                "totalIncome", totalIncome,
                "totalExpenses", totalExpenses,
                "balance", balance
        );
    }
}
