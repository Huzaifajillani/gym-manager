package com.gym.manager.services;

import com.gym.manager.dto.RedListFollowUpRequest;
import com.gym.manager.models.Member;
import com.gym.manager.models.Membership;
import com.gym.manager.models.NoShowCase;
import com.gym.manager.repositories.MemberRepository;
import com.gym.manager.repositories.MembershipRepository;
import com.gym.manager.repositories.NoShowCaseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class RedListService {

    private static final Logger log = LoggerFactory.getLogger(RedListService.class);

    private final MemberRepository memberRepository;
    private final MembershipRepository membershipRepository;
    private final NoShowCaseRepository noShowCaseRepository;
    private final NotificationService notificationService;

    public RedListService(MemberRepository memberRepository,
                          MembershipRepository membershipRepository,
                          NoShowCaseRepository noShowCaseRepository,
                          NotificationService notificationService) {
        this.memberRepository = memberRepository;
        this.membershipRepository = membershipRepository;
        this.noShowCaseRepository = noShowCaseRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public int scanAndSyncNoShowCases() {
        LocalDate today = LocalDate.now();
        List<Member> activeMembers = memberRepository.findByStatus("Active");
        int newOrUpdatedCases = 0;

        for (Member member : activeMembers) {
            if ("ROLE_ADMIN".equals(member.getRole())) continue;

            // Exclude members who are officially paused
            Optional<Membership> msOpt = membershipRepository.findTopByMemberIdOrderByStartDateDesc(member.getId());
            if (msOpt.isPresent() && StringUtils.hasText(msOpt.get().getPauseReason())) {
                continue;
            }

            // Exclude expired
            if (msOpt.isPresent() && msOpt.get().getExpiryDate() != null) {
                try {
                    LocalDate exp = LocalDate.parse(msOpt.get().getExpiryDate());
                    if (exp.isBefore(today)) {
                        continue;
                    }
                } catch (Exception ignored) {}
            }

            // Calculate absent days
            LocalDate lastVisit = null;
            if (member.getLastVisitDate() != null) {
                try {
                    lastVisit = LocalDate.parse(member.getLastVisitDate());
                } catch (Exception ignored) {}
            } else if (member.getCreatedAt() != null) {
                lastVisit = member.getCreatedAt().toLocalDate();
            }

            if (lastVisit == null) continue;

            long absentDays = ChronoUnit.DAYS.between(lastVisit, today);
            if (absentDays >= 10) {
                Optional<NoShowCase> existingCaseOpt = noShowCaseRepository.findByMemberId(member.getId());
                NoShowCase noShowCase;
                if (existingCaseOpt.isPresent()) {
                    noShowCase = existingCaseOpt.get();
                    if (!"Returned".equalsIgnoreCase(noShowCase.getStatus())) {
                        noShowCase.setAbsentDays(absentDays);
                        noShowCase.setUpdatedAt(LocalDateTime.now());
                        noShowCaseRepository.save(noShowCase);
                        newOrUpdatedCases++;
                    }
                } else {
                    noShowCase = new NoShowCase(
                            member.getId(),
                            member.getName(),
                            member.getPhone(),
                            absentDays,
                            "Open"
                    );
                    noShowCaseRepository.save(noShowCase);
                    newOrUpdatedCases++;
                }
            }
        }

        log.info("Completed No-Show Red-List scan. Processed {} cases.", newOrUpdatedCases);
        return newOrUpdatedCases;
    }

    public List<Map<String, Object>> getRedListCases(String rangeFilter) {
        // First sync cases
        scanAndSyncNoShowCases();

        List<NoShowCase> cases = noShowCaseRepository.findByStatusIn(Arrays.asList("Open", "Contacted"));
        List<Map<String, Object>> result = new ArrayList<>();

        for (NoShowCase c : cases) {
            long days = c.getAbsentDays();

            // Filter logic: 10-14 days, 15-21 days, 22+ days
            if ("10-14".equals(rangeFilter) && (days < 10 || days > 14)) continue;
            if ("15-21".equals(rangeFilter) && (days < 15 || days > 21)) continue;
            if ("22+".equals(rangeFilter) && days < 22) continue;

            Optional<Member> memberOpt = memberRepository.findById(c.getMemberId());
            Optional<Membership> msOpt = membershipRepository.findTopByMemberIdOrderByStartDateDesc(c.getMemberId());

            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("memberId", c.getMemberId());
            map.put("memberName", c.getMemberName());
            map.put("phone", c.getPhone());
            map.put("absentDays", c.getAbsentDays());
            map.put("status", c.getStatus());
            map.put("outcome", c.getOutcome());
            map.put("notes", c.getNotes());
            map.put("nextActionDate", c.getNextActionDate());
            map.put("updatedAt", c.getUpdatedAt());
            map.put("planName", msOpt.map(Membership::getPlanName).orElse("Standard"));
            map.put("lastVisitDate", memberOpt.map(Member::getLastVisitDate).orElse("Never"));
            map.put("consentGiven", memberOpt.map(Member::isConsentGiven).orElse(false));

            result.add(map);
        }

        // Sort by absent days descending (highest risk first)
        result.sort((a, b) -> Long.compare((Long) b.get("absentDays"), (Long) a.get("absentDays")));

        return result;
    }

    @Transactional
    public NoShowCase logFollowUp(String caseId, RedListFollowUpRequest req) {
        NoShowCase noShowCase = noShowCaseRepository.findById(caseId)
                .orElseThrow(() -> new IllegalArgumentException("No-Show case not found: " + caseId));

        noShowCase.setOutcome(req.getOutcome());
        noShowCase.setNextActionDate(req.getNextActionDate());
        noShowCase.setNotes(req.getNotes());
        noShowCase.setUpdatedAt(LocalDateTime.now());

        if ("Cancelled".equalsIgnoreCase(req.getOutcome())) {
            noShowCase.setStatus("Closed");
            // Mark member cancelled
            memberRepository.findById(noShowCase.getMemberId()).ifPresent(m -> {
                m.setStatus("Cancelled");
                memberRepository.save(m);
            });
        } else {
            noShowCase.setStatus("Contacted");
        }

        NoShowCase saved = noShowCaseRepository.save(noShowCase);
        log.info("Logged follow-up outcome '{}' for case {} (Member: {})",
                req.getOutcome(), caseId, noShowCase.getMemberName());
        return saved;
    }

    public boolean triggerWhatsAppReminder(String caseId) {
        NoShowCase noShowCase = noShowCaseRepository.findById(caseId)
                .orElseThrow(() -> new IllegalArgumentException("No-Show case not found: " + caseId));

        Member member = memberRepository.findById(noShowCase.getMemberId())
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));

        boolean sent = notificationService.sendRedListReminder(
                noShowCase.getPhone(),
                noShowCase.getMemberName(),
                noShowCase.getAbsentDays(),
                member.isConsentGiven()
        );

        if (sent) {
            noShowCase.setStatus("Contacted");
            noShowCase.setNotes("WhatsApp reminder template sent automatically on " + LocalDate.now());
            noShowCase.setUpdatedAt(LocalDateTime.now());
            noShowCaseRepository.save(noShowCase);
        }

        return sent;
    }
}
