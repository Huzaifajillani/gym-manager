package com.gym.manager.seeder;

import com.gym.manager.models.*;
import com.gym.manager.repositories.*;
import com.gym.manager.services.RedListService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final MemberRepository memberRepository;
    private final PlanRepository planRepository;
    private final MembershipRepository membershipRepository;
    private final AttendanceRepository attendanceRepository;
    private final NoShowCaseRepository noShowCaseRepository;
    private final PaymentRepository paymentRepository;
    private final AddonRepository addonRepository;
    private final AddonOrderRepository addonOrderRepository;
    private final PasswordEncoder passwordEncoder;
    private final RedListService redListService;

    public DataSeeder(MemberRepository memberRepository,
                      PlanRepository planRepository,
                      MembershipRepository membershipRepository,
                      AttendanceRepository attendanceRepository,
                      NoShowCaseRepository noShowCaseRepository,
                      PaymentRepository paymentRepository,
                      AddonRepository addonRepository,
                      AddonOrderRepository addonOrderRepository,
                      PasswordEncoder passwordEncoder,
                      RedListService redListService) {
        this.memberRepository = memberRepository;
        this.planRepository = planRepository;
        this.membershipRepository = membershipRepository;
        this.attendanceRepository = attendanceRepository;
        this.noShowCaseRepository = noShowCaseRepository;
        this.paymentRepository = paymentRepository;
        this.addonRepository = addonRepository;
        this.addonOrderRepository = addonOrderRepository;
        this.passwordEncoder = passwordEncoder;
        this.redListService = redListService;
    }

    @Override
    public void run(String... args) {
        if (memberRepository.count() > 0) {
            log.info("Database already seeded. Skipping DataSeeder.");
            return;
        }

        log.info("Starting DataSeeder: Populating realistic demo data...");

        // 1. Admin User
        Member admin = new Member(
                "ADMIN-001",
                "Alex Rivera (Owner & Staff)",
                "+19876543210",
                "admin@gym.com",
                passwordEncoder.encode("admin123"),
                "ROLE_ADMIN",
                "Active",
                true
        );
        memberRepository.save(admin);

        // 2. 4 Membership Plans
        Plan plan1 = new Plan("Monthly Starter", 1, 49.00, 0.00,
                Arrays.asList("Full Gym & Cardio Floor Access", "Standard Locker Room", "1 Intro Fitness Assessment"), true);
        Plan plan2 = new Plan("Quarterly Fitness Pro", 3, 129.00, 10.00,
                Arrays.asList("Full Gym & Cardio Floor Access", "Sauna & Steam Room", "1 Free 1-on-1 PT Session", "Free Water Bottle"), true);
        Plan plan3 = new Plan("Half-Yearly Prime", 6, 229.00, 30.00,
                Arrays.asList("All Floor & Spa Facilities", "3 Complimentary PT Sessions", "Customized Nutrition Guide", "2 Guest Passes / Month"), true);
        Plan plan4 = new Plan("Yearly Platinum Elite", 12, 399.00, 70.00,
                Arrays.asList("VIP 24/7 Gate Access", "Unlimited Sauna & Recovery Zone", "5 PT Sessions Included", "Free Supplement Starter Pack", "Unlimited Guest Passes"), true);

        plan1 = planRepository.save(plan1);
        plan2 = planRepository.save(plan2);
        plan3 = planRepository.save(plan3);
        plan4 = planRepository.save(plan4);

        // 3. 4 Add-ons
        Addon addon1 = new Addon("PT", "10x Elite Personal Training Sessions",
                "One-on-one progressive strength and hypertrophy coaching with certified fitness master.",
                249.00, 60, 15, "Marcus Vance", "NASM-CPT, CSCS Master Coach");

        Addon addon2 = new Addon("DIET", "30-Day Custom Keto / Macro Meal Plan",
                "Tailored caloric breakdown, weekly grocery list, and weekly check-in adjustments.",
                89.00, 30, 25, "Elena Rostova", "M.Sc. Sports Nutrition & Dietetics");

        Addon addon3 = new Addon("SUPPLEMENT", "Gold Standard 100% Whey Isolate 2kg",
                "Ultra-filtered whey protein isolate, 25g protein per scoop, rich chocolate peanut flavor.",
                69.99, 180, 40, "Gym Pro Shop", "Quality Assured Authentic Lab Tested");

        Addon addon4 = new Addon("SUPPLEMENT", "Ignite Pre-Workout Pump Matrix (30 Servings)",
                "Clinical doses of Citrulline Malate, Beta-Alanine, and clean caffeine energy.",
                39.99, 90, 30, "Gym Pro Shop", "Lab Tested High Purity");

        addonRepository.saveAll(Arrays.asList(addon1, addon2, addon3, addon4));

        LocalDate today = LocalDate.now();

        // 4. 15 Realistic Members
        // Member 1: Active, John Doe, regular visitor
        Member m1 = createMember("GYM-001", "John Doe", "+1555010001", "john@example.com", "Active", today.minusDays(1).toString(), 5, 4);
        createMembership(m1, plan3, today.minusMonths(2).toString(), today.plusMonths(4).toString(), "Paid");
        createPayment(m1, plan3.getName(), plan3.getEffectivePrice(), "ONLINE", "Paid", "REC-20261101-1101");

        // Member 2: Active, Sarah Connor, high streak
        Member m2 = createMember("GYM-002", "Sarah Connor", "+1555010002", "sarah@example.com", "Active", today.toString(), 14, 5);
        createMembership(m2, plan4, today.minusMonths(4).toString(), today.plusMonths(8).toString(), "Paid");
        createPayment(m2, plan4.getName(), plan4.getEffectivePrice(), "ONLINE", "Paid", "REC-20261015-1102");

        // Member 3: Expiring in 3 days!
        Member m3 = createMember("GYM-003", "Michael Scott", "+1555010003", "michael@example.com", "Active", today.minusDays(2).toString(), 2, 3);
        createMembership(m3, plan1, today.minusDays(27).toString(), today.plusDays(3).toString(), "Paid");
        createPayment(m3, plan1.getName(), plan1.getEffectivePrice(), "CASH", "Paid", "REC-20261020-1103");

        // Member 4: Expiring in 1 day!
        Member m4 = createMember("GYM-004", "Dwight Schrute", "+1555010004", "dwight@example.com", "Active", today.minusDays(1).toString(), 8, 5);
        createMembership(m4, plan2, today.minusMonths(3).plusDays(1).toString(), today.plusDays(1).toString(), "Paid");
        createPayment(m4, plan2.getName(), plan2.getEffectivePrice(), "UPI", "Paid", "REC-20260817-1104");

        // Member 5: Expired 5 days ago!
        Member m5 = createMember("GYM-005", "Jim Halpert", "+1555010005", "jim@example.com", "Expired", today.minusDays(8).toString(), 0, 3);
        createMembership(m5, plan1, today.minusDays(35).toString(), today.minusDays(5).toString(), "Paid");
        createPayment(m5, plan1.getName(), plan1.getEffectivePrice(), "ONLINE", "Paid", "REC-20261011-1105");

        // Member 6: Expired 12 days ago!
        Member m6 = createMember("GYM-006", "Pam Beesly", "+1555010006", "pam@example.com", "Expired", today.minusDays(14).toString(), 0, 3);
        createMembership(m6, plan2, today.minusMonths(3).minusDays(12).toString(), today.minusDays(12).toString(), "Paid");
        createPayment(m6, plan2.getName(), plan2.getEffectivePrice(), "ONLINE", "Paid", "REC-20260715-1106");

        // 5 Red-List Members (Absent 10-18 days)
        // Member 7: Absent 11 days (10-14 days group)
        Member m7 = createMember("GYM-007", "Stanley Hudson", "+1555010007", "stanley@example.com", "Active", today.minusDays(11).toString(), 0, 2);
        createMembership(m7, plan3, today.minusMonths(2).toString(), today.plusMonths(4).toString(), "Paid");
        createPayment(m7, plan3.getName(), plan3.getEffectivePrice(), "CASH", "Paid", "REC-20260910-1107");

        // Member 8: Absent 13 days (10-14 days group)
        Member m8 = createMember("GYM-008", "Kevin Malone", "+1555010008", "kevin@example.com", "Active", today.minusDays(13).toString(), 0, 3);
        createMembership(m8, plan2, today.minusMonths(1).toString(), today.plusMonths(2).toString(), "Paid");
        createPayment(m8, plan2.getName(), plan2.getEffectivePrice(), "UPI", "Paid", "REC-20261005-1108");

        // Member 9: Absent 16 days (15-21 days group)
        Member m9 = createMember("GYM-009", "Angela Martin", "+1555010009", "angela@example.com", "Active", today.minusDays(16).toString(), 0, 4);
        createMembership(m9, plan3, today.minusMonths(3).toString(), today.plusMonths(3).toString(), "Paid");
        createPayment(m9, plan3.getName(), plan3.getEffectivePrice(), "ONLINE", "Paid", "REC-20260816-1109");

        // Member 10: Absent 18 days (15-21 days group)
        Member m10 = createMember("GYM-010", "Andy Bernard", "+1555010010", "andy@example.com", "Active", today.minusDays(18).toString(), 0, 3);
        createMembership(m10, plan4, today.minusMonths(5).toString(), today.plusMonths(7).toString(), "Paid");
        createPayment(m10, plan4.getName(), plan4.getEffectivePrice(), "ONLINE", "Paid", "REC-20260620-1110");

        // Member 11: Absent 24 days (22+ days group)
        Member m11 = createMember("GYM-011", "Kelly Kapoor", "+1555010011", "kelly@example.com", "Active", today.minusDays(24).toString(), 0, 2);
        createMembership(m11, plan2, today.minusMonths(2).toString(), today.plusMonths(1).toString(), "Paid");
        createPayment(m11, plan2.getName(), plan2.getEffectivePrice(), "UPI", "Paid", "REC-20260924-1111");

        // Member 12: Paused (Medical - knee surgery)
        Member m12 = createMember("GYM-012", "Toby Flenderson", "+1555010012", "toby@example.com", "Paused", today.minusDays(30).toString(), 0, 3);
        Membership ms12 = createMembership(m12, plan3, today.minusMonths(2).toString(), today.plusMonths(4).toString(), "Paid");
        ms12.setPauseReason("Medical: Knee arthroscopy recovery");
        ms12.setPauseStartDate(today.minusDays(10).toString());
        ms12.setPauseEndDate(today.plusDays(20).toString());
        membershipRepository.save(ms12);

        // Member 13: Pending Payment (Walked in front-desk registration)
        Member m13 = createMember("GYM-013", "Ryan Howard", "+1555010013", "ryan@example.com", "Active", null, 0, 4);
        createMembership(m13, plan1, today.toString(), today.plusMonths(1).toString(), "Pending");

        // Member 14: Creed Bratton (Active)
        Member m14 = createMember("GYM-014", "Creed Bratton", "+1555010014", "creed@example.com", "Active", today.minusDays(2).toString(), 3, 3);
        createMembership(m14, plan1, today.minusDays(10).toString(), today.plusDays(20).toString(), "Paid");

        // Member 15: Oscar Martinez (Active)
        Member m15 = createMember("GYM-015", "Oscar Martinez", "+1555010015", "oscar@example.com", "Active", today.minusDays(1).toString(), 7, 4);
        createMembership(m15, plan3, today.minusMonths(1).toString(), today.plusMonths(5).toString(), "Paid");

        // 5. Sample Attendance Logs
        attendanceRepository.save(new Attendance(m1.getId(), m1.getName(), LocalDateTime.now().minusHours(3), today.toString(), "QR_SCAN", null));
        attendanceRepository.save(new Attendance(m2.getId(), m2.getName(), LocalDateTime.now().minusHours(1), today.toString(), "QR_SCAN", null));
        attendanceRepository.save(new Attendance(m14.getId(), m14.getName(), LocalDateTime.now().minusHours(5), today.toString(), "ASSISTED", "Forgot NFC phone card"));
        attendanceRepository.save(new Attendance(m1.getId(), m1.getName(), LocalDateTime.now().minusDays(1).withHour(18).withMinute(30), today.minusDays(1).toString(), "QR_SCAN", null));
        attendanceRepository.save(new Attendance(m2.getId(), m2.getName(), LocalDateTime.now().minusDays(1).withHour(7).withMinute(15), today.minusDays(1).toString(), "QR_SCAN", null));
        attendanceRepository.save(new Attendance(m4.getId(), m4.getName(), LocalDateTime.now().minusDays(1).withHour(19).withMinute(0), today.minusDays(1).toString(), "QR_SCAN", null));
        attendanceRepository.save(new Attendance(m15.getId(), m15.getName(), LocalDateTime.now().minusDays(1).withHour(8).withMinute(45), today.minusDays(1).toString(), "QR_SCAN", null));

        // 6. Member 1 Addon Order (Marcus Vance PT Session)
        AddonOrder order = new AddonOrder(m1.getId(), addon1.getId(), addon1.getTitle(), addon1.getCategory(), addon1.getPrice(), "Active", 10, 8);
        addonOrderRepository.save(order);

        // 7. Initial scan to populate NoShowCases
        redListService.scanAndSyncNoShowCases();

        log.info("DataSeeder completed successfully. 1 Admin, 4 Plans, 4 Addons, 15 Members and No-Show cases initialized.");
    }

    private Member createMember(String code, String name, String phone, String email, String status, String lastVisit, int streak, int goal) {
        Member m = new Member(code, name, phone, email, passwordEncoder.encode("member123"), "ROLE_MEMBER", status, true);
        m.setLastVisitDate(lastVisit);
        m.setStreakCount(streak);
        m.setWeeklyGoal(goal);
        return memberRepository.save(m);
    }

    private Membership createMembership(Member member, Plan plan, String start, String expiry, String paymentStatus) {
        Membership ms = new Membership(member.getId(), plan.getId(), plan.getName(), plan.getEffectivePrice(), start, expiry, paymentStatus);
        return membershipRepository.save(ms);
    }

    private Payment createPayment(Member member, String planName, double amount, String mode, String status, String receiptId) {
        Payment p = new Payment(member.getId(), member.getName(), amount, mode, status, "TXN-" + System.nanoTime(), receiptId, planName);
        return paymentRepository.save(p);
    }
}
