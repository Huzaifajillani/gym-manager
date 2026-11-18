package com.gym.manager.services;

import com.gym.manager.dto.MarkPaidRequest;
import com.gym.manager.dto.WebhookPaymentRequest;
import com.gym.manager.models.Member;
import com.gym.manager.models.Membership;
import com.gym.manager.models.Payment;
import com.gym.manager.models.Plan;
import com.gym.manager.repositories.MemberRepository;
import com.gym.manager.repositories.MembershipRepository;
import com.gym.manager.repositories.PaymentRepository;
import com.gym.manager.repositories.PlanRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final MembershipRepository membershipRepository;
    private final MemberRepository memberRepository;
    private final PlanRepository planRepository;
    private final NotificationService notificationService;

    public PaymentService(PaymentRepository paymentRepository,
                          MembershipRepository membershipRepository,
                          MemberRepository memberRepository,
                          PlanRepository planRepository,
                          NotificationService notificationService) {
        this.paymentRepository = paymentRepository;
        this.membershipRepository = membershipRepository;
        this.memberRepository = memberRepository;
        this.planRepository = planRepository;
        this.notificationService = notificationService;
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAllByOrderByPaymentDateDesc();
    }

    public List<Payment> getMemberPayments(String memberId) {
        return paymentRepository.findByMemberIdOrderByPaymentDateDesc(memberId);
    }

    @Transactional
    public Payment markCashOrUpiPaid(String memberId, MarkPaidRequest request) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found: " + memberId));

        Membership membership = membershipRepository.findTopByMemberIdOrderByStartDateDesc(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Membership record not found for member: " + memberId));

        String txnRef = "TXN-MANUAL-" + member.getMemberCode() + "-" + System.currentTimeMillis();
        String receiptId = generateReceiptId();

        LocalDate today = LocalDate.now();
        LocalDate baseDate = today;

        if (membership.getExpiryDate() != null) {
            try {
                LocalDate existingExpiry = LocalDate.parse(membership.getExpiryDate());
                if (existingExpiry.isAfter(today)) {
                    baseDate = existingExpiry;
                }
            } catch (Exception e) {
                baseDate = today;
            }
        }

        int durationMonths = 1;
        if (membership.getPlanId() != null) {
            Optional<Plan> planOpt = planRepository.findById(membership.getPlanId());
            if (planOpt.isPresent()) {
                durationMonths = planOpt.get().getDurationMonths();
            }
        }

        LocalDate newExpiry = baseDate.plusMonths(durationMonths);

        membership.setPaymentStatus("Paid");
        membership.setExpiryDate(newExpiry.toString());
        membershipRepository.save(membership);

        member.setStatus("Active");
        memberRepository.save(member);

        Payment payment = new Payment(
                member.getId(),
                member.getName(),
                membership.getFee(),
                request.getPaymentMode() != null ? request.getPaymentMode() : "CASH",
                "Paid",
                txnRef,
                receiptId,
                membership.getPlanName()
        );
        payment.setNotes(request.getNotes() != null ? request.getNotes() : "Marked Paid by front-desk");
        Payment saved = paymentRepository.save(payment);

        notificationService.sendPaymentReceiptWhatsApp(
                member.getPhone(),
                member.getName(),
                membership.getFee(),
                receiptId,
                newExpiry.toString(),
                member.isConsentGiven()
        );

        log.info("Payment marked Paid for member {} ({}). Receipt: {}. New Expiry: {}",
                member.getName(), member.getMemberCode(), receiptId, newExpiry);

        return saved;
    }

    @Transactional
    public Map<String, Object> processPaymentWebhook(WebhookPaymentRequest request) {
        Map<String, Object> response = new HashMap<>();

        Optional<Payment> existingPaymentOpt = paymentRepository.findByTransactionRef(request.getTransactionRef());
        if (existingPaymentOpt.isPresent()) {
            Payment existingPayment = existingPaymentOpt.get();
            log.info("Idempotent webhook call: Transaction {} already processed with status {}",
                    request.getTransactionRef(), existingPayment.getStatus());
            response.put("success", true);
            response.put("message", "Payment already processed (idempotent)");
            response.put("payment", existingPayment);
            return response;
        }

        Member member = memberRepository.findById(request.getMemberId())
                .orElseThrow(() -> new IllegalArgumentException("Member not found: " + request.getMemberId()));

        Plan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + request.getPlanId()));

        boolean isSuccess = "SUCCESS".equalsIgnoreCase(request.getStatus());
        String receiptId = isSuccess ? generateReceiptId() : null;

        Payment payment = new Payment(
                member.getId(),
                member.getName(),
                request.getAmount(),
                "SAFEPAY",
                isSuccess ? "Paid" : "Failed",
                request.getTransactionRef(),
                receiptId,
                plan.getName()
        );
        payment.setNotes("Safepay Gateway Webhook: " + (isSuccess ? "Verified" : "Verification Failed"));
        paymentRepository.save(payment);

        if (isSuccess) {
            LocalDate today = LocalDate.now();
            LocalDate baseDate = today;

            Optional<Membership> activeMembershipOpt = membershipRepository.findTopByMemberIdOrderByStartDateDesc(member.getId());
            if (activeMembershipOpt.isPresent()) {
                Membership activeMembership = activeMembershipOpt.get();
                if (activeMembership.getExpiryDate() != null) {
                    try {
                        LocalDate existingExpiry = LocalDate.parse(activeMembership.getExpiryDate());
                        if (existingExpiry.isAfter(today)) {
                            baseDate = existingExpiry;
                        }
                    } catch (Exception ignored) {}
                }
            }

            LocalDate newExpiry = baseDate.plusMonths(plan.getDurationMonths());

            Membership newMembership = new Membership(
                    member.getId(),
                    plan.getId(),
                    plan.getName(),
                    request.getAmount(),
                    today.toString(),
                    newExpiry.toString(),
                    "Paid"
            );
            membershipRepository.save(newMembership);

            member.setStatus("Active");
            memberRepository.save(member);

            notificationService.sendPaymentReceiptWhatsApp(
                    member.getPhone(),
                    member.getName(),
                    request.getAmount(),
                    receiptId,
                    newExpiry.toString(),
                    member.isConsentGiven()
            );

            response.put("success", true);
            response.put("message", "Membership successfully renewed via Safepay!");
            response.put("receiptId", receiptId);
            response.put("expiryDate", newExpiry.toString());
            response.put("planName", plan.getName());
        } else {
            response.put("success", false);
            response.put("message", "Safepay gateway reported failure or declined transaction.");
        }

        response.put("payment", payment);
        return response;
    }

    private String generateReceiptId() {
        String dateStr = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        int randomSuffix = 1000 + new Random().nextInt(9000);
        return "REC-" + dateStr + "-" + randomSuffix;
    }
}