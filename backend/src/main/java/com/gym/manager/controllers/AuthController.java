package com.gym.manager.controllers;

import com.gym.manager.dto.AuthRequest;
import com.gym.manager.dto.AuthResponse;
import com.gym.manager.models.Member;
import com.gym.manager.repositories.MemberRepository;
import com.gym.manager.services.AuthService;
import io.jsonwebtoken.Claims;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final MemberRepository memberRepository;

    public AuthController(AuthService authService, MemberRepository memberRepository) {
        this.authService = authService;
        this.memberRepository = memberRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        try {
            AuthResponse response = authService.authenticate(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !(authentication.getDetails() instanceof Claims claims)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String memberId = claims.get("memberId", String.class);
        Member member = memberRepository.findById(memberId).orElse(null);
        if (member == null) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        Map<String, Object> response = new java.util.LinkedHashMap<>();
        response.put("memberId", member.getId());
        response.put("memberCode", member.getMemberCode());
        response.put("name", member.getName());
        response.put("email", member.getEmail());
        response.put("phone", member.getPhone());
        response.put("role", member.getRole());
        response.put("status", member.getStatus());
        response.put("consentGiven", member.isConsentGiven());
        response.put("streakCount", member.getStreakCount());
        response.put("weeklyGoal", member.getWeeklyGoal());
        response.put("lastVisitDate", member.getLastVisitDate() != null ? member.getLastVisitDate() : "N/A");
        response.put("height", member.getHeight());
        response.put("weight", member.getWeight());
        response.put("profilePicture", member.getProfilePicture());

        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            Authentication authentication,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "phone", required = false) String phone,
            @RequestParam(value = "password", required = false) String password,
            @RequestParam(value = "height", required = false) String height,
            @RequestParam(value = "weight", required = false) String weight,
            @RequestParam(value = "profileImage", required = false) MultipartFile profileImage
    ) {
        if (authentication == null || !(authentication.getDetails() instanceof Claims claims)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String memberId = claims.get("memberId", String.class);
        Member member = memberRepository.findById(memberId).orElse(null);
        if (member == null) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        try {
            if (name != null && !name.isEmpty()) member.setName(name);
            if (email != null && !email.isEmpty()) member.setEmail(email);
            if (phone != null && !phone.isEmpty()) member.setPhone(phone);
            if (height != null) member.setHeight(height);
            if (weight != null) member.setWeight(weight);

            if (password != null && !password.isEmpty()) {
                member.setPassword(password);
            }

            if (profileImage != null && !profileImage.isEmpty()) {
                String uploadDir = "uploads/";
                File uploadDirFile = new File(uploadDir);
                if (!uploadDirFile.exists()) {
                    uploadDirFile.mkdirs();
                }
                String fileName = UUID.randomUUID().toString() + "_" + profileImage.getOriginalFilename();
                Path filePath = Paths.get(uploadDir + fileName);
                Files.write(filePath, profileImage.getBytes());
                member.setProfilePicture("/uploads/" + fileName);
            }

            memberRepository.save(member);

            Map<String, Object> response = new java.util.LinkedHashMap<>();
            response.put("message", "Profile updated successfully");
            response.put("memberId", member.getId());
            response.put("memberCode", member.getMemberCode());
            response.put("name", member.getName());
            response.put("email", member.getEmail());
            response.put("phone", member.getPhone());
            response.put("role", member.getRole());
            response.put("status", member.getStatus());
            response.put("height", member.getHeight());
            response.put("weight", member.getWeight());
            response.put("profilePicture", member.getProfilePicture());

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to upload image: " + e.getMessage()));
        }
    }
}