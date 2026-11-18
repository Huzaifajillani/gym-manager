package com.gym.manager.dto;

public class RenewalRequest {
    private String planId;
    private String paymentMode; // ONLINE, UPI, CASH
    private String transactionRef;

    public RenewalRequest() {}

    public RenewalRequest(String planId, String paymentMode, String transactionRef) {
        this.planId = planId;
        this.paymentMode = paymentMode;
        this.transactionRef = transactionRef;
    }

    public String getPlanId() { return planId; }
    public void setPlanId(String planId) { this.planId = planId; }

    public String getPaymentMode() { return paymentMode; }
    public void setPaymentMode(String paymentMode) { this.paymentMode = paymentMode; }

    public String getTransactionRef() { return transactionRef; }
    public void setTransactionRef(String transactionRef) { this.transactionRef = transactionRef; }
}
