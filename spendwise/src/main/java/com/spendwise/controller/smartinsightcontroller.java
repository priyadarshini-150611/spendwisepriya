
package com.spendwise.controller;

import com.spendwise.dto.CategorySpendingResponse;
import com.spendwise.dto.SmartInsightResponse;
import com.spendwise.service.ExpenseService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/analytics")
public class SmartInsightController {

    private final ExpenseService expenseService;

    public SmartInsightController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping("/smart-insight")
    public SmartInsightResponse getSmartInsight(HttpSession session) {

        Object value = session.getAttribute("userId");

        if (!(value instanceof Number)) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Please log in first"
            );
        }

        Long userId = ((Number) value).longValue();

        LocalDate today = LocalDate.now();
        LocalDate startDate = today.withDayOfMonth(1);
        LocalDate endDate = startDate.plusMonths(1);

        List<CategorySpendingResponse> categories =
            expenseService.getCategorySpending(
                userId, startDate, endDate
            );

        if (categories.isEmpty()) {
            return new SmartInsightResponse(
                "No spending recorded yet.",
                "Add an expense to start receiving personalized spending insights.",
                "",
                BigDecimal.ZERO
            );
        }

        CategorySpendingResponse highest = categories.get(0);

        return new SmartInsightResponse(
            "Your highest spending category is " + highest.category() + ".",
            "You've spent ₹" + highest.total()
                + " on " + highest.category()
                + " so far this month.",
            highest.category(),
            highest.total()
        );
    }
}
