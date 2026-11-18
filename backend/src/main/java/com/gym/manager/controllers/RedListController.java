package com.gym.manager.controllers;

import com.gym.manager.dto.RedListFollowUpRequest;
import com.gym.manager.models.NoShowCase;
import com.gym.manager.services.RedListService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/red-list")
public class RedListController {

    private final RedListService redListService;

    public RedListController(RedListService redListService) {
        this.redListService = redListService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getRedList(
            @RequestParam(required = false, defaultValue = "All") String range) {
        return ResponseEntity.ok(redListService.getRedListCases(range));
    }

    @PostMapping("/{id}/follow-up")
    public ResponseEntity<?> logFollowUp(@PathVariable String id, @RequestBody RedListFollowUpRequest req) {
        try {
            NoShowCase updated = redListService.logFollowUp(id, req);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Follow-up outcome successfully logged.",
                    "case", updated
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/send-reminder")
    public ResponseEntity<?> sendWhatsAppReminder(@PathVariable String id) {
        try {
            boolean sent = redListService.triggerWhatsAppReminder(id);
            if (sent) {
                return ResponseEntity.ok(Map.of("success", true, "message", "WhatsApp reminder dispatched successfully!"));
            } else {
                return ResponseEntity.ok(Map.of("success", false, "message", "Reminder suppressed (Member opted out of WhatsApp messages)."));
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/scan-now")
    public ResponseEntity<?> triggerScanNow() {
        int count = redListService.scanAndSyncNoShowCases();
        return ResponseEntity.ok(Map.of("success", true, "scannedCases", count));
    }
}
