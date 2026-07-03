package com.onescoop.controller;

import com.onescoop.dto.OrderRequest;
import com.onescoop.entity.IceCreamTable;
import com.onescoop.entity.Order;
import com.onescoop.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public List<Order> getAllOrders() {
        return orderService.getAllOrders();
    }

    @GetMapping("/pending")
    public List<Order> getPendingOrders() {
        return orderService.getPendingOrders();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
        return orderService.getOrderById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/tables")
    public List<IceCreamTable> getAllTables() {
        return orderService.getAllTables();
    }

    @PutMapping("/tables/{id}/status")
    public ResponseEntity<IceCreamTable> updateTableStatus(@PathVariable Long id, @RequestParam IceCreamTable.TableStatus status) {
        try {
            return ResponseEntity.ok(orderService.updateTableStatus(id, status));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/tables/{id}/split")
    public ResponseEntity<IceCreamTable> splitTable(@PathVariable Long id, @RequestParam String suffix) {
        return ResponseEntity.ok(orderService.splitTable(id, suffix));
    }

    @DeleteMapping("/tables/{id}")
    public ResponseEntity<Void> deleteTable(@PathVariable Long id) {
        orderService.deleteTable(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping
    @PreAuthorize("hasRole('SERVER')")
    public ResponseEntity<Order> createOrder(@RequestBody OrderRequest orderRequest, Authentication authentication) {
        String email = authentication.getName(); // Server's email from JWT token
        Order order = orderService.createOrder(orderRequest, email);
        return ResponseEntity.ok(order);
    }
}
