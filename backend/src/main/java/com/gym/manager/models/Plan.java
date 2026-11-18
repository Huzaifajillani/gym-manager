package com.gym.manager.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "plans")
public class Plan {

    @Id
    private String id;
    private String name;
    private int durationMonths;
    private double price;
    private double discount;
    private List<String> benefits = new ArrayList<>();
    private boolean isActive;

    public Plan() {
        this.isActive = true;
    }

    public Plan(String name, int durationMonths, double price, double discount, List<String> benefits, boolean isActive) {
        this.name = name;
        this.durationMonths = durationMonths;
        this.price = price;
        this.discount = discount;
        this.benefits = benefits;
        this.isActive = isActive;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getDurationMonths() { return durationMonths; }
    public void setDurationMonths(int durationMonths) { this.durationMonths = durationMonths; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public double getDiscount() { return discount; }
    public void setDiscount(double discount) { this.discount = discount; }

    public List<String> getBenefits() { return benefits; }
    public void setBenefits(List<String> benefits) { this.benefits = benefits; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public double getEffectivePrice() {
        return Math.max(0.0, price - discount);
    }
}
