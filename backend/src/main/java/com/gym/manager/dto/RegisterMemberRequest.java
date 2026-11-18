package com.gym.manager.dto;

public class RegisterMemberRequest {
    private String name;
    private String phone;
    private String email;
    private String planId;
    private double fee;
    private String startDate; // YYYY-MM-DD
    private boolean consentGiven;
    private int weeklyGoal;
    private String password;

    public RegisterMemberRequest() {
        this.weeklyGoal = 4;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPlanId() { return planId; }
    public void setPlanId(String planId) { this.planId = planId; }

    public double getFee() { return fee; }
    public void setFee(double fee) { this.fee = fee; }

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public boolean isConsentGiven() { return consentGiven; }
    public void setConsentGiven(boolean consentGiven) { this.consentGiven = consentGiven; }

    public int getWeeklyGoal() { return weeklyGoal; }
    public void setWeeklyGoal(int weeklyGoal) { this.weeklyGoal = weeklyGoal; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
