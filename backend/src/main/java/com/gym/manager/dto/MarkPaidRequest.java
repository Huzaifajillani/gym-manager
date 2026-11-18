package com.gym.manager.dto;

public class MarkPaidRequest {
    private String paymentMode; // CASH, UPI
    private String notes;

    public MarkPaidRequest() {
        this.paymentMode = "CASH";
    }

    public MarkPaidRequest(String paymentMode, String notes) {
        this.paymentMode = paymentMode;
        this.notes = notes;
    }

    public String getPaymentMode() { return paymentMode; }
    public void setPaymentMode(String paymentMode) { this.paymentMode = paymentMode; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
