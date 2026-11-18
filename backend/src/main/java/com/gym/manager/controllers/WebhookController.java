package com.gym.manager.controllers;

import com.gym.manager.dto.WebhookPaymentRequest;
import com.gym.manager.services.NotificationService;
import com.gym.manager.services.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/webhooks")
public class WebhookController {

    private final PaymentService paymentService;
    private final NotificationService notificationService;

    public WebhookController(PaymentService paymentService, NotificationService notificationService) {
        this.paymentService = paymentService;
        this.notificationService = notificationService;
    }

    /**
     * Payment Gateway Webhook (Razorpay / Stripe)
     * Verifies mock signature and idempotently processes payment + membership extension
     */
    @PostMapping("/payment")
    public ResponseEntity<?> handlePaymentWebhook(@RequestBody WebhookPaymentRequest request) {
        try {
            Map<String, Object> result = paymentService.processPaymentWebhook(request);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Inspect recent WhatsApp Cloud API notifications (for UI testing & admin preview)
     */
    @GetMapping("/notifications")
    public ResponseEntity<List<Map<String, Object>>> getRecentNotifications() {
        return ResponseEntity.ok(notificationService.getRecentNotifications());
    }
}
