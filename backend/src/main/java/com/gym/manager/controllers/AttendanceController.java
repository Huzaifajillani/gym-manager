package com.gym.manager.controllers;

import com.gym.manager.dto.AssistedCheckInRequest;
import com.gym.manager.models.Attendance;
import com.gym.manager.models.DailyQrCode;
import com.gym.manager.services.AttendanceService;
import com.gym.manager.services.DailyQrService;
import io.jsonwebtoken.Claims;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final DailyQrService dailyQrService;

    public AttendanceController(AttendanceService attendanceService, DailyQrService dailyQrService) {
        this.attendanceService = attendanceService;
        this.dailyQrService = dailyQrService;
    }

    // ─── EXISTING ENDPOINTS (kept intact) ─────────────────────────────────────

    /**
     * Member QR Check-in (legacy): reads memberId from payload or authenticated JWT
     */
    @PostMapping("/qr-check-in")
    public ResponseEntity<?> qrCheckIn(@RequestBody(required = false) Map<String, String> payload,
                                       Authentication authentication) {
        String memberId = null;
        if (payload != null && payload.containsKey("memberId")) {
            memberId = payload.get("memberId");
        } else if (authentication != null && authentication.getDetails() instanceof Claims claims) {
            memberId = claims.get("memberId", String.class);
        }

        if (memberId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Member ID is required for check-in."));
        }

        try {
            Attendance attendance = attendanceService.processQrCheckIn(memberId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Gate opened! Check-in successful.",
                    "attendance", attendance
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage(), "blocked", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Admin / Staff Assisted Check-in with mandatory reason
     */
    @PostMapping("/assisted-check-in/{memberId}")
    public ResponseEntity<?> assistedCheckIn(@PathVariable String memberId,
                                             @RequestBody AssistedCheckInRequest request) {
        try {
            Attendance attendance = attendanceService.processAssistedCheckIn(memberId, request.getReason());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Assisted check-in verified and recorded.",
                    "attendance", attendance
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage(), "blocked", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/member/{memberId}")
    public ResponseEntity<List<Attendance>> getMemberAttendance(@PathVariable String memberId) {
        return ResponseEntity.ok(attendanceService.getMemberAttendance(memberId));
    }

    @GetMapping("/recent")
    public ResponseEntity<List<Attendance>> getRecentCheckIns() {
        return ResponseEntity.ok(attendanceService.getRecentCheckIns());
    }

    @GetMapping("/today-count")
    public ResponseEntity<Map<String, Long>> getTodayCount() {
        return ResponseEntity.ok(Map.of("todayCheckIns", attendanceService.getTodayCheckInCount()));
    }

    // ─── NEW DAILY QR ENDPOINTS ────────────────────────────────────────────────

    /**
     * Admin: Generate (or regenerate) today's daily QR token.
     */
    @PostMapping("/daily-qr/generate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> generateDailyQr() {
        try {
            DailyQrCode qr = dailyQrService.generateOrRefreshTodayQr();
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("date", qr.getDate());
            resp.put("qrToken", qr.getQrToken());
            resp.put("createdAt", qr.getCreatedAt().toString());
            resp.put("active", qr.isActive());
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Admin: Fetch today's active QR code (so Admin doesn't lose it on page refresh).
     */
    @GetMapping("/daily-qr/today")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getTodayQr() {
        Optional<DailyQrCode> qrOpt = dailyQrService.getTodayQr();
        if (qrOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("generated", false));
        }
        DailyQrCode qr = qrOpt.get();
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("generated", true);
        resp.put("date", qr.getDate());
        resp.put("qrToken", qr.getQrToken());
        resp.put("createdAt", qr.getCreatedAt().toString());
        resp.put("active", qr.isActive());
        return ResponseEntity.ok(resp);
    }

    /**
     * Member: Scan daily QR code to mark attendance.
     * Accepts { qrToken, memberId } — memberId can also come from JWT claims.
     */
    @PostMapping("/scan")
    public ResponseEntity<?> scanDailyQr(@RequestBody Map<String, String> payload,
                                         Authentication authentication) {
        String qrToken = payload != null ? payload.get("qrToken") : null;
        String memberId = payload != null ? payload.get("memberId") : null;

        // Fallback: extract memberId from JWT
        if (memberId == null && authentication != null && authentication.getDetails() instanceof Claims claims) {
            memberId = claims.get("memberId", String.class);
        }

        if (qrToken == null || qrToken.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "QR token is required."));
        }
        if (memberId == null || memberId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Member ID is required."));
        }

        try {
            Attendance attendance = dailyQrService.processDailyQrScan(qrToken, memberId);
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("success", true);
            resp.put("message", "✅ Check-in successful! Welcome to the gym!");
            resp.put("checkInTime", attendance.getCheckInTime().toString());
            resp.put("memberName", attendance.getMemberName());
            resp.put("date", attendance.getCheckInDate());
            return ResponseEntity.ok(resp);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage(), "blocked", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Admin: Get all check-ins for today.
     */
    @GetMapping("/today")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Attendance>> getTodayAttendance() {
        return ResponseEntity.ok(dailyQrService.getTodayAttendance());
    }
}
