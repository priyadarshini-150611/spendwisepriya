
package com.spendwise.repository;

import com.spendwise.entity.SavingsContribution;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SavingsContributionRepository
        extends JpaRepository<SavingsContribution, Long> {

    List<SavingsContribution> findBySavingsGoal_GoalIdOrderByContributionDateDesc(
            Long goalId);
}
