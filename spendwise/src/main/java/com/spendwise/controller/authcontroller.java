
package com.spendwise.controller;

import com.spendwise.dto.LoginRequest;
import com.spendwise.dto.RegisterRequest;
import com.spendwise.entity.User;
import com.spendwise.repository.UserRepository;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(
            @Valid @RequestBody RegisterRequest request) {

        String email = request.getEmail().trim().toLowerCase();
        String fullName = request.getFullName().trim();

        if (fullName.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Full name is required"));
        }

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "An account with this email already exists"));
        }

        User user = new User();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Registration successful"));
    }

    
    
@PostMapping("/login")
public ResponseEntity<Map<String, String>> login(
        @Valid @RequestBody LoginRequest request,
        HttpSession session) {

    String email = request.getEmail().trim().toLowerCase();

    User user = userRepository.findByEmail(email).orElse(null);

    if (user == null ||
            !passwordEncoder.matches(
                    request.getPassword(),
                    user.getPasswordHash())) {

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Invalid email or password"));
    }

    // Remember the logged-in user on the server
    session.setAttribute("userId", user.getUserId());

    return ResponseEntity.ok(
            Map.of("message", "Login successful"));
}

    
@GetMapping("/me")
public ResponseEntity<Map<String, String>> getCurrentUser(
        HttpSession session) {

    Object userId = session.getAttribute("userId");

    if (userId == null) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Not logged in"));
    }

    User user = userRepository.findById((Long) userId)
            .orElse(null);

    if (user == null) {
        session.invalidate();

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "User account not found"));
    }

    return ResponseEntity.ok(
            Map.of(
                    "fullName", user.getFullName(),
                    "email", user.getEmail()
            )
    );
}


@PostMapping("/logout")
public ResponseEntity<Map<String, String>> logout(
        HttpSession session) {

    session.invalidate();

    return ResponseEntity.ok(
            Map.of("message", "Logout successful"));
}


}
