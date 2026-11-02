
package com.spendwise.dto;

import com.spendwise.entity.SavingsGoal;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record SavingsGoalResponse(
        Long id,
        String name,
        BigDecimal target,
        BigDecimal saved,
        LocalDate deadline,
        String description,
        LocalDateTime createdAt
) {

    public static SavingsGoalResponse fromEntity(SavingsGoal goal) {
        return new SavingsGoalResponse(
                goal.getGoalId(),
                goal.getGoalName(),
                goal.getTargetAmount(),
                goal.getCurrentAmount(),
                goal.getTargetDate(),
                goal.getDescription(),
                goal.getCreatedAt()
        );
    }
}
