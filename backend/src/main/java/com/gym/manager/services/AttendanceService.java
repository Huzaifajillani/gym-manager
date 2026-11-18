package com.gym.manager.services;

import com.gym.manager.models.Attendance;
import com.gym.manager.models.Member;
import com.gym.manager.models.Membership;
import com.gym.manager.models.NoShowCase;
import com.gym.manager.repositories.AttendanceRepository;
import com.gym.manager.repositories.MemberRepository;
import com.gym.manager.repositories.MembershipRepository;
import com.gym.manager.repositories.NoShowCaseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class AttendanceService {

    private static final Logger log = LoggerFactory.getLogger(AttendanceService.class);

    private final AttendanceRepository attendanceRepository;
    private final MemberRepository memberRepository;
    private final MembershipRepository membershipRepository;
    private final NoShowCaseRepository noShowCaseRepository;

    public AttendanceService(AttendanceRepository attendanceRepository,
                             MemberRepository memberRepository,
                             MembershipRepository membershipRepository,
                             NoShowCaseRepository noShowCaseRepository) {
        this.attendanceRepository = attendanceRepository;
        this.memberRepository = memberRepository;
        this.membershipRepository = membershipRepository;
        this.noShowCaseRepository = noShowCaseRepository;
    }

    public List<Attendance> getMemberAttendance(String memberId) {
        return attendanceRepository.findByMemberIdOrderByCheckInTimeDesc(memberId);
    }

    public List<Attendance> getRecentCheckIns() {
        return attendanceRepository.findTop20ByOrderByCheckInTimeDesc();
    }

    public long getTodayCheckInCount() {
        return attendanceRepository.countByCheckInDate(LocalDate.now().toString());
    }

    @Transactional
    public Attendance processQrCheckIn(String memberId) {
        return recordCheckIn(memberId, "QR_SCAN", null);
    }

    @Transactional
    public Attendance processAssistedCheckIn(String memberId, String reason) {
        if (!StringUtils.hasText(reason)) {
            throw new IllegalArgumentException("A mandatory staff reason is required for assisted check-in.");
        }
        return recordCheckIn(memberId, "ASSISTED", reason);
    }

    private Attendance recordCheckIn(String memberId, String source, String assistedReason) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found: " + memberId));

        // 1. Verify Membership Status
        if ("Paused".equalsIgnoreCase(member.getStatus())) {
            throw new IllegalStateException("Check-in Blocked: Membership is currently Paused/Frozen. Please resume membership at the front desk.");
        }

        Optional<Membership> msOpt = membershipRepository.findTopByMemberIdOrderByStartDateDesc(memberId);
        if (msOpt.isPresent()) {
            Membership ms = msOpt.get();
            if (ms.getExpiryDate() != null) {
                try {
                    LocalDate exp = LocalDate.parse(ms.getExpiryDate());
                    if (exp.isBefore(LocalDate.now())) {
                        member.setStatus("Expired");
                        memberRepository.save(member);
                        throw new IllegalStateException("Check-in Blocked: Membership expired on " + ms.getExpiryDate() + ". Please renew your plan.");
                    }
                } catch (IllegalArgumentException e) {
                    throw e;
                } catch (Exception ignored) {}
            }
        }

        if ("Expired".equalsIgnoreCase(member.getStatus())) {
            throw new IllegalStateException("Check-in Blocked: Membership has expired. Please renew to check in.");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDate today = LocalDate.now();

        // 2. Duplicate Scan Protection (Minimum 2 hours between check-ins)
        Optional<Attendance> lastAttendanceOpt = attendanceRepository.findTopByMemberIdOrderByCheckInTimeDesc(memberId);
        if (lastAttendanceOpt.isPresent()) {
            Attendance last = lastAttendanceOpt.get();
            if (last.getCheckInTime() != null) {
                long minutesSinceLastCheckIn = Duration.between(last.getCheckInTime(), now).toMinutes();
                if (minutesSinceLastCheckIn < 120) {
                    long minutesRemaining = 120 - minutesSinceLastCheckIn;
                    String formattedLastTime = last.getCheckInTime().format(DateTimeFormatter.ofPattern("hh:mm a"));
                    throw new IllegalStateException(String.format(
                            "Duplicate scan blocked: You already checked in at %s. Please wait %d more minutes before checking in again.",
                            formattedLastTime, minutesRemaining));
                }
            }
        }

        // 3. Fair Streak Calculation (Allows 1 rest day without resetting streak)
        int currentStreak = member.getStreakCount();
        String lastVisit = member.getLastVisitDate();

        if (lastVisit == null) {
            currentStreak = 1;
        } else {
            try {
                LocalDate lastDate = LocalDate.parse(lastVisit);
                long daysGap = ChronoUnit.DAYS.between(lastDate, today);
                if (daysGap == 0) {
                    // Same day subsequent check-in (after 2h), keep streak
                } else if (daysGap == 1) {
                    // Consecutive day
                    currentStreak += 1;
                } else if (daysGap == 2) {
                    // 1 rest day in between (Fair Streak logic)
                    currentStreak += 1;
                } else {
                    // Missed more than 1 rest day, restart streak
                    currentStreak = 1;
                }
            } catch (Exception e) {
                currentStreak = 1;
            }
        }

        member.setStreakCount(currentStreak);
        member.setLastVisitDate(today.toString());
        memberRepository.save(member);

        // 4. Save Attendance
        Attendance attendance = new Attendance(
                member.getId(),
                member.getName(),
                now,
                today.toString(),
                source,
                assistedReason
        );
        Attendance saved = attendanceRepository.save(attendance);

        // 5. Auto-resolve No-Show Case if open/contacted
        Optional<NoShowCase> openCaseOpt = noShowCaseRepository.findByMemberIdAndStatusIn(
                memberId, Arrays.asList("Open", "Contacted"));
        if (openCaseOpt.isPresent()) {
            NoShowCase noShowCase = openCaseOpt.get();
            noShowCase.setStatus("Returned");
            noShowCase.setOutcome("Member returned to gym via " + source.replace("_", " "));
            noShowCase.setNotes("Auto-resolved automatically upon check-in on " + today);
            noShowCase.setUpdatedAt(now);
            noShowCaseRepository.save(noShowCase);
            log.info("No-Show case auto-resolved for member {} upon check-in.", member.getName());
        }

        log.info("Check-in successful for {} ({}) via {}. Current streak: {}",
                member.getName(), member.getMemberCode(), source, currentStreak);

        return saved;
    }
}
