
package com.spendwise.repository;

import com.spendwise.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import com.spendwise.dto.DailySpendingResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import com.spendwise.dto.CategorySpendingResponse;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByUser_UserId(Long userId);

    List<Expense> findByUser_UserIdOrderByExpenseDateDesc(Long userId);

    Optional<Expense> findByExpenseIdAndUser_UserId(
        Long expenseId, Long userId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.user.userId = :userId")
    BigDecimal sumAmountByUserId(@Param("userId") Long userId);

    
@Query("""
    SELECT new com.spendwise.dto.DailySpendingResponse(
        e.expenseDate,
        SUM(e.amount)
    )
    FROM Expense e
    WHERE e.user.userId = :userId
      AND e.expenseDate >= :startDate
      AND e.expenseDate < :endDate
    GROUP BY e.expenseDate
    ORDER BY e.expenseDate
    """)
List<DailySpendingResponse> findDailySpending(
    @Param("userId") Long userId,
    @Param("startDate") LocalDate startDate,
    @Param("endDate") LocalDate endDate
);

@Query("""
    SELECT e.category, COALESCE(SUM(e.amount), 0)
    FROM Expense e
    WHERE e.user.userId = :userId
      AND e.expenseDate >= :startDate
      AND e.expenseDate < :endDate
    GROUP BY e.category
    """)
List<Object[]> sumExpensesByCategoryAndDateRange(
    @Param("userId") Long userId,
    @Param("startDate") LocalDate startDate,
    @Param("endDate") LocalDate endDate
);


@Query("""
    SELECT new com.spendwise.dto.CategorySpendingResponse(
        e.category,
        SUM(e.amount)
    )
    FROM Expense e
    WHERE e.user.userId = :userId
      AND e.expenseDate >= :startDate
      AND e.expenseDate < :endDate
    GROUP BY e.category
    ORDER BY SUM(e.amount) DESC
    """)
List<CategorySpendingResponse> findCategorySpending(
    @Param("userId") Long userId,
    @Param("startDate") LocalDate startDate,
    @Param("endDate") LocalDate endDate
);
}