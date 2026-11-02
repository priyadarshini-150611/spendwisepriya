
package com.spendwise.dto;

import com.spendwise.entity.SavingsContribution;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record SavingsContributionResponse(
        Long contributionId,
        Long goalId,
        BigDecimal amount,
        LocalDate contributionDate,
        String note,
        LocalDateTime createdAt
) {

    public static SavingsContributionResponse fromEntity(
            SavingsContribution contribution) {

        return new SavingsContributionResponse(
                contribution.getContributionId(),
                contribution.getSavingsGoal().getGoalId(),
                contribution.getAmount(),
                contribution.getContributionDate(),
                contribution.getNote(),
                contribution.getCreatedAt()
        );
    }
}
