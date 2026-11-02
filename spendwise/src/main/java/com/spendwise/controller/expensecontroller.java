
package com.spendwise.controller;

import com.spendwise.dto.ExpenseResponse;
import com.spendwise.entity.Expense;
import com.spendwise.service.ExpenseService;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    /* =========================================
       GET ALL EXPENSES
       ========================================= */

    @GetMapping
    public ResponseEntity<?> getExpenses(HttpSession session) {

        Object value = session.getAttribute("userId");

        if (!(value instanceof Long userId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in first"));
        }

        List<ExpenseResponse> expenses = expenseService
                .getExpensesByUser(userId)
                .stream()
                .map(item -> new ExpenseResponse(
                        item.getExpenseId(),
                        item.getDescription(),
                        item.getAmount(),
                        item.getExpenseDate(),
                        item.getCategory(),
                        item.getPaymentMethod()
                ))
                .toList();

        return ResponseEntity.ok(expenses);
    }

    /* =========================================
       ADD EXPENSE
       ========================================= */

    @PostMapping
    public ResponseEntity<?> createExpense(
            @Valid @RequestBody Expense expense,
            HttpSession session) {

        Object value = session.getAttribute("userId");

        if (!(value instanceof Long userId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in first"));
        }

        Expense savedExpense =
                expenseService.createExpense(expense, userId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "message", "Expense added successfully",
                        "expenseId", savedExpense.getExpenseId()
                ));
    }

    /* =========================================
       UPDATE EXPENSE
       ========================================= */

    @PutMapping("/{expenseId}")
    public ResponseEntity<?> updateExpense(
            @PathVariable Long expenseId,
            @Valid @RequestBody Expense expense,
            HttpSession session) {

        Object value = session.getAttribute("userId");

        if (!(value instanceof Long userId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in first"));
        }

        Expense updatedExpense = expenseService.updateExpense(
                expenseId, expense, userId
        );

        return ResponseEntity.ok(Map.of(
                "message", "Expense updated successfully",
                "expenseId", updatedExpense.getExpenseId()
        ));
    }

    /* =========================================
       DELETE EXPENSE
       ========================================= */

    @DeleteMapping("/{expenseId}")
    public ResponseEntity<?> deleteExpense(
            @PathVariable Long expenseId,
            HttpSession session) {

        Object value = session.getAttribute("userId");

        if (!(value instanceof Long userId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in first"));
        }

        expenseService.deleteExpense(expenseId, userId);

        return ResponseEntity.ok(Map.of(
                "message", "Expense deleted successfully"
        ));
    }
}