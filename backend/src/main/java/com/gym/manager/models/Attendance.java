package com.gym.manager.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "attendance")
public class Attendance {

    @Id
    private String id;

    @Indexed
    private String memberId;

    private String memberName;
    private LocalDateTime checkInTime;
    private String checkInDate; // YYYY-MM-DD
    private String source; // QR_SCAN, ASSISTED, DAILY_QR
    private String assistedReason;
    private String qrTokenUsed; // token used for DAILY_QR check-in

    public Attendance() {
        this.checkInTime = LocalDateTime.now();
    }

    public Attendance(String memberId, String memberName, LocalDateTime checkInTime, String checkInDate, String source, String assistedReason) {
        this.memberId = memberId;
        this.memberName = memberName;
        this.checkInTime = checkInTime;
        this.checkInDate = checkInDate;
        this.source = source;
        this.assistedReason = assistedReason;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getMemberId() { return memberId; }
    public void setMemberId(String memberId) { this.memberId = memberId; }

    public String getMemberName() { return memberName; }
    public void setMemberName(String memberName) { this.memberName = memberName; }

    public LocalDateTime getCheckInTime() { return checkInTime; }
    public void setCheckInTime(LocalDateTime checkInTime) { this.checkInTime = checkInTime; }

    public String getCheckInDate() { return checkInDate; }
    public void setCheckInDate(String checkInDate) { this.checkInDate = checkInDate; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getAssistedReason() { return assistedReason; }
    public void setAssistedReason(String assistedReason) { this.assistedReason = assistedReason; }

    public String getQrTokenUsed() { return qrTokenUsed; }
    public void setQrTokenUsed(String qrTokenUsed) { this.qrTokenUsed = qrTokenUsed; }
}
