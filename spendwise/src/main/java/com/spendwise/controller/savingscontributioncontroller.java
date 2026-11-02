
package com.spendwise.controller;

import com.spendwise.dto.SavingsContributionRequest;
import com.spendwise.dto.SavingsContributionResponse;
import com.spendwise.entity.SavingsContribution;
import com.spendwise.service.SavingsContributionService;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/savings-goals/{goalId}/contributions")
public class SavingsContributionController {

    private final SavingsContributionService contributionService;

    public SavingsContributionController(
            SavingsContributionService contributionService) {
        this.contributionService = contributionService;
    }

    // Get contribution history for a goal
    @GetMapping
    public List<SavingsContributionResponse> getContributions(
            HttpSession session,
            @PathVariable Long goalId) {

        Long userId = getLoggedInUserId(session);

        return contributionService
                .getContributionsByGoal(goalId, userId)
                .stream()
                .map(SavingsContributionResponse::fromEntity)
                .toList();
    }

    // Add savings to a goal
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SavingsContributionResponse addContribution(
            HttpSession session,
            @PathVariable Long goalId,
            @RequestBody SavingsContributionRequest request) {

        Long userId = getLoggedInUserId(session);

        SavingsContribution contribution =
                contributionService.addContribution(
                        goalId,
                        userId,
                        request.amount(),
                        request.contributionDate(),
                        request.note());

        return SavingsContributionResponse.fromEntity(contribution);
    }

    // Get logged-in user ID from the session
    private Long getLoggedInUserId(HttpSession session) {

        Object sessionUserId = session.getAttribute("userId");

        if (!(sessionUserId instanceof Number)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in first");
        }

        return ((Number) sessionUserId).longValue();
    }
}
