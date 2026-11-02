
package com.spendwise.controller;

import com.spendwise.dto.ChangePasswordRequest;
import com.spendwise.dto.UpdatePreferencesRequest;
import com.spendwise.dto.UpdateProfileRequest;
import com.spendwise.entity.User;
import com.spendwise.entity.UserSettings;
import com.spendwise.repository.UserRepository;
import com.spendwise.repository.UserSettingsRepository;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final UserRepository userRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final PasswordEncoder passwordEncoder;

    public SettingsController(
            UserRepository userRepository,
            UserSettingsRepository userSettingsRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.userSettingsRepository = userSettingsRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Get the currently logged-in user
    private User getLoggedInUser(HttpSession session) {
        Object sessionUserId = session.getAttribute("userId");

        if (!(sessionUserId instanceof Long userId)) {
            return null;
        }

        return userRepository.findById(userId).orElse(null);
    }

    // -----------------------------------------------------
    // GET PROFILE
    // GET /api/settings/profile
    // -----------------------------------------------------

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(HttpSession session) {

        User user = getLoggedInUser(session);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in first."));
        }

        return ResponseEntity.ok(Map.of(
                "fullName", user.getFullName(),
                "email", user.getEmail()
        ));
    }

    // -----------------------------------------------------
    // UPDATE PROFILE
    // PUT /api/settings/profile
    // -----------------------------------------------------

    @PutMapping("/profile")
    @Transactional
    public ResponseEntity<?> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            HttpSession session) {

        User user = getLoggedInUser(session);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in first."));
        }

        String fullName = request.getFullName().trim();
        String email = request.getEmail().trim().toLowerCase();

        Optional<User> existingUser = userRepository.findByEmail(email);

        if (existingUser.isPresent()
                && !existingUser.get().getUserId()
                        .equals(user.getUserId())) {

            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "message",
                            "This email address is already registered."
                    ));
        }

        user.setFullName(fullName);
        user.setEmail(email);

        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "message", "Profile updated successfully.",
                "fullName", user.getFullName(),
                "email", user.getEmail()
        ));
    }

    // -----------------------------------------------------
    // GET PREFERENCES
    // GET /api/settings/preferences
    // -----------------------------------------------------

    @GetMapping("/preferences")
    @Transactional
    public ResponseEntity<?> getPreferences(HttpSession session) {

        User user = getLoggedInUser(session);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in first."));
        }

        UserSettings settings = userSettingsRepository
                .findById(user.getUserId())
                .orElseGet(() -> {
                    UserSettings newSettings = new UserSettings();
                    newSettings.setUser(user);
                    return userSettingsRepository.save(newSettings);
                });

        return ResponseEntity.ok(Map.of(
                "notificationsEnabled",
                Boolean.TRUE.equals(settings.getNotificationsEnabled()),

                "budgetAlertsEnabled",
                Boolean.TRUE.equals(settings.getBudgetAlertsEnabled()),

                "insightsEnabled",
                Boolean.TRUE.equals(settings.getInsightsEnabled()),

                "theme",
                settings.getTheme()
        ));
    }

    // -----------------------------------------------------
    // UPDATE PREFERENCES
    // PUT /api/settings/preferences
    // -----------------------------------------------------

    @PutMapping("/preferences")
    @Transactional
    public ResponseEntity<?> updatePreferences(
            @Valid @RequestBody UpdatePreferencesRequest request,
            HttpSession session) {

        User user = getLoggedInUser(session);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in first."));
        }

        if (request.getNotificationsEnabled() == null
                || request.getBudgetAlertsEnabled() == null
                || request.getInsightsEnabled() == null) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            "All preference values must be provided."
                    ));
        }

        UserSettings settings = userSettingsRepository
                .findById(user.getUserId())
                .orElseGet(() -> {
                    UserSettings newSettings = new UserSettings();
                    newSettings.setUser(user);
                    return newSettings;
                });

        settings.setNotificationsEnabled(
                request.getNotificationsEnabled());

        settings.setBudgetAlertsEnabled(
                request.getBudgetAlertsEnabled());

        settings.setInsightsEnabled(
                request.getInsightsEnabled());

        settings.setTheme(request.getTheme());

        userSettingsRepository.save(settings);

        return ResponseEntity.ok(Map.of(
                "message", "Preferences saved successfully.",
                "notificationsEnabled",
                settings.getNotificationsEnabled(),
                "budgetAlertsEnabled",
                settings.getBudgetAlertsEnabled(),
                "insightsEnabled",
                settings.getInsightsEnabled(),
                "theme",
                settings.getTheme()
        ));
    }

    // -----------------------------------------------------
    // CHANGE PASSWORD
    // PUT /api/settings/password
    // -----------------------------------------------------

    @PutMapping("/password")
    @Transactional
    public ResponseEntity<?> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            HttpSession session) {

        User user = getLoggedInUser(session);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in first."));
        }

        if (!passwordEncoder.matches(
                request.getCurrentPassword(),
                user.getPasswordHash())) {

            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "message",
                            "Current password is incorrect."
                    ));
        }

        if (!request.getNewPassword().equals(
                request.getConfirmPassword())) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            "New password and confirmation do not match."
                    ));
        }

        if (passwordEncoder.matches(
                request.getNewPassword(),
                user.getPasswordHash())) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            "Choose a password different from your current password."
                    ));
        }

        user.setPasswordHash(
                passwordEncoder.encode(request.getNewPassword()));

        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "message", "Password changed successfully."
        ));
    }
}
