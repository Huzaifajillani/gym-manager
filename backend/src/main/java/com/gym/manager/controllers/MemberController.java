package com.gym.manager.controllers;

import com.gym.manager.dto.PauseMembershipRequest;
import com.gym.manager.dto.RegisterMemberRequest;
import com.gym.manager.models.Member;
import com.gym.manager.services.MemberService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/members")
public class MemberController {

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    /**
     * Public walk-in registration form endpoint
     */
    @PostMapping("/register-public")
    public ResponseEntity<?> registerPublicWalkIn(@RequestBody RegisterMemberRequest request) {
        try {
            Member member = memberService.registerWalkInMember(request);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Member registered successfully with Pending payment.",
                    "memberCode", member.getMemberCode(),
                    "memberId", member.getId(),
                    "name", member.getName()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Admin: get all members with filters and search
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllMembers(
            @RequestParam(required = false, defaultValue = "All") String status,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(memberService.getAllMembersWithMembership(status, search));
    }

    /**
     * Member / Admin: get single profile
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getMemberProfile(@PathVariable String id) {
        try {
            return ResponseEntity.ok(memberService.getMemberProfile(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateMember(@PathVariable String id, @RequestBody Map<String, Object> updates) {
        try {
            memberService.updateMemberDetails(id, updates);
            return ResponseEntity.ok(Map.of("success", true, "message", "Member details updated."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/pause")
    public ResponseEntity<?> pauseMembership(@PathVariable String id, @RequestBody PauseMembershipRequest request) {
        try {
            memberService.pauseMembership(id, request);
            return ResponseEntity.ok(Map.of("success", true, "message", "Membership paused successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/resume")
    public ResponseEntity<?> resumeMembership(@PathVariable String id) {
        try {
            memberService.resumeMembership(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Membership resumed successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMember(@PathVariable String id) {
        memberService.deleteMember(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Member deleted."));
    }

    @PutMapping("/{id}/consent")
    public ResponseEntity<?> updateConsent(@PathVariable String id, @RequestBody Map<String, Boolean> payload) {
        Boolean consent = payload.get("consentGiven");
        if (consent == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "consentGiven boolean field is required."));
        }
        memberService.updateConsent(id, consent);
        return ResponseEntity.ok(Map.of("success", true, "consentGiven", consent));
    }
}
