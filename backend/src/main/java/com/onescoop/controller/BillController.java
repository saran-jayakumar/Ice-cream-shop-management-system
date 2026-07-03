package com.onescoop.controller;

import com.onescoop.entity.Bill;
import com.onescoop.service.BillService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bills")
public class BillController {

    private final BillService billService;

    public BillController(BillService billService) {
        this.billService = billService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('CASHIER', 'OWNER', 'ASSISTANT_MANAGER')")
    public List<Bill> getAllBills() {
        return billService.getAllBills();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CASHIER', 'OWNER', 'ASSISTANT_MANAGER')")
    public ResponseEntity<Bill> getBillById(@PathVariable Long id) {
        return billService.getBillById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/order/{orderId}")
    @PreAuthorize("hasRole('CASHIER')")
    public ResponseEntity<Bill> generateBill(@PathVariable Long orderId) {
        try {
            return ResponseEntity.ok(billService.generateBillForOrder(orderId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/payment")
    @PreAuthorize("hasRole('CASHIER')")
    public ResponseEntity<Bill> updatePaymentStatus(@PathVariable Long id, 
                                                    @RequestParam Bill.PaymentStatus status, 
                                                    @RequestParam Bill.PaymentMethod method) {
        try {
            return ResponseEntity.ok(billService.updatePaymentStatus(id, status, method));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/reports")
    @PreAuthorize("hasAnyRole('OWNER', 'ASSISTANT_MANAGER')")
    public ResponseEntity<Map<String, Object>> getReports() {
        return ResponseEntity.ok(billService.getReports());
    }
}
