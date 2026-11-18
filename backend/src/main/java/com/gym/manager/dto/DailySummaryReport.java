package com.gym.manager.dto;

import java.time.LocalDateTime;

public class DailySummaryReport {
    private long totalMembers;
    private long activeMembers;
    private long expiredMembers;
    private long pendingPayments;
    private long todayCheckIns;
    private long redListCount;
    private LocalDateTime generatedAt;
    private String statusMessage;

    public DailySummaryReport() {
        this.generatedAt = LocalDateTime.now();
    }

    public long getTotalMembers() { return totalMembers; }
    public void setTotalMembers(long totalMembers) { this.totalMembers = totalMembers; }

    public long getActiveMembers() { return activeMembers; }
    public void setActiveMembers(long activeMembers) { this.activeMembers = activeMembers; }

    public long getExpiredMembers() { return expiredMembers; }
    public void setExpiredMembers(long expiredMembers) { this.expiredMembers = expiredMembers; }

    public long getPendingPayments() { return pendingPayments; }
    public void setPendingPayments(long pendingPayments) { this.pendingPayments = pendingPayments; }

    public long getTodayCheckIns() { return todayCheckIns; }
    public void setTodayCheckIns(long todayCheckIns) { this.todayCheckIns = todayCheckIns; }

    public long getRedListCount() { return redListCount; }
    public void setRedListCount(long redListCount) { this.redListCount = redListCount; }

    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }

    public String getStatusMessage() { return statusMessage; }
    public void setStatusMessage(String statusMessage) { this.statusMessage = statusMessage; }
}
