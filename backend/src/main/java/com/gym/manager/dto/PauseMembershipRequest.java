package com.gym.manager.dto;

public class PauseMembershipRequest {
    private String reason; // Medical, Travel, Personal
    private String startDate; // YYYY-MM-DD
    private String endDate; // YYYY-MM-DD

    public PauseMembershipRequest() {}

    public PauseMembershipRequest(String reason, String startDate, String endDate) {
        this.reason = reason;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }
}
