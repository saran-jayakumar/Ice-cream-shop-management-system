package com.onescoop.dto;

public class OrderItemRequest {
    private Long flavourId;
    private Integer quantity;

    public OrderItemRequest() {}

    public OrderItemRequest(Long flavourId, Integer quantity) {
        this.flavourId = flavourId;
        this.quantity = quantity;
    }

    public Long getFlavourId() { return flavourId; }
    public void setFlavourId(Long flavourId) { this.flavourId = flavourId; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}
