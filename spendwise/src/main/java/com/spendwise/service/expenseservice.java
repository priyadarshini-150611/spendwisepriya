
package com.spendwise.service;

import com.spendwise.dto.CategorySpendingResponse;
import com.spendwise.dto.DailySpendingResponse;
import com.spendwise.entity.Expense;
import com.spendwise.entity.User;
import com.spendwise.repository.ExpenseRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;

    public ExpenseService(ExpenseRepository expenseRepository) {
        this.expenseRepository = expenseRepository;
    }

    @Transactional(readOnly = true)
    public List<Expense> getExpensesByUser(Long userId) {
        return expenseRepository
                .findByUser_UserIdOrderByExpenseDateDesc(userId);
    }

    @Transactional(readOnly = true)
    public List<DailySpendingResponse> getDailySpending(
            Long userId,
            LocalDate startDate,
            LocalDate endDate) {

        return expenseRepository.findDailySpending(
                userId, startDate, endDate
        );
    }

    @Transactional
    public Expense createExpense(Expense expense, Long userId) {
        User user = new User();
        user.setUserId(userId);

        expense.setExpenseId(null);
        expense.setUser(user);

        return expenseRepository.save(expense);
    }

    @Transactional
    public Expense updateExpense(
            Long expenseId,
            Expense updatedExpense,
            Long userId) {

        Expense existingExpense = expenseRepository
                .findByExpenseIdAndUser_UserId(expenseId, userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Expense not found"
                ));

        existingExpense.setDescription(updatedExpense.getDescription());
        existingExpense.setAmount(updatedExpense.getAmount());
        existingExpense.setExpenseDate(updatedExpense.getExpenseDate());
        existingExpense.setCategory(updatedExpense.getCategory());
        existingExpense.setPaymentMethod(updatedExpense.getPaymentMethod());

        return expenseRepository.save(existingExpense);
    }

    @Transactional
    public void deleteExpense(Long expenseId, Long userId) {
        Expense existingExpense = expenseRepository
                .findByExpenseIdAndUser_UserId(expenseId, userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Expense not found"
                ));

        expenseRepository.delete(existingExpense);
    }

    @Transactional(readOnly = true)
    public List<CategorySpendingResponse> getCategorySpending(
            Long userId,
            LocalDate startDate,
            LocalDate endDate) {

        return expenseRepository.findCategorySpending(
                userId, startDate, endDate
        );
    }
}
