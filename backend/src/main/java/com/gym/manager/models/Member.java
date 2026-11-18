package com.gym.manager.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "members")
public class Member {

    @Id
    private String id;

    @Indexed(unique = true)
    private String memberCode;

    private String name;

    @Indexed(unique = true)
    private String phone;

    @Indexed(unique = true)
    private String email;

    private String password;

    private String role; // ROLE_ADMIN, ROLE_MEMBER

    private String status; // Active, Paused, Expired, Cancelled

    private boolean consentGiven;

    private int streakCount;

    private int weeklyGoal; // e.g. 4 workouts per week

    private String lastVisitDate; // YYYY-MM-DD

    // Naye fields Profile ke liye
    private String height;
    private String weight;
    private String profilePicture;

    private LocalDateTime createdAt;

    public Member() {
        this.weeklyGoal = 4;
        this.streakCount = 0;
        this.createdAt = LocalDateTime.now();
        this.status = "Active";
    }

    public Member(String memberCode, String name, String phone, String email, String password, String role, String status, boolean consentGiven) {
        this();
        this.memberCode = memberCode;
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.password = password;
        this.role = role;
        this.status = status;
        this.consentGiven = consentGiven;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getMemberCode() { return memberCode; }
    public void setMemberCode(String memberCode) { this.memberCode = memberCode; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isConsentGiven() { return consentGiven; }
    public void setConsentGiven(boolean consentGiven) { this.consentGiven = consentGiven; }

    public int getStreakCount() { return streakCount; }
    public void setStreakCount(int streakCount) { this.streakCount = streakCount; }

    public int getWeeklyGoal() { return weeklyGoal; }
    public void setWeeklyGoal(int weeklyGoal) { this.weeklyGoal = weeklyGoal; }

    public String getLastVisitDate() { return lastVisitDate; }
    public void setLastVisitDate(String lastVisitDate) { this.lastVisitDate = lastVisitDate; }

    public String getHeight() { return height; }
    public void setHeight(String height) { this.height = height; }

    public String getWeight() { return weight; }
    public void setWeight(String weight) { this.weight = weight; }

    public String getProfilePicture() { return profilePicture; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}