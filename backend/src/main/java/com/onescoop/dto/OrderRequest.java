package com.onescoop.dto;

import java.util.List;

public class OrderRequest {
    private Long tableId;
    private List<OrderItemRequest> items;

    public OrderRequest() {}

    public OrderRequest(Long tableId, List<OrderItemRequest> items) {
        this.tableId = tableId;
        this.items = items;
    }

    public Long getTableId() { return tableId; }
    public void setTableId(Long tableId) { this.tableId = tableId; }

    public List<OrderItemRequest> getItems() { return items; }
    public void setItems(List<OrderItemRequest> items) { this.items = items; }
}
