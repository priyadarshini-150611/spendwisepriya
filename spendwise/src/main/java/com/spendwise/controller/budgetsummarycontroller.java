
package com.spendwise.controller;

import com.spendwise.dto.BudgetResponse;
import com.spendwise.dto.BudgetSummaryResponse;
import com.spendwise.entity.Budget;
import com.spendwise.service.BudgetService;

import jakarta.servlet.http.HttpSession;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/budgets")
public class BudgetSummaryController {

    private final BudgetService budgetService;

    public BudgetSummaryController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    // Get monthly budget summary
    @GetMapping("/summary")
    public BudgetSummaryResponse getBudgetSummary(
            HttpSession session,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate month) {

        Long userId = getLoggedInUserId(session);

        LocalDate selectedMonth = month != null
                ? month.withDayOfMonth(1)
                : LocalDate.now().withDayOfMonth(1);

        return budgetService.getMonthlyBudgetSummary(
                userId, selectedMonth);
    }

    // Get budgets
    @GetMapping
    public List<BudgetResponse> getBudgets(
            HttpSession session,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate month) {

        Long userId = getLoggedInUserId(session);

        List<Budget> budgets = month != null
                ? budgetService.getBudgetsByMonth(userId, month)
                : budgetService.getBudgetsByUser(userId);

        return budgets.stream()
                .map(BudgetResponse::fromEntity)
                .toList();
    }

    // Create a budget
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BudgetResponse createBudget(
            HttpSession session,
            @RequestBody BudgetRequest request) {

        Long userId = getLoggedInUserId(session);

        Budget budget = budgetService.createBudget(
                userId,
                request.category(),
                request.budgetAmount(),
                request.budgetMonth(),
                request.description());

        return BudgetResponse.fromEntity(budget);
    }

    // Update a budget
    @PutMapping("/{budgetId}")
    public BudgetResponse updateBudget(
            HttpSession session,
            @PathVariable Long budgetId,
            @RequestBody BudgetRequest request) {

        Long userId = getLoggedInUserId(session);

        Budget budget = budgetService.updateBudget(
                budgetId,
                userId,
                request.category(),
                request.budgetAmount(),
                request.budgetMonth(),
                request.description());

        return BudgetResponse.fromEntity(budget);
    }

    // Delete a budget
    @DeleteMapping("/{budgetId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBudget(
            HttpSession session,
            @PathVariable Long budgetId) {

        Long userId = getLoggedInUserId(session);

        budgetService.deleteBudget(budgetId, userId);
    }

    // Get logged-in user ID
    private Long getLoggedInUserId(HttpSession session) {

        Object sessionUserId = session.getAttribute("userId");

        if (!(sessionUserId instanceof Number)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in first");
        }

        return ((Number) sessionUserId).longValue();
    }

    // Request data for creating and updating budgets
    public record BudgetRequest(
            String category,
            BigDecimal budgetAmount,
            LocalDate budgetMonth,
            String description) {
    }
}