
package com.spendwise.repository;

import com.spendwise.entity.SavingsGoal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavingsGoalRepository
        extends JpaRepository<SavingsGoal, Long> {

    List<SavingsGoal> findByUser_UserId(Long userId);

    Optional<SavingsGoal> findByGoalIdAndUser_UserId(
            Long goalId, Long userId);
}
