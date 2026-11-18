package com.gym.manager.services;

import com.gym.manager.dto.PauseMembershipRequest;
import com.gym.manager.dto.RegisterMemberRequest;
import com.gym.manager.models.Member;
import com.gym.manager.models.Membership;
import com.gym.manager.models.Plan;
import com.gym.manager.repositories.AttendanceRepository;
import com.gym.manager.repositories.MemberRepository;
import com.gym.manager.repositories.MembershipRepository;
import com.gym.manager.repositories.PlanRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.*;

@Service
public class MemberService {

    private static final Logger log = LoggerFactory.getLogger(MemberService.class);

    private final MemberRepository memberRepository;
    private final MembershipRepository membershipRepository;
    private final PlanRepository planRepository;
    private final AttendanceRepository attendanceRepository;
    private final PasswordEncoder passwordEncoder;

    public MemberService(MemberRepository memberRepository,
                         MembershipRepository membershipRepository,
                         PlanRepository planRepository,
                         AttendanceRepository attendanceRepository,
                         PasswordEncoder passwordEncoder) {
        this.memberRepository = memberRepository;
        this.membershipRepository = membershipRepository;
        this.planRepository = planRepository;
        this.attendanceRepository = attendanceRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<Map<String, Object>> getAllMembersWithMembership(String statusFilter, String search) {
        List<Member> members = memberRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Member m : members) {
            if ("ROLE_ADMIN".equals(m.getRole())) continue;

            Optional<Membership> msOpt = membershipRepository.findTopByMemberIdOrderByStartDateDesc(m.getId());
            String paymentStatus = msOpt.map(Membership::getPaymentStatus).orElse("Pending");
            String expiryDate = msOpt.map(Membership::getExpiryDate).orElse("N/A");
            String planName = msOpt.map(Membership::getPlanName).orElse("N/A");

            // Check if status is dynamically expired based on date
            String currentStatus = m.getStatus();
            if ("Active".equalsIgnoreCase(currentStatus) && !"N/A".equals(expiryDate)) {
                try {
                    LocalDate exp = LocalDate.parse(expiryDate);
                    if (exp.isBefore(LocalDate.now())) {
                        currentStatus = "Expired";
                    }
                } catch (Exception ignored) {}
            }

            // Filtering
            if (StringUtils.hasText(statusFilter) && !"All".equalsIgnoreCase(statusFilter)) {
                if ("Pending Payment".equalsIgnoreCase(statusFilter)) {
                    if (!"Pending".equalsIgnoreCase(paymentStatus)) continue;
                } else if (!statusFilter.equalsIgnoreCase(currentStatus)) {
                    continue;
                }
            }

            // Searching
            if (StringUtils.hasText(search)) {
                String q = search.toLowerCase();
                boolean matches = (m.getName() != null && m.getName().toLowerCase().contains(q)) ||
                                  (m.getPhone() != null && m.getPhone().contains(q)) ||
                                  (m.getEmail() != null && m.getEmail().toLowerCase().contains(q)) ||
                                  (m.getMemberCode() != null && m.getMemberCode().toLowerCase().contains(q));
                if (!matches) continue;
            }

            Map<String, Object> map = new HashMap<>();
            map.put("id", m.getId());
            map.put("memberCode", m.getMemberCode());
            map.put("name", m.getName());
            map.put("phone", m.getPhone());
            map.put("email", m.getEmail());
            map.put("status", currentStatus);
            map.put("consentGiven", m.isConsentGiven());
            map.put("streakCount", m.getStreakCount());
            map.put("weeklyGoal", m.getWeeklyGoal());
            map.put("lastVisitDate", m.getLastVisitDate());
            map.put("planName", planName);
            map.put("expiryDate", expiryDate);
            map.put("paymentStatus", paymentStatus);
            map.put("fee", msOpt.map(Membership::getFee).orElse(0.0));
            map.put("pauseReason", msOpt.map(Membership::getPauseReason).orElse(null));
            map.put("pauseStartDate", msOpt.map(Membership::getPauseStartDate).orElse(null));
            map.put("pauseEndDate", msOpt.map(Membership::getPauseEndDate).orElse(null));

            result.add(map);
        }

        return result;
    }

