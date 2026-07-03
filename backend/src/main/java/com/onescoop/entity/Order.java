package com.onescoop.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {

    public enum OrderStatus {
        PENDING,
        COMPLETED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = true)
    @JoinColumn(name = "table_id", nullable = true)
    private IceCreamTable table;

    @Column(name = "table_number")
    private String tableNumber;

    @ManyToOne(optional = false)
    @JoinColumn(name = "server_id", nullable = false)
    private User server;

    @Column(nullable = false)
    private Double totalAmount = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus orderStatus = OrderStatus.PENDING;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "owner_id")
    private User owner;

    public Order() {}

    public Order(IceCreamTable table, User server, Double totalAmount, OrderStatus orderStatus) {
        this.table = table;
        this.server = server;
        this.totalAmount = totalAmount;
        this.orderStatus = orderStatus;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public IceCreamTable getTable() {
        if (table == null) {
            return new IceCreamTable(this.tableNumber != null ? this.tableNumber : "N/A", IceCreamTable.TableStatus.AVAILABLE);
        }
        return table;
    }
    public void setTable(IceCreamTable table) { this.table = table; }

    public String getTableNumber() { return tableNumber; }
    public void setTableNumber(String tableNumber) { this.tableNumber = tableNumber; }

    public User getServer() { return server; }
    public void setServer(User server) { this.server = server; }

    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }

    public OrderStatus getOrderStatus() { return orderStatus; }
    public void setOrderStatus(OrderStatus orderStatus) { this.orderStatus = orderStatus; }

    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }

    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }
}
