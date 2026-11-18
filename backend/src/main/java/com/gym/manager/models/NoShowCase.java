package com.gym.manager.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "no_show_cases")
public class NoShowCase {

    @Id
    private String id;

    @Indexed
    private String memberId;

    private String memberName;
    private String phone;
    private long absentDays;
    private String status; // Open, Contacted, Returned, Closed
    private String outcome; // Will return, Injured, Travelling, Timing issue, Unhappy, No response, Cancelled
    private String notes;
    private String nextActionDate; // YYYY-MM-DD
    private LocalDateTime updatedAt;

    public NoShowCase() {
        this.status = "Open";
        this.updatedAt = LocalDateTime.now();
    }

    public NoShowCase(String memberId, String memberName, String phone, long absentDays, String status) {
        this();
        this.memberId = memberId;
        this.memberName = memberName;
        this.phone = phone;
        this.absentDays = absentDays;
        this.status = status;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getMemberId() { return memberId; }
    public void setMemberId(String memberId) { this.memberId = memberId; }

    public String getMemberName() { return memberName; }
    public void setMemberName(String memberName) { this.memberName = memberName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public long getAbsentDays() { return absentDays; }
    public void setAbsentDays(long absentDays) { this.absentDays = absentDays; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getOutcome() { return outcome; }
    public void setOutcome(String outcome) { this.outcome = outcome; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getNextActionDate() { return nextActionDate; }
    public void setNextActionDate(String nextActionDate) { this.nextActionDate = nextActionDate; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
