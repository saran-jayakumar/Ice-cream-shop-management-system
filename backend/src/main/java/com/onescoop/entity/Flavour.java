package com.onescoop.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "flavours", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"owner_id", "flavourName"})
})
public class Flavour {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String flavourName;

    @Column(nullable = false)
    private Double price;

    @Column(nullable = false)
    private Boolean availability = true;

    @Column(columnDefinition = "LONGTEXT")
    private String imageUrl;

    @ManyToOne
    @JoinColumn(name = "owner_id")
    private User owner;

    public Flavour() {}

    public Flavour(String flavourName, Double price, Boolean availability) {
        this(flavourName, price, availability, null);
    }

    public Flavour(String flavourName, Double price, Boolean availability, String imageUrl) {
        this.flavourName = flavourName;
        this.price = price;
        this.availability = availability;
        this.imageUrl = imageUrl;
    }

    public Flavour(String flavourName, Double price, Boolean availability, String imageUrl, User owner) {
        this.flavourName = flavourName;
        this.price = price;
        this.availability = availability;
        this.imageUrl = imageUrl;
        this.owner = owner;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFlavourName() { return flavourName; }
    public void setFlavourName(String flavourName) { this.flavourName = flavourName; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public Boolean getAvailability() { return availability; }
    public void setAvailability(Boolean availability) { this.availability = availability; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }
}
