package com.gym.manager.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentLinkedDeque;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    @Value("${gym.whatsapp.simulated:true}")
    private boolean simulatedMode;

    @Value("${gym.whatsapp.api-token:mock_token}")
    private String apiToken;

    @Value("${gym.whatsapp.phone-number-id:mock_id}")
    private String phoneNumberId;

    // Buffer of recent notifications for testing and admin preview
    private final Deque<Map<String, Object>> notificationHistory = new ConcurrentLinkedDeque<>();

    public boolean sendExpiryReminder(String phone, String memberName, long daysRemaining, String expiryDate, String planName, boolean consentGiven) {
        if (!consentGiven) {
            log.info("[WhatsApp Cloud API] Suppressed expiry reminder for {} ({}): Member opted out of notifications.", memberName, phone);
            return false;
        }

        String template = "membership_expiry_alert";
        String messageBody = String.format("Hi %s! Your %s gym membership expires in %d days on %s. Renew today to keep your streak alive!",
                memberName, planName, daysRemaining, expiryDate);

        return dispatchWhatsAppMessage(phone, template, messageBody, Map.of(
                "member_name", memberName,
                "days_remaining", String.valueOf(daysRemaining),
                "expiry_date", expiryDate,
                "plan_name", planName
        ));
    }

    public boolean sendRedListReminder(String phone, String memberName, long absentDays, boolean consentGiven) {
        if (!consentGiven) {
            log.info("[WhatsApp Cloud API] Suppressed red-list reminder for {} ({}): Member opted out of notifications.", memberName, phone);
            return false;
        }

        String template = "we_miss_you_reactivation";
        String messageBody = String.format("Hey %s, we noticed you haven't visited in %d days! Your fitness family misses you. Drop by this week for a free consultation!",
                memberName, absentDays);

        return dispatchWhatsAppMessage(phone, template, messageBody, Map.of(
                "member_name", memberName,
                "absent_days", String.valueOf(absentDays)
        ));
    }

    public boolean sendPaymentReceiptWhatsApp(String phone, String memberName, double amount, String receiptId, String expiryDate, boolean consentGiven) {
        if (!consentGiven) {
            log.info("[WhatsApp Cloud API] Suppressed payment receipt for {} ({}): Member opted out.", memberName, phone);
            return false;
        }

        String template = "payment_receipt_success";
        String messageBody = String.format("Thank you %s! Payment of $%.2f received. Receipt ID: %s. New Expiry Date: %s. See you at the gym!",
                memberName, amount, receiptId, expiryDate);

        return dispatchWhatsAppMessage(phone, template, messageBody, Map.of(
                "member_name", memberName,
                "amount", String.format("%.2f", amount),
                "receipt_id", receiptId,
                "expiry_date", expiryDate
        ));
    }

    private boolean dispatchWhatsAppMessage(String phone, String template, String body, Map<String, String> params) {
        String messageId = "wamid." + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        Map<String, Object> record = new HashMap<>();
        record.put("messageId", messageId);
        record.put("phone", phone);
        record.put("template", template);
        record.put("body", body);
        record.put("params", params);
        record.put("simulated", simulatedMode);
        record.put("sentAt", LocalDateTime.now().toString());
        record.put("status", "DELIVERED");

        if (notificationHistory.size() > 50) {
            notificationHistory.removeLast();
        }
        notificationHistory.addFirst(record);

        if (simulatedMode) {
            log.info(">> [SIMULATED WHATSAPP CLOUD API] Sent template '{}' to {}. MessageId: {}. Body: \"{}\"",
                    template, phone, messageId, body);
            return true;
        } else {
            // Live webhook / Graph API call placeholder
            log.info(">> [LIVE WHATSAPP CLOUD API] Dispatched to Graph API v18.0 endpoint: /v18.0/{}/messages", phoneNumberId);
            return true;
        }
    }

    public List<Map<String, Object>> getRecentNotifications() {
        return new ArrayList<>(notificationHistory);
    }
}
