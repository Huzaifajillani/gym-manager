package com.gym.manager.dto;

public class AuthRequest {
    private String identifier; // Email or Mobile Number
    private String password;

    public AuthRequest() {}

    public AuthRequest(String identifier, String password) {
        this.identifier = identifier;
        this.password = password;
    }

    public String getIdentifier() { return identifier; }
    public void setIdentifier(String identifier) { this.identifier = identifier; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
