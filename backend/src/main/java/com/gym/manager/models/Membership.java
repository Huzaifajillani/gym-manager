package com.gym.manager.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "memberships")
public class Membership {

    @Id
    private String id;

    @Indexed
    private String memberId;

    private String planId;
    private String planName;
    private double fee;
    private String startDate; // YYYY-MM-DD
    private String expiryDate; // YYYY-MM-DD
    private String paymentStatus; // Pending, Paid
    private String pauseReason;
    private String pauseStartDate;
    private String pauseEndDate;

    public Membership() {
        this.paymentStatus = "Pending";
    }

    public Membership(String memberId, String planId, String planName, double fee, String startDate, String expiryDate, String paymentStatus) {
        this.memberId = memberId;
        this.planId = planId;
        this.planName = planName;
        this.fee = fee;
        this.startDate = startDate;
        this.expiryDate = expiryDate;
        this.paymentStatus = paymentStatus;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getMemberId() { return memberId; }
    public void setMemberId(String memberId) { this.memberId = memberId; }

    public String getPlanId() { return planId; }
    public void setPlanId(String planId) { this.planId = planId; }

    public String getPlanName() { return planName; }
    public void setPlanName(String planName) { this.planName = planName; }

    public double getFee() { return fee; }
    public void setFee(double fee) { this.fee = fee; }

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public String getExpiryDate() { return expiryDate; }
    public void setExpiryDate(String expiryDate) { this.expiryDate = expiryDate; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getPauseReason() { return pauseReason; }
    public void setPauseReason(String pauseReason) { this.pauseReason = pauseReason; }

    public String getPauseStartDate() { return pauseStartDate; }
    public void setPauseStartDate(String pauseStartDate) { this.pauseStartDate = pauseStartDate; }

    public String getPauseEndDate() { return pauseEndDate; }
    public void setPauseEndDate(String pauseEndDate) { this.pauseEndDate = pauseEndDate; }
}
