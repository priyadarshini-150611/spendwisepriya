
package com.spendwise.controller;

import com.spendwise.dto.SavingsGoalRequest;
import com.spendwise.dto.SavingsGoalResponse;
import com.spendwise.entity.SavingsGoal;
import com.spendwise.service.SavingsGoalService;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/savings-goals")
public class SavingsGoalController {

    private final SavingsGoalService savingsGoalService;

    public SavingsGoalController(
            SavingsGoalService savingsGoalService) {
        this.savingsGoalService = savingsGoalService;
    }

    // Get all savings goals for the logged-in user
    @GetMapping
    public List<SavingsGoalResponse> getSavingsGoals(
            HttpSession session) {

        Long userId = getLoggedInUserId(session);

        return savingsGoalService.getSavingsGoalsByUser(userId)
                .stream()
                .map(SavingsGoalResponse::fromEntity)
                .toList();
    }

    // Get one savings goal
    @GetMapping("/{goalId}")
    public SavingsGoalResponse getSavingsGoal(
            HttpSession session,
            @PathVariable Long goalId) {

        Long userId = getLoggedInUserId(session);

        SavingsGoal goal =
                savingsGoalService.getSavingsGoalById(goalId, userId);

        return SavingsGoalResponse.fromEntity(goal);
    }

    // Create a savings goal
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SavingsGoalResponse createSavingsGoal(
            HttpSession session,
            @RequestBody SavingsGoalRequest request) {

        Long userId = getLoggedInUserId(session);

        SavingsGoal goal = savingsGoalService.createSavingsGoal(
                userId,
                request.name(),
                request.target(),
                request.saved() == null
                        ? java.math.BigDecimal.ZERO
                        : request.saved(),
                request.deadline(),
                request.description());

        return SavingsGoalResponse.fromEntity(goal);
    }

    // Update a savings goal
    @PutMapping("/{goalId}")
    public SavingsGoalResponse updateSavingsGoal(
            HttpSession session,
            @PathVariable Long goalId,
            @RequestBody SavingsGoalRequest request) {

        Long userId = getLoggedInUserId(session);

        SavingsGoal goal = savingsGoalService.updateSavingsGoal(
                goalId,
                userId,
                request.name(),
                request.target(),
                request.saved() == null
                        ? java.math.BigDecimal.ZERO
                        : request.saved(),
                request.deadline(),
                request.description());

        return SavingsGoalResponse.fromEntity(goal);
    }

    // Delete a savings goal
    @DeleteMapping("/{goalId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSavingsGoal(
            HttpSession session,
            @PathVariable Long goalId) {

        Long userId = getLoggedInUserId(session);

        savingsGoalService.deleteSavingsGoal(goalId, userId);
    }

    // Get logged-in user ID from the session
    private Long getLoggedInUserId(HttpSession session) {

        Object sessionUserId = session.getAttribute("userId");

        if (!(sessionUserId instanceof Number)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in first");
        }

        return ((Number) sessionUserId).longValue();
    }
}
