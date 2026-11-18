package com.gym.manager.dto;

public class AuthResponse {
    private String token;
    private String role;
    private String memberId;
    private String name;
    private String memberCode;
    private String email;
    private String phone;

    public AuthResponse() {}

    public AuthResponse(String token, String role, String memberId, String name, String memberCode, String email, String phone) {
        this.token = token;
        this.role = role;
        this.memberId = memberId;
        this.name = name;
        this.memberCode = memberCode;
        this.email = email;
        this.phone = phone;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getMemberId() { return memberId; }
    public void setMemberId(String memberId) { this.memberId = memberId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getMemberCode() { return memberCode; }
    public void setMemberCode(String memberCode) { this.memberCode = memberCode; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
}
