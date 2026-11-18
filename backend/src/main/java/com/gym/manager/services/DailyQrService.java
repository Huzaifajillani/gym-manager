package com.gym.manager.services;

import com.gym.manager.models.Attendance;
import com.gym.manager.models.DailyQrCode;
import com.gym.manager.models.Member;
import com.gym.manager.models.Membership;
import com.gym.manager.models.NoShowCase;
import com.gym.manager.repositories.AttendanceRepository;
import com.gym.manager.repositories.DailyQrCodeRepository;
import com.gym.manager.repositories.MemberRepository;
import com.gym.manager.repositories.MembershipRepository;
import com.gym.manager.repositories.NoShowCaseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class DailyQrService {

    private static final Logger log = LoggerFactory.getLogger(DailyQrService.class);

    private final DailyQrCodeRepository dailyQrCodeRepository;
    private final AttendanceRepository attendanceRepository;
    private final MemberRepository memberRepository;
    private final MembershipRepository membershipRepository;
    private final NoShowCaseRepository noShowCaseRepository;

    public DailyQrService(DailyQrCodeRepository dailyQrCodeRepository,
                          AttendanceRepository attendanceRepository,
                          MemberRepository memberRepository,
                          MembershipRepository membershipRepository,
                          NoShowCaseRepository noShowCaseRepository) {
        this.dailyQrCodeRepository = dailyQrCodeRepository;
        this.attendanceRepository = attendanceRepository;
        this.memberRepository = memberRepository;
        this.membershipRepository = membershipRepository;
        this.noShowCaseRepository = noShowCaseRepository;
    }

    /**
     * Generate (or regenerate) today's daily QR token.
     * Idempotent — if one already exists for today, replace it.
     */
    @Transactional
    public DailyQrCode generateOrRefreshTodayQr() {
        String today = LocalDate.now().toString();
        String token = "GYM_" + today + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();

        // Deactivate any previous QR for today
        dailyQrCodeRepository.findByDate(today).ifPresent(existing -> {
            existing.setActive(false);
            dailyQrCodeRepository.save(existing);
        });

        DailyQrCode qr = new DailyQrCode();
        qr.setDate(today);
        qr.setQrToken(token);
        qr.setCreatedAt(LocalDateTime.now());
        qr.setActive(true);

        DailyQrCode saved = dailyQrCodeRepository.save(qr);
        log.info("Daily QR generated for {} → {}", today, token);
        return saved;
    }

    /**
     * Fetch today's active QR code (if already generated).
     */
    public Optional<DailyQrCode> getTodayQr() {
        String today = LocalDate.now().toString();
        return dailyQrCodeRepository.findByDate(today)
                .filter(DailyQrCode::isActive);
    }

    /**
     * Process a daily QR scan from a member.
     * Strict 4-step validation chain.
     */
    @Transactional
    public Attendance processDailyQrScan(String qrToken, String memberId) {
        String today = LocalDate.now().toString();
        LocalDateTime now = LocalDateTime.now();

        // Step 1 — Validate token matches today's active QR
        DailyQrCode todayQr = dailyQrCodeRepository.findByDate(today)
                .orElseThrow(() -> new IllegalStateException(
                        "No QR code has been generated for today yet. Please ask the gym staff to generate today's QR code."));

        if (!todayQr.isActive() || !todayQr.getQrToken().equals(qrToken)) {
            throw new IllegalStateException(
                    "QR code is expired or invalid. Please scan the current daily QR code displayed at the front desk.");
        }

        // Step 2 — Validate member exists and membership is active
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found: " + memberId));

        if ("Paused".equalsIgnoreCase(member.getStatus())) {
            throw new IllegalStateException(
                    "Check-in Blocked: Your membership is currently Paused/Frozen. Please resume at the front desk.");
        }

        if ("Expired".equalsIgnoreCase(member.getStatus())) {
            throw new IllegalStateException(
                    "Check-in Blocked: Your membership has expired. Please renew your plan to check in.");
        }

        // Also check actual expiry date in membership record
        Optional<Membership> msOpt = membershipRepository.findTopByMemberIdOrderByStartDateDesc(memberId);
        if (msOpt.isPresent()) {
            Membership ms = msOpt.get();
            if (ms.getExpiryDate() != null) {
                try {
                    LocalDate exp = LocalDate.parse(ms.getExpiryDate());
                    if (exp.isBefore(LocalDate.now())) {
                        member.setStatus("Expired");
                        memberRepository.save(member);
                        throw new IllegalStateException(
                                "Check-in Blocked: Your membership expired on " + ms.getExpiryDate() +
                                ". Please renew your plan to check in.");
                    }
                } catch (IllegalStateException e) {
                    throw e;
                } catch (Exception ignored) {}
            }
        }

        // Step 3 — Prevent duplicate check-in for same day
        if (attendanceRepository.existsByMemberIdAndCheckInDate(memberId, today)) {
            throw new IllegalStateException(
                    "Already checked in today! You have already marked attendance for today (" + today + ").");
        }

        // Step 4 — Save attendance, update streak, auto-resolve no-show case
        // Fair Streak Calculation
        int currentStreak = member.getStreakCount();
        String lastVisit = member.getLastVisitDate();
        LocalDate todayDate = LocalDate.now();

        if (lastVisit == null) {
            currentStreak = 1;
        } else {
            try {
                LocalDate lastDate = LocalDate.parse(lastVisit);
                long daysGap = ChronoUnit.DAYS.between(lastDate, todayDate);
                if (daysGap == 0) {
                    // Same day — keep streak (shouldn't reach here due to duplicate check but be safe)
                } else if (daysGap <= 2) {
                    // Consecutive or 1 rest day (fair streak)
                    currentStreak += 1;
                } else {
                    currentStreak = 1;
                }
            } catch (Exception e) {
                currentStreak = 1;
            }
        }

        member.setStreakCount(currentStreak);
        member.setLastVisitDate(today);
        memberRepository.save(member);

        Attendance attendance = new Attendance(
                member.getId(),
                member.getName(),
                now,
                today,
                "DAILY_QR",
                null
        );
        attendance.setQrTokenUsed(qrToken);
        Attendance saved = attendanceRepository.save(attendance);

        // Auto-resolve No-Show Case if open
        Optional<NoShowCase> openCaseOpt = noShowCaseRepository.findByMemberIdAndStatusIn(
                memberId, Arrays.asList("Open", "Contacted"));
        if (openCaseOpt.isPresent()) {
            NoShowCase noShowCase = openCaseOpt.get();
            noShowCase.setStatus("Returned");
            noShowCase.setOutcome("Member returned to gym via Daily QR Scan");
            noShowCase.setNotes("Auto-resolved on check-in via QR scan on " + today);
            noShowCase.setUpdatedAt(now);
            noShowCaseRepository.save(noShowCase);
            log.info("No-Show case auto-resolved for member {} via Daily QR Scan.", member.getName());
        }

        log.info("Daily QR check-in success: {} ({}) | Streak: {} | Date: {}",
                member.getName(), member.getMemberCode(), currentStreak, today);

        return saved;
    }

    /**
     * Get all attendance records for today (for admin dashboard).
     */
    public List<Attendance> getTodayAttendance() {
        return attendanceRepository.findByCheckInDateOrderByCheckInTimeDesc(LocalDate.now().toString());
    }
}
