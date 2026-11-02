
package com.spendwise.repository;

import com.spendwise.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BudgetRepository extends JpaRepository<Budget, Long> {

    List<Budget> findByUser_UserId(Long userId);

    List<Budget> findByUser_UserIdAndBudgetMonth(
            Long userId, LocalDate budgetMonth);

    Optional<Budget> findByUser_UserIdAndCategoryAndBudgetMonth(
            Long userId, String category, LocalDate budgetMonth);

    Optional<Budget> findByBudgetIdAndUser_UserId(
        Long budgetId, Long userId);
}
