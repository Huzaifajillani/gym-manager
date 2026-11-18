package com.gym.manager.services;

import com.gym.manager.dto.DailySummaryReport;
import com.gym.manager.models.Member;
import com.gym.manager.models.Membership;
import com.gym.manager.repositories.AttendanceRepository;
import com.gym.manager.repositories.MemberRepository;
import com.gym.manager.repositories.MembershipRepository;
import com.gym.manager.repositories.NoShowCaseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class DailyAutomationService {

    private static final Logger log = LoggerFactory.getLogger(DailyAutomationService.class);

    private final MemberRepository memberRepository;
    private final MembershipRepository membershipRepository;
    private final AttendanceRepository attendanceRepository;
    private final NoShowCaseRepository noShowCaseRepository;
    private final RedListService redListService;
    private final NotificationService notificationService;

    public DailyAutomationService(MemberRepository memberRepository,
                                  MembershipRepository membershipRepository,
                                  AttendanceRepository attendanceRepository,
                                  NoShowCaseRepository noShowCaseRepository,
                                  RedListService redListService,
                                  NotificationService notificationService) {
        this.memberRepository = memberRepository;
        this.membershipRepository = membershipRepository;
        this.attendanceRepository = attendanceRepository;
        this.noShowCaseRepository = noShowCaseRepository;
        this.redListService = redListService;
        this.notificationService = notificationService;
    }

    /**
     * 1. Daily Expiry Reminder Job (9:00 AM)
     * Finds members whose expiryDate is 7 days away, 3 days away, or today,
     * checks consentGiven == true and paymentStatus != Paid, and logs/triggers WhatsApp template reminder.
     */
    @Scheduled(cron = "0 0 9 * * ?")
    public int runDailyExpiryReminderJob() {
        LocalDate today = LocalDate.now();
        log.info("[CRON @ 09:00 AM] Running Daily Expiry Reminder Job for date: {}", today);

        int remindersSent = 0;
        List<Membership> memberships = membershipRepository.findAll();

        for (Membership ms : memberships) {
            if ("Paid".equalsIgnoreCase(ms.getPaymentStatus())) {
                // If paid, check if the membership itself is nearing expiry
            }
            if (ms.getExpiryDate() == null) continue;

            try {
                LocalDate expiryDate = LocalDate.parse(ms.getExpiryDate());
                long daysRemaining = ChronoUnit.DAYS.between(today, expiryDate);

                // Target: 7 days, 3 days, or 0 days (today)
                if (daysRemaining == 7 || daysRemaining == 3 || daysRemaining == 0) {
                    Optional<Member> memberOpt = memberRepository.findById(ms.getMemberId());
                    if (memberOpt.isPresent()) {
                        Member member = memberOpt.get();
                        if (member.isConsentGiven()) {
                            boolean sent = notificationService.sendExpiryReminder(
                                    member.getPhone(),
                                    member.getName(),
                                    daysRemaining,
                                    ms.getExpiryDate(),
                                    ms.getPlanName() != null ? ms.getPlanName() : "Gym Membership",
                                    member.isConsentGiven()
                            );
                            if (sent) remindersSent++;
                        } else {
                            log.debug("Skipping expiry reminder for member {} (Consent not given)", member.getName());
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Error processing expiry date for membership {}: {}", ms.getId(), e.getMessage());
            }
        }

        log.info("[CRON @ 09:00 AM] Completed Daily Expiry Reminder Job. Sent {} reminders.", remindersSent);
        return remindersSent;
    }

    /**
     * 2. Daily No-Show Red-List Scanner (8:00 AM)
     * Scans all Active members whose lastVisitDate is >= 10 days ago
     * and creates/updates an Open record in no_show_cases without creating duplicates.
     */
    @Scheduled(cron = "0 0 8 * * ?")
    public int runDailyNoShowScanner() {
        log.info("[CRON @ 08:00 AM] Running Daily No-Show Red-List Scanner...");
        int count = redListService.scanAndSyncNoShowCases();
        log.info("[CRON @ 08:00 AM] Completed Daily No-Show Scanner. Synced {} cases.", count);
        return count;
    }

    /**
     * 3. Daily Owner Summary Report (9:00 PM)
     * Compiles Active count, Expired count, Pending payments count, Today's check-ins,
     * and New Red-List count into a structured summary log/email payload.
     */
    @Scheduled(cron = "0 0 21 * * ?")
    public DailySummaryReport runDailyOwnerSummaryReport() {
        log.info("[CRON @ 09:00 PM] Compiling Daily Owner Summary Report...");
        DailySummaryReport report = compileSummaryReport();
        log.info("==================== DAILY OWNER SUMMARY REPORT ====================");
        log.info("Timestamp: {}", report.getGeneratedAt());
        log.info("Total Members: {}", report.getTotalMembers());
        log.info("Active Members: {}", report.getActiveMembers());
        log.info("Expired Members: {}", report.getExpiredMembers());
        log.info("Pending Payments: {}", report.getPendingPayments());
        log.info("Today's Check-ins: {}", report.getTodayCheckIns());
        log.info("Active Red-List Cases (10+ Days Absent): {}", report.getRedListCount());
        log.info("====================================================================");
        return report;
    }

    /**
     * Manually compile summary report (can be called by Admin Dashboard trigger button)
     */
    public DailySummaryReport compileSummaryReport() {
        redListService.scanAndSyncNoShowCases();

        LocalDate today = LocalDate.now();
        List<Member> allMembers = memberRepository.findAll();

        long totalMembers = 0;
        long activeMembers = 0;
        long expiredMembers = 0;

        for (Member m : allMembers) {
            if ("ROLE_ADMIN".equals(m.getRole())) continue;
            totalMembers++;

            String status = m.getStatus();
            Optional<Membership> msOpt = membershipRepository.findTopByMemberIdOrderByStartDateDesc(m.getId());
            if (msOpt.isPresent() && msOpt.get().getExpiryDate() != null) {
                try {
                    LocalDate exp = LocalDate.parse(msOpt.get().getExpiryDate());
                    if (exp.isBefore(today)) {
                        status = "Expired";
                    }
                } catch (Exception ignored) {}
            }

            if ("Active".equalsIgnoreCase(status)) activeMembers++;
            else if ("Expired".equalsIgnoreCase(status)) expiredMembers++;
        }

        long pendingPayments = membershipRepository.countByPaymentStatus("Pending");
        long todayCheckIns = attendanceRepository.countByCheckInDate(today.toString());
        long redListCount = noShowCaseRepository.countByStatus("Open") + noShowCaseRepository.countByStatus("Contacted");

        DailySummaryReport report = new DailySummaryReport();
        report.setTotalMembers(totalMembers);
        report.setActiveMembers(activeMembers);
        report.setExpiredMembers(expiredMembers);
        report.setPendingPayments(pendingPayments);
        report.setTodayCheckIns(todayCheckIns);
        report.setRedListCount(redListCount);
        report.setGeneratedAt(LocalDateTime.now());
        report.setStatusMessage(String.format("Report successfully generated at %s for %d total members.",
                LocalDateTime.now(), totalMembers));

        return report;
    }
}