    public Map<String, Object> getMemberProfile(String memberId) {
        Member m = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found: " + memberId));

        Optional<Membership> msOpt = membershipRepository.findTopByMemberIdOrderByStartDateDesc(memberId);
        String expiryDate = msOpt.map(Membership::getExpiryDate).orElse(null);
        long daysRemaining = 0;
        String currentStatus = m.getStatus();

        if (expiryDate != null) {
            try {
                LocalDate exp = LocalDate.parse(expiryDate);
                daysRemaining = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), exp);
                if (daysRemaining < 0 && "Active".equalsIgnoreCase(currentStatus)) {
                    currentStatus = "Expired";
                }
            } catch (Exception ignored) {}
        }

        Map<String, Object> profile = new HashMap<>();
        profile.put("id", m.getId());
        profile.put("memberCode", m.getMemberCode());
        profile.put("name", m.getName());
        profile.put("phone", m.getPhone());
        profile.put("email", m.getEmail());
        profile.put("status", currentStatus);
        profile.put("consentGiven", m.isConsentGiven());
        profile.put("streakCount", m.getStreakCount());
        profile.put("weeklyGoal", m.getWeeklyGoal());
        profile.put("lastVisitDate", m.getLastVisitDate());
        profile.put("membership", msOpt.orElse(null));
        profile.put("daysRemaining", Math.max(0, daysRemaining));

        return profile;
    }

    @Transactional
    public Member registerWalkInMember(RegisterMemberRequest request) {
        if (!request.isConsentGiven()) {
            throw new IllegalArgumentException("WhatsApp and notification consent is mandatory for registration.");
        }

        if (!StringUtils.hasText(request.getName()) || !StringUtils.hasText(request.getPhone())) {
            throw new IllegalArgumentException("Full name and phone number are required.");
        }

        // Validate uniqueness of phone
        if (memberRepository.findByPhone(request.getPhone().trim()).isPresent()) {
            throw new IllegalArgumentException("A member with phone number " + request.getPhone() + " already exists.");
        }

        // Generate incremental Member Code
        String memberCode = generateNextMemberCode();

        // Default password if not provided
        String rawPassword = StringUtils.hasText(request.getPassword()) ? request.getPassword() : "member123";
        String encodedPassword = passwordEncoder.encode(rawPassword);

        String email = StringUtils.hasText(request.getEmail()) ? request.getEmail().trim().toLowerCase() :
                memberCode.toLowerCase() + "@gymmember.local";

        Member member = new Member(
                memberCode,
                request.getName().trim(),
                request.getPhone().trim(),
                email,
                encodedPassword,
                "ROLE_MEMBER",
                "Active",
                request.isConsentGiven()
        );
        member.setWeeklyGoal(request.getWeeklyGoal() > 0 ? request.getWeeklyGoal() : 4);
        Member savedMember = memberRepository.save(member);

        // Fetch plan details
        Plan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new IllegalArgumentException("Selected plan not found: " + request.getPlanId()));

        // Calculate accurate expiry date (handles month-end edge cases like Jan 31 + 1 mo = Feb 28)
        LocalDate startDate = StringUtils.hasText(request.getStartDate()) ?
                LocalDate.parse(request.getStartDate()) : LocalDate.now();

        LocalDate expiryDate = startDate.plusMonths(plan.getDurationMonths());

        double fee = request.getFee() > 0 ? request.getFee() : plan.getEffectivePrice();

        // Saved with payment_status: "Pending" per requirements
        Membership membership = new Membership(
                savedMember.getId(),
                plan.getId(),
                plan.getName(),
                fee,
                startDate.toString(),
                expiryDate.toString(),
                "Pending"
        );
        membershipRepository.save(membership);

        log.info("Registered new walk-in member {} ({}) with pending payment for plan {}",
                savedMember.getName(), savedMember.getMemberCode(), plan.getName());

        return savedMember;
    }

    @Transactional
    public void updateMemberDetails(String memberId, Map<String, Object> updates) {
        Member m = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found: " + memberId));

        if (updates.containsKey("name")) m.setName((String) updates.get("name"));
        if (updates.containsKey("phone")) m.setPhone((String) updates.get("phone"));
        if (updates.containsKey("email")) m.setEmail((String) updates.get("email"));
        if (updates.containsKey("weeklyGoal")) m.setWeeklyGoal(((Number) updates.get("weeklyGoal")).intValue());
        if (updates.containsKey("consentGiven")) m.setConsentGiven((Boolean) updates.get("consentGiven"));

        memberRepository.save(m);
    }

    @Transactional
    public void pauseMembership(String memberId, PauseMembershipRequest req) {
        Member m = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found: " + memberId));

        Membership ms = membershipRepository.findTopByMemberIdOrderByStartDateDesc(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Active membership not found"));

        m.setStatus("Paused");
        memberRepository.save(m);

        ms.setPauseReason(req.getReason());
        ms.setPauseStartDate(req.getStartDate());
        ms.setPauseEndDate(req.getEndDate());
        membershipRepository.save(ms);

        log.info("Membership paused for member {} until {}. Reason: {}", m.getName(), req.getEndDate(), req.getReason());
    }

    @Transactional
    public void resumeMembership(String memberId) {
        Member m = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found: " + memberId));

        Membership ms = membershipRepository.findTopByMemberIdOrderByStartDateDesc(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Membership not found"));

        m.setStatus("Active");
        memberRepository.save(m);

        ms.setPauseReason(null);
        ms.setPauseStartDate(null);
        ms.setPauseEndDate(null);
        membershipRepository.save(ms);

        log.info("Membership resumed for member {}", m.getName());
    }

    @Transactional
    public void deleteMember(String memberId) {
        memberRepository.deleteById(memberId);
        List<Membership> memberships = membershipRepository.findByMemberId(memberId);
        membershipRepository.deleteAll(memberships);
        log.info("Deleted member {}", memberId);
    }

    public void updateConsent(String memberId, boolean consent) {
        Member m = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found: " + memberId));
        m.setConsentGiven(consent);
        memberRepository.save(m);
        log.info("Updated notification consent for {}: {}", m.getName(), consent);
    }

    private synchronized String generateNextMemberCode() {
        long count = memberRepository.count();
        return String.format("GYM-%03d", count + 1);
    }
}
