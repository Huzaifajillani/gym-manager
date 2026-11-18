package com.gym.manager.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "payments")
public class Payment {

    @Id
    private String id;

    @Indexed
    private String memberId;

    private String memberName;
    private double amount;
    private String paymentMode; // ONLINE, CASH, UPI
    private String status; // Pending, Paid, Failed, Refunded

    @Indexed(unique = true)
    private String transactionRef;

    private String receiptId;
    private LocalDateTime paymentDate;
    private String planName;
    private String notes;

    public Payment() {
        this.paymentDate = LocalDateTime.now();
        this.status = "Pending";
    }

    public Payment(String memberId, String memberName, double amount, String paymentMode, String status, String transactionRef, String receiptId, String planName) {
        this.memberId = memberId;
        this.memberName = memberName;
        this.amount = amount;
        this.paymentMode = paymentMode;
        this.status = status;
        this.transactionRef = transactionRef;
        this.receiptId = receiptId;
        this.planName = planName;
        this.paymentDate = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getMemberId() { return memberId; }
    public void setMemberId(String memberId) { this.memberId = memberId; }

    public String getMemberName() { return memberName; }
    public void setMemberName(String memberName) { this.memberName = memberName; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }

    public String getPaymentMode() { return paymentMode; }
    public void setPaymentMode(String paymentMode) { this.paymentMode = paymentMode; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getTransactionRef() { return transactionRef; }
    public void setTransactionRef(String transactionRef) { this.transactionRef = transactionRef; }

    public String getReceiptId() { return receiptId; }
    public void setReceiptId(String receiptId) { this.receiptId = receiptId; }

    public LocalDateTime getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDateTime paymentDate) { this.paymentDate = paymentDate; }

    public String getPlanName() { return planName; }
    public void setPlanName(String planName) { this.planName = planName; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
