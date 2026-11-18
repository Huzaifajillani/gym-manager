package com.gym.manager.controllers;

import com.gym.manager.models.Addon;
import com.gym.manager.models.AddonOrder;
import com.gym.manager.services.AddonService;
import io.jsonwebtoken.Claims;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/addons")
public class AddonController {

    private final AddonService addonService;

    public AddonController(AddonService addonService) {
        this.addonService = addonService;
    }

    @GetMapping
    public ResponseEntity<List<Addon>> getAllAddons(@RequestParam(required = false) String category) {
        if (category != null && !category.isEmpty()) {
            return ResponseEntity.ok(addonService.getAddonsByCategory(category.toUpperCase()));
        }
        return ResponseEntity.ok(addonService.getAllAddons());
    }

    @PostMapping("/{addonId}/purchase")
    public ResponseEntity<?> purchaseAddon(@PathVariable String addonId,
                                           @RequestBody(required = false) Map<String, String> payload,
                                           Authentication authentication) {
        String memberId = null;
        if (payload != null && payload.containsKey("memberId")) {
            memberId = payload.get("memberId");
        } else if (authentication != null && authentication.getDetails() instanceof Claims claims) {
            memberId = claims.get("memberId", String.class);
        }

        if (memberId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Member ID is required."));
        }

        try {
            AddonOrder order = addonService.purchaseAddon(memberId, addonId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Add-on successfully purchased and added to your profile!",
                    "order", order
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/orders/member/{memberId}")
    public ResponseEntity<List<AddonOrder>> getMemberOrders(@PathVariable String memberId) {
        return ResponseEntity.ok(addonService.getMemberOrders(memberId));
    }

    @PostMapping("/orders/{orderId}/consume")
    public ResponseEntity<?> consumeSession(@PathVariable String orderId) {
        try {
            AddonOrder updated = addonService.consumeSession(orderId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "sessionsRemaining", updated.getSessionsRemaining(),
                    "status", updated.getStatus()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
