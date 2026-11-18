package com.gym.manager.controllers;

import com.gym.manager.dto.DailySummaryReport;
import com.gym.manager.models.Attendance;
import com.gym.manager.models.Member;
import com.gym.manager.models.Membership;
import com.gym.manager.repositories.AttendanceRepository;
import com.gym.manager.repositories.MemberRepository;
import com.gym.manager.repositories.MembershipRepository;
import com.gym.manager.services.DailyAutomationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final DailyAutomationService dailyAutomationService;
    private final MemberRepository memberRepository;
    private final MembershipRepository membershipRepository;
    private final AttendanceRepository attendanceRepository;

    public ReportController(DailyAutomationService dailyAutomationService,
                            MemberRepository memberRepository,
                            MembershipRepository membershipRepository,
                            AttendanceRepository attendanceRepository) {
        this.dailyAutomationService = dailyAutomationService;
        this.memberRepository = memberRepository;
        this.membershipRepository = membershipRepository;
        this.attendanceRepository = attendanceRepository;
    }

    /**
     * Get dashboard summary KPIs and actionable lists
     */
    @GetMapping("/dashboard-summary")
    public ResponseEntity<Map<String, Object>> getDashboardSummary() {
        DailySummaryReport metrics = dailyAutomationService.compileSummaryReport();

        // Expiring memberships (within next 7 days or today)
        LocalDate today = LocalDate.now();
        List<Map<String, Object>> expiringSoon = new ArrayList<>();
        List<Membership> allMemberships = membershipRepository.findAll();

        for (Membership ms : allMemberships) {
            if (ms.getExpiryDate() == null) continue;
            try {
                LocalDate exp = LocalDate.parse(ms.getExpiryDate());
                long days = ChronoUnit.DAYS.between(today, exp);
                if (days >= 0 && days <= 7) {
                    Optional<Member> mOpt = memberRepository.findById(ms.getMemberId());
                    if (mOpt.isPresent()) {
                        Member m = mOpt.get();
                        expiringSoon.add(Map.of(
                                "memberId", m.getId(),
                                "memberName", m.getName(),
                                "memberCode", m.getMemberCode(),
                                "phone", m.getPhone(),
                                "planName", ms.getPlanName() != null ? ms.getPlanName() : "Standard",
                                "expiryDate", ms.getExpiryDate(),
                                "daysRemaining", days,
                                "paymentStatus", ms.getPaymentStatus()
                        ));
                    }
                }
            } catch (Exception ignored) {}
        }

        // Sort expiring by days remaining ascending
        expiringSoon.sort(Comparator.comparingLong(a -> (Long) a.get("daysRemaining")));

        // Recent check-ins
        List<Attendance> recentCheckIns = attendanceRepository.findTop20ByOrderByCheckInTimeDesc();

        Map<String, Object> response = new HashMap<>();
        response.put("kpi", metrics);
        response.put("expiringSoon", expiringSoon);
        response.put("recentCheckIns", recentCheckIns);

        return ResponseEntity.ok(response);
    }

    /**
     * Trigger Daily Summary Report manually from Admin Dashboard
     */
    @PostMapping("/daily-summary/trigger")
    public ResponseEntity<DailySummaryReport> triggerDailySummaryReport() {
        DailySummaryReport report = dailyAutomationService.runDailyOwnerSummaryReport();
        return ResponseEntity.ok(report);
    }
}
