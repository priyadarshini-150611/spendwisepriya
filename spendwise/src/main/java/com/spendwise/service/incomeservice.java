
package com.spendwise.service;

import com.spendwise.entity.Income;
import com.spendwise.entity.User;
import com.spendwise.repository.IncomeRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class IncomeService {

    private final IncomeRepository incomeRepository;

    public IncomeService(IncomeRepository incomeRepository) {
        this.incomeRepository = incomeRepository;
    }

    @Transactional(readOnly = true)
    public List<Income> getIncomeByUser(Long userId) {
        return incomeRepository
                .findByUser_UserIdOrderByIncomeDateDesc(userId);
    }

    @Transactional(readOnly = true)
    public Optional<Income> getIncomeById(
            Long incomeId, Long userId) {

        return incomeRepository
                .findByIncomeIdAndUser_UserId(incomeId, userId);
    }

    @Transactional
    public Income createIncome(Income income, Long userId) {
        User user = new User();
        user.setUserId(userId);

        income.setIncomeId(null);
        income.setUser(user);

        return incomeRepository.save(income);
    }

    
@Transactional
public Optional<Income> updateIncome(
        Long incomeId, Long userId, Income updatedIncome) {

    Optional<Income> existingIncome =
            incomeRepository.findByIncomeIdAndUser_UserId(
                    incomeId, userId);

    if (existingIncome.isEmpty()) {
        return Optional.empty();
    }

    Income income = existingIncome.get();

    income.setSource(updatedIncome.getSource());
    income.setAmount(updatedIncome.getAmount());
    income.setIncomeDate(updatedIncome.getIncomeDate());
    income.setCategory(updatedIncome.getCategory());
    income.setDescription(updatedIncome.getDescription());

    return Optional.of(incomeRepository.save(income));
}

@Transactional
public boolean deleteIncome(Long incomeId, Long userId) {

    Optional<Income> existingIncome =
            incomeRepository.findByIncomeIdAndUser_UserId(
                    incomeId, userId);

    if (existingIncome.isEmpty()) {
        return false;
    }

    incomeRepository.delete(existingIncome.get());
    return true;
}

}
