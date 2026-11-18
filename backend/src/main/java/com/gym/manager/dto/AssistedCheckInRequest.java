package com.gym.manager.dto;

public class AssistedCheckInRequest {
    private String reason; // e.g., "Forgot phone at home", "Camera lens broken", "Visitor day pass"

    public AssistedCheckInRequest() {}

    public AssistedCheckInRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
