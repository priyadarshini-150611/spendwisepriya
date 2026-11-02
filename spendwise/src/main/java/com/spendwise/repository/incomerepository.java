package com.spendwise.repository;

import com.spendwise.entity.Income;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface IncomeRepository extends JpaRepository<Income, Long> {

    List<Income> findByUser_UserId(Long userId);

    List<Income> findByUser_UserIdOrderByIncomeDateDesc(Long userId);

    Optional<Income> findByIncomeIdAndUser_UserId(
        Long incomeId, Long userId);

    @Query("SELECT COALESCE(SUM(i.amount), 0) FROM Income i WHERE i.user.userId = :userId")
    BigDecimal sumAmountByUserId(@Param("userId") Long userId);
}
