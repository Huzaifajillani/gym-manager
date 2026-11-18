package com.gym.manager.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "daily_qr_codes")
public class DailyQrCode {

    @Id
    private String id;

    @Indexed(unique = true)
    private String date; // YYYY-MM-DD

    private String qrToken; // GYM_YYYY-MM-DD_<RANDOM_UUID>

    private LocalDateTime createdAt;

    private boolean active;

    public DailyQrCode() {
        this.createdAt = LocalDateTime.now();
        this.active = true;
    }

    public DailyQrCode(String date, String qrToken, LocalDateTime createdAt, boolean active) {
        this.date = date;
        this.qrToken = qrToken;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
        this.active = active;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getQrToken() {
        return qrToken;
    }

    public void setQrToken(String qrToken) {
        this.qrToken = qrToken;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
