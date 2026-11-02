
package com.spendwise.controller;

import com.spendwise.dto.DailySpendingResponse;
import com.spendwise.service.ExpenseService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class ExpenseAnalyticsController {

    private final ExpenseService expenseService;

    public ExpenseAnalyticsController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping("/daily-spending")
    public ResponseEntity<?> getDailySpending(
            @RequestParam int year,
            @RequestParam int month,
            HttpSession session) {

        Object value = session.getAttribute("userId");

        if (!(value instanceof Long userId)) {
            return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Please log in first"));
        }

        try {
            LocalDate startDate = LocalDate.of(year, month, 1);
            LocalDate endDate = startDate.plusMonths(1);

            List<DailySpendingResponse> result =
                expenseService.getDailySpending(
                    userId, startDate, endDate
                );

            return ResponseEntity.ok(result);
        } catch (java.time.DateTimeException ex) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "Invalid year or month"));
        }
    }
}
