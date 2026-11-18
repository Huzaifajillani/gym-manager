package com.gym.manager.dto;

public class RedListFollowUpRequest {
    private String outcome; // Will return, Injured, Travelling, Timing issue, Unhappy, No response, Cancelled
    private String nextActionDate; // YYYY-MM-DD
    private String notes;

    public RedListFollowUpRequest() {}

    public RedListFollowUpRequest(String outcome, String nextActionDate, String notes) {
        this.outcome = outcome;
        this.nextActionDate = nextActionDate;
        this.notes = notes;
    }

    public String getOutcome() { return outcome; }
    public void setOutcome(String outcome) { this.outcome = outcome; }

    public String getNextActionDate() { return nextActionDate; }
    public void setNextActionDate(String nextActionDate) { this.nextActionDate = nextActionDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
