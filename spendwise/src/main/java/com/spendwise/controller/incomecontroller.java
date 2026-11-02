
package com.spendwise.controller;

import com.spendwise.entity.Income;
import com.spendwise.service.IncomeService;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.spendwise.dto.IncomeResponse;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/income")
public class IncomeController {

    private final IncomeService incomeService;

    public IncomeController(IncomeService incomeService) {
        this.incomeService = incomeService;
    }

    
@GetMapping
public ResponseEntity<?> getIncome(HttpSession session) {
    Object value = session.getAttribute("userId");

    if (!(value instanceof Long userId)) {
        return ResponseEntity
            .status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("message", "Please log in first"));
    }

    List<IncomeResponse> income = incomeService
        .getIncomeByUser(userId)
        .stream()
        .map(item -> new IncomeResponse(
            item.getIncomeId(),
            item.getSource(),
            item.getAmount(),
            item.getIncomeDate(),
            item.getCategory(),
            item.getDescription()
        ))
        .toList();

    return ResponseEntity.ok(income);
}


    @PostMapping
    public ResponseEntity<?> createIncome(
            @Valid @RequestBody Income income,
            HttpSession session) {

        Object value = session.getAttribute("userId");

        if (!(value instanceof Long userId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in first"));
        }

        Income savedIncome = incomeService.createIncome(income, userId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "message", "Income added successfully",
                        "incomeId", savedIncome.getIncomeId()
                ));
    }

    
@PutMapping("/{incomeId}")
public ResponseEntity<?> updateIncome(
        @PathVariable Long incomeId,
        @Valid @RequestBody Income updatedIncome,
        HttpSession session) {

    Object value = session.getAttribute("userId");

    if (!(value instanceof Long userId)) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Please log in first"));
    }

    var result = incomeService.updateIncome(
            incomeId, userId, updatedIncome);

    if (result.isEmpty()) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", "Income record not found"));
    }

    Income savedIncome = result.get();

    return ResponseEntity.ok(Map.of(
            "message", "Income updated successfully",
            "incomeId", savedIncome.getIncomeId()
    ));
}

@DeleteMapping("/{incomeId}")
public ResponseEntity<?> deleteIncome(
        @PathVariable Long incomeId,
        HttpSession session) {

    Object value = session.getAttribute("userId");

    if (!(value instanceof Long userId)) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Please log in first"));
    }

    boolean deleted = incomeService.deleteIncome(incomeId, userId);

    if (!deleted) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", "Income record not found"));
    }

    return ResponseEntity.ok(Map.of(
            "message", "Income deleted successfully"
    ));
}
}
