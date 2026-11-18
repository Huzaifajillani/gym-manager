package com.gym.manager.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "addon_orders")
public class AddonOrder {

    @Id
    private String id;

    @Indexed
    private String memberId;

    private String addonId;
    private String addonTitle;
    private String category;
    private double amount;
    private String status; // Active, Completed
    private int sessionsTotal;
    private int sessionsRemaining;
    private LocalDateTime purchasedAt;

    public AddonOrder() {
        this.status = "Active";
        this.purchasedAt = LocalDateTime.now();
    }

    public AddonOrder(String memberId, String addonId, String addonTitle, String category, double amount, String status, int sessionsTotal, int sessionsRemaining) {
        this();
        this.memberId = memberId;
        this.addonId = addonId;
        this.addonTitle = addonTitle;
        this.category = category;
        this.amount = amount;
        this.status = status;
        this.sessionsTotal = sessionsTotal;
        this.sessionsRemaining = sessionsRemaining;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getMemberId() { return memberId; }
    public void setMemberId(String memberId) { this.memberId = memberId; }

    public String getAddonId() { return addonId; }
    public void setAddonId(String addonId) { this.addonId = addonId; }

    public String getAddonTitle() { return addonTitle; }
    public void setAddonTitle(String addonTitle) { this.addonTitle = addonTitle; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getSessionsTotal() { return sessionsTotal; }
    public void setSessionsTotal(int sessionsTotal) { this.sessionsTotal = sessionsTotal; }

    public int getSessionsRemaining() { return sessionsRemaining; }
    public void setSessionsRemaining(int sessionsRemaining) { this.sessionsRemaining = sessionsRemaining; }

    public LocalDateTime getPurchasedAt() { return purchasedAt; }
    public void setPurchasedAt(LocalDateTime purchasedAt) { this.purchasedAt = purchasedAt; }
}
