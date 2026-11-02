
package com.spendwise.service;

import com.spendwise.entity.SavingsGoal;
import com.spendwise.entity.User;
import com.spendwise.repository.SavingsGoalRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class SavingsGoalService {

    private final SavingsGoalRepository savingsGoalRepository;

    public SavingsGoalService(
            SavingsGoalRepository savingsGoalRepository) {
        this.savingsGoalRepository = savingsGoalRepository;
    }

    // Get all savings goals belonging to a user
    @Transactional(readOnly = true)
    public List<SavingsGoal> getSavingsGoalsByUser(Long userId) {
        return savingsGoalRepository.findByUser_UserId(userId);
    }

    // Get one goal, verifying ownership
    @Transactional(readOnly = true)
    public SavingsGoal getSavingsGoalById(
            Long goalId, Long userId) {

        return savingsGoalRepository
                .findByGoalIdAndUser_UserId(goalId, userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Savings goal not found"));
    }

    // Create a new savings goal
    @Transactional
    public SavingsGoal createSavingsGoal(
            Long userId,
            String name,
            BigDecimal target,
            BigDecimal saved,
            LocalDate deadline,
            String description) {

        validateGoal(name, target, saved);

        SavingsGoal goal = new SavingsGoal();

        User user = new User();
        user.setUserId(userId);

        goal.setUser(user);
        goal.setGoalName(name.trim());
        goal.setTargetAmount(target);
        goal.setCurrentAmount(saved);
        goal.setTargetDate(deadline);
        goal.setDescription(description);

        return savingsGoalRepository.save(goal);
    }

    // Update an existing goal
    @Transactional
    public SavingsGoal updateSavingsGoal(
            Long goalId,
            Long userId,
            String name,
            BigDecimal target,
            BigDecimal saved,
            LocalDate deadline,
            String description) {

        validateGoal(name, target, saved);

        SavingsGoal goal = getSavingsGoalById(goalId, userId);

        goal.setGoalName(name.trim());
        goal.setTargetAmount(target);
        goal.setCurrentAmount(saved);
        goal.setTargetDate(deadline);
        goal.setDescription(description);

        return savingsGoalRepository.save(goal);
    }

    // Delete a goal belonging to the logged-in user
    @Transactional
    public void deleteSavingsGoal(Long goalId, Long userId) {

        SavingsGoal goal = getSavingsGoalById(goalId, userId);

        savingsGoalRepository.delete(goal);
    }

    // Validate goal data
    private void validateGoal(
            String name,
            BigDecimal target,
            BigDecimal saved) {

        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Goal name is required");
        }

        if (name.trim().length() > 150) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Goal name cannot exceed 150 characters");
        }

        if (target == null
                || target.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Target amount must be greater than zero");
        }

        if (saved == null) {
            saved = BigDecimal.ZERO;
        }

        if (saved.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Saved amount cannot be negative");
        }

        if (saved.compareTo(target) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Saved amount cannot exceed the target amount");
        }
    }
}
