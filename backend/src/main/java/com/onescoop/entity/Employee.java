package com.onescoop.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "employees")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String employeeName;

    @Column(nullable = false)
    private String position;

    @Column(nullable = false)
    private Double salary;

    @Column(nullable = false)
    private String shift;

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "owner_id")
    private User owner;

    public Employee() {}

    public Employee(String employeeName, String position, Double salary, String shift, User user) {
        this.employeeName = employeeName;
        this.position = position;
        this.salary = salary;
        this.shift = shift;
        this.user = user;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }

    public Double getSalary() { return salary; }
    public void setSalary(Double salary) { this.salary = salary; }

    public String getShift() { return shift; }
    public void setShift(String shift) { this.shift = shift; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }
}
