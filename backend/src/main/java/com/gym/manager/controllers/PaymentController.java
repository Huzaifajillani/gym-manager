package com.gym.manager.controllers;

import com.gym.manager.dto.MarkPaidRequest;
import com.gym.manager.models.Payment;
import com.gym.manager.services.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    public ResponseEntity<List<Payment>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPayments());
    }

    @GetMapping("/member/{memberId}")
    public ResponseEntity<List<Payment>> getMemberPayments(@PathVariable String memberId) {
        return ResponseEntity.ok(paymentService.getMemberPayments(memberId));
    }

    @PostMapping("/mark-paid/{memberId}")
    public ResponseEntity<?> markCashOrUpiPaid(@PathVariable String memberId,
                                              @RequestBody(required = false) MarkPaidRequest request) {
        try {
            if (request == null) request = new MarkPaidRequest();
            Payment payment = paymentService.markCashOrUpiPaid(memberId, request);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Payment marked as Paid successfully.",
                    "payment", payment
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
