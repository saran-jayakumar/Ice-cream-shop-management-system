package com.onescoop.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "ice_cream_tables", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"owner_id", "tableNumber"})
})
public class IceCreamTable {

    public enum TableStatus {
        AVAILABLE,
        OCCUPIED,
        ORDERING
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String tableNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TableStatus status = TableStatus.AVAILABLE;

    @ManyToOne
    @JoinColumn(name = "owner_id")
    private User owner;

    public IceCreamTable() {}

    public IceCreamTable(String tableNumber, TableStatus status) {
        this.tableNumber = tableNumber;
        this.status = status;
    }

    public IceCreamTable(String tableNumber, TableStatus status, User owner) {
        this.tableNumber = tableNumber;
        this.status = status;
        this.owner = owner;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTableNumber() { return tableNumber; }
    public void setTableNumber(String tableNumber) { this.tableNumber = tableNumber; }

    public TableStatus getStatus() { return status; }
    public void setStatus(TableStatus status) { this.status = status; }

    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }
}
