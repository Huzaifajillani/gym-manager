package com.gym.manager.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "addons")
public class Addon {

    @Id
    private String id;
    private String category; // PT, DIET, SUPPLEMENT
    private String title;
    private String description;
    private double price;
    private int validityDays;
    private int stockOrCapacity;
    private String trainerName;
    private String trainerQualification;

    public Addon() {}

    public Addon(String category, String title, String description, double price, int validityDays, int stockOrCapacity, String trainerName, String trainerQualification) {
        this.category = category;
        this.title = title;
        this.description = description;
        this.price = price;
        this.validityDays = validityDays;
        this.stockOrCapacity = stockOrCapacity;
        this.trainerName = trainerName;
        this.trainerQualification = trainerQualification;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public int getValidityDays() { return validityDays; }
    public void setValidityDays(int validityDays) { this.validityDays = validityDays; }

    public int getStockOrCapacity() { return stockOrCapacity; }
    public void setStockOrCapacity(int stockOrCapacity) { this.stockOrCapacity = stockOrCapacity; }

    public String getTrainerName() { return trainerName; }
    public void setTrainerName(String trainerName) { this.trainerName = trainerName; }

    public String getTrainerQualification() { return trainerQualification; }
    public void setTrainerQualification(String trainerQualification) { this.trainerQualification = trainerQualification; }
}
