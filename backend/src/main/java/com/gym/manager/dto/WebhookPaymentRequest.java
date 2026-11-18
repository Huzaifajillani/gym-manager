package com.gym.manager.dto;

public class WebhookPaymentRequest {
    private String transactionRef;
    private String memberId;
    private String planId;
    private double amount;
    private String status; // SUCCESS, FAILED
    private String signature; // Simulated razorpay/stripe signature

    public WebhookPaymentRequest() {}

    public WebhookPaymentRequest(String transactionRef, String memberId, String planId, double amount, String status, String signature) {
        this.transactionRef = transactionRef;
        this.memberId = memberId;
        this.planId = planId;
        this.amount = amount;
        this.status = status;
        this.signature = signature;
    }

    public String getTransactionRef() { return transactionRef; }
    public void setTransactionRef(String transactionRef) { this.transactionRef = transactionRef; }

    public String getMemberId() { return memberId; }
    public void setMemberId(String memberId) { this.memberId = memberId; }

    public String getPlanId() { return planId; }
    public void setPlanId(String planId) { this.planId = planId; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getSignature() { return signature; }
    public void setSignature(String signature) { this.signature = signature; }
}
