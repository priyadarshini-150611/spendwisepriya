
package com.spendwise.service;

import com.spendwise.entity.SavingsContribution;
import com.spendwise.entity.SavingsGoal;
import com.spendwise.repository.SavingsContributionRepository;
import com.spendwise.repository.SavingsGoalRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class SavingsContributionService {

    private final SavingsContributionRepository contributionRepository;
    private final SavingsGoalRepository savingsGoalRepository;

    public SavingsContributionService(
            SavingsContributionRepository contributionRepository,
            SavingsGoalRepository savingsGoalRepository) {
        this.contributionRepository = contributionRepository;
        this.savingsGoalRepository = savingsGoalRepository;
    }

    // Get contributions for a goal
    @Transactional(readOnly = true)
    public List<SavingsContribution> getContributionsByGoal(
            Long goalId, Long userId) {

        // Verify that this goal belongs to the logged-in user.
        savingsGoalRepository
                .findByGoalIdAndUser_UserId(goalId, userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Savings goal not found"));

        return contributionRepository
                .findBySavingsGoal_GoalIdOrderByContributionDateDesc(
                        goalId);
    }

    // Add a contribution and update the goal's saved amount
    @Transactional
    public SavingsContribution addContribution(
            Long goalId,
            Long userId,
            BigDecimal amount,
            LocalDate contributionDate,
            String note) {

        if (amount == null
                || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Contribution amount must be greater than zero");
        }

        SavingsGoal goal = savingsGoalRepository
                .findByGoalIdAndUser_UserId(goalId, userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Savings goal not found"));

        BigDecimal currentAmount = goal.getCurrentAmount() == null
                ? BigDecimal.ZERO
                : goal.getCurrentAmount();

        BigDecimal newAmount = currentAmount.add(amount);

        if (newAmount.compareTo(goal.getTargetAmount()) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Contribution exceeds the remaining goal amount");
        }

        SavingsContribution contribution = new SavingsContribution();
        contribution.setSavingsGoal(goal);
        contribution.setAmount(amount);
        contribution.setContributionDate(
                contributionDate != null
                        ? contributionDate
                        : LocalDate.now());
        contribution.setNote(note);

        goal.setCurrentAmount(newAmount);

        // Both changes occur in the same transaction.
        savingsGoalRepository.save(goal);
        return contributionRepository.save(contribution);
    }
}
