
package com.spendwise.service;

import com.spendwise.dto.BudgetSummaryResponse;
import com.spendwise.entity.Budget;
import com.spendwise.entity.User;
import com.spendwise.repository.BudgetRepository;
import com.spendwise.repository.ExpenseRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final ExpenseRepository expenseRepository;

    public BudgetService(
            BudgetRepository budgetRepository,
            ExpenseRepository expenseRepository) {
        this.budgetRepository = budgetRepository;
        this.expenseRepository = expenseRepository;
    }

    // Get all budgets belonging to a user
    @Transactional(readOnly = true)
    public List<Budget> getBudgetsByUser(Long userId) {
        return budgetRepository.findByUser_UserId(userId);
    }

    // Get budgets for a specific month
    @Transactional(readOnly = true)
    public List<Budget> getBudgetsByMonth(
            Long userId, LocalDate budgetMonth) {

        if (budgetMonth == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Budget month is required");
        }

        LocalDate monthStart = budgetMonth.withDayOfMonth(1);

        return budgetRepository
                .findByUser_UserIdAndBudgetMonth(userId, monthStart);
    }

    // Get one budget belonging to a specific user
    @Transactional(readOnly = true)
    public Optional<Budget> getBudgetById(
            Long budgetId, Long userId) {

        return budgetRepository
                .findByBudgetIdAndUser_UserId(budgetId, userId);
    }

    // Create a budget
    @Transactional
    public Budget createBudget(
            Long userId,
            String category,
            BigDecimal budgetAmount,
            LocalDate budgetMonth,
            String description) {

        validateBudget(category, budgetAmount, budgetMonth);

        String normalizedCategory = category.trim();
        LocalDate monthStart = budgetMonth.withDayOfMonth(1);

        // Prevent duplicate budgets for the same category and month
        if (budgetRepository
                .findByUser_UserIdAndCategoryAndBudgetMonth(
                        userId, normalizedCategory, monthStart)
                .isPresent()) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A budget already exists for this category and month");
        }

        User user = new User();
        user.setUserId(userId);

        Budget budget = new Budget();
        budget.setUser(user);
        budget.setCategory(normalizedCategory);
        budget.setBudgetAmount(budgetAmount);
        budget.setBudgetMonth(monthStart);
        budget.setDescription(normalizeDescription(description));

        return budgetRepository.save(budget);
    }

    // Update an existing budget
    @Transactional
    public Budget updateBudget(
            Long budgetId,
            Long userId,
            String category,
            BigDecimal budgetAmount,
            LocalDate budgetMonth,
            String description) {

        validateBudget(category, budgetAmount, budgetMonth);

        Budget budget = budgetRepository
                .findByBudgetIdAndUser_UserId(budgetId, userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Budget not found"));

        String normalizedCategory = category.trim();
        LocalDate monthStart = budgetMonth.withDayOfMonth(1);

        // Allow the existing budget to retain its own category and month.
        // Reject a duplicate if the category/month combination is changed.
        Optional<Budget> duplicate = budgetRepository
                .findByUser_UserIdAndCategoryAndBudgetMonth(
                        userId, normalizedCategory, monthStart);

        if (duplicate.isPresent()
                && !duplicate.get().getBudgetId().equals(budgetId)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A budget already exists for this category and month");
        }

        budget.setCategory(normalizedCategory);
        budget.setBudgetAmount(budgetAmount);
        budget.setBudgetMonth(monthStart);
        budget.setDescription(normalizeDescription(description));

        return budgetRepository.save(budget);
    }

    // Delete a budget belonging to the logged-in user
    @Transactional
    public void deleteBudget(Long budgetId, Long userId) {

        Budget budget = budgetRepository
                .findByBudgetIdAndUser_UserId(budgetId, userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Budget not found"));

        budgetRepository.delete(budget);
    }

    // Validate budget input
    private void validateBudget(
            String category,
            BigDecimal budgetAmount,
            LocalDate budgetMonth) {

        if (category == null || category.trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Category is required");
        }

        if (budgetAmount == null
                || budgetAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Budget amount must be greater than zero");
        }

        if (budgetMonth == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Budget month is required");
        }
    }

    private String normalizeDescription(String description) {
        if (description == null || description.trim().isEmpty()) {
            return null;
        }

        return description.trim();
    }

    // Get monthly budget totals and actual category spending
    @Transactional(readOnly = true)
    public BudgetSummaryResponse getMonthlyBudgetSummary(
            Long userId, LocalDate budgetMonth) {

        LocalDate monthStart = budgetMonth.withDayOfMonth(1);
        LocalDate nextMonth = monthStart.plusMonths(1);

        List<Budget> budgets =
                budgetRepository.findByUser_UserIdAndBudgetMonth(
                        userId, monthStart);

        List<Object[]> expenseTotals =
                expenseRepository.sumExpensesByCategoryAndDateRange(
                        userId, monthStart, nextMonth);

        Map<String, BigDecimal> spentByCategory = new HashMap<>();

        for (Object[] row : expenseTotals) {
            String category = (String) row[0];
            BigDecimal amount = (BigDecimal) row[1];

            spentByCategory.put(
                    category,
                    amount != null ? amount : BigDecimal.ZERO);
        }

        BigDecimal totalBudget = BigDecimal.ZERO;
        BigDecimal totalSpent = BigDecimal.ZERO;

        List<BudgetSummaryResponse.CategoryBudgetSummary> categories =
                new ArrayList<>();

        for (Budget budget : budgets) {
            BigDecimal budgetAmount = budget.getBudgetAmount();

            BigDecimal spentAmount = spentByCategory.getOrDefault(
                    budget.getCategory(),
                    BigDecimal.ZERO);

            BigDecimal remainingAmount =
                    budgetAmount.subtract(spentAmount);

            BigDecimal percentageUsed =
                    calculatePercentage(spentAmount, budgetAmount);

            totalBudget = totalBudget.add(budgetAmount);
            totalSpent = totalSpent.add(spentAmount);

            categories.add(
                    new BudgetSummaryResponse.CategoryBudgetSummary(
                            budget.getCategory(),
                            budgetAmount,
                            spentAmount,
                            remainingAmount,
                            percentageUsed));
        }

        BigDecimal remainingBudget =
                totalBudget.subtract(totalSpent);

        BigDecimal totalPercentageUsed =
                calculatePercentage(totalSpent, totalBudget);

        return new BudgetSummaryResponse(
                totalBudget,
                totalSpent,
                remainingBudget,
                totalPercentageUsed,
                categories);
    }

    private BigDecimal calculatePercentage(
            BigDecimal spent, BigDecimal budget) {

        if (budget == null
                || budget.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO.setScale(2);
        }

        return spent.multiply(BigDecimal.valueOf(100))
                .divide(budget, 2, RoundingMode.HALF_UP);
    }
}
