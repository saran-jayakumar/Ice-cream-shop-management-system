package com.onescoop.service;

import com.onescoop.entity.*;
import com.onescoop.repository.*;
import com.onescoop.security.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class BillService {

    private final BillRepository billRepository;
    private final OrderRepository orderRepository;
    private final IceCreamTableRepository tableRepository;
    private final SecurityUtils securityUtils;

    public BillService(BillRepository billRepository,
                       OrderRepository orderRepository,
                       IceCreamTableRepository tableRepository,
                       SecurityUtils securityUtils) {
        this.billRepository = billRepository;
        this.orderRepository = orderRepository;
        this.tableRepository = tableRepository;
        this.securityUtils = securityUtils;
    }

    public List<Bill> getAllBills() {
        User owner = securityUtils.getOwnerOfCurrentUser();
        return billRepository.findByOwnerId(owner.getId());
    }

    public Optional<Bill> getBillById(Long id) {
        User owner = securityUtils.getOwnerOfCurrentUser();
        return billRepository.findById(id)
                .filter(b -> b.getOwner() != null && b.getOwner().getId().equals(owner.getId()));
    }

    @Transactional
    public Bill generateBillForOrder(Long orderId) {
        User owner = securityUtils.getOwnerOfCurrentUser();
        Order order = orderRepository.findById(orderId)
                .filter(o -> o.getOwner() != null && o.getOwner().getId().equals(owner.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        // Check if bill already exists
        Optional<Bill> existingBill = billRepository.findByOwnerId(owner.getId()).stream()
                .filter(b -> b.getOrder().getId().equals(orderId))
                .findFirst();

        if (existingBill.isPresent()) {
            return existingBill.get();
        }

        Bill bill = new Bill();
        bill.setOrder(order);
        bill.setPaymentStatus(Bill.PaymentStatus.PENDING);
        bill.setPaymentMethod(Bill.PaymentMethod.NONE);
        bill.setBillDate(LocalDateTime.now());
        bill.setOwner(owner);

        return billRepository.save(bill);
    }

    @Transactional
    public Bill updatePaymentStatus(Long id, Bill.PaymentStatus status, Bill.PaymentMethod method) {
        User owner = securityUtils.getOwnerOfCurrentUser();
        Bill bill = billRepository.findById(id)
                .filter(b -> b.getOwner() != null && b.getOwner().getId().equals(owner.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bill not found"));

        bill.setPaymentStatus(status);
        bill.setPaymentMethod(method);

        if (status == Bill.PaymentStatus.PAID) {
            Order order = bill.getOrder();
            order.setOrderStatus(Order.OrderStatus.COMPLETED);
            orderRepository.save(order);

            // Free the table
            IceCreamTable table = order.getTable();
            if (table != null) {
                if (table.getTableNumber().contains("-")) {
                    List<Order> orders = orderRepository.findByTableId(table.getId());
                    for (Order o : orders) {
                        o.setTable(null);
                        orderRepository.save(o);
                    }
                    tableRepository.delete(table);
                } else {
                    table.setStatus(IceCreamTable.TableStatus.AVAILABLE);
                    tableRepository.save(table);
                }
            }
        }

        return billRepository.save(bill);
    }

    public Map<String, Object> getReports() {
        User owner = securityUtils.getOwnerOfCurrentUser();
        List<Bill> paidBills = billRepository.findByOwnerIdAndPaymentStatus(owner.getId(), Bill.PaymentStatus.PAID);
        LocalDate today = LocalDate.now();

        double dailyProfit = 0.0;
        double monthlyProfit = 0.0;
        double yearlyProfit = 0.0;
        double totalRevenue = 0.0;
        double cashRevenue = 0.0;
        double onlineRevenue = 0.0;

        for (Bill bill : paidBills) {
            double amount = bill.getOrder().getTotalAmount();
            LocalDateTime billDate = bill.getBillDate();
            totalRevenue += amount;

            if (bill.getPaymentMethod() == Bill.PaymentMethod.CASH) {
                cashRevenue += amount;
            } else if (bill.getPaymentMethod() == Bill.PaymentMethod.ONLINE) {
                onlineRevenue += amount;
            }

            // Daily Profit (today)
            if (billDate.toLocalDate().isEqual(today)) {
                dailyProfit += amount;
            }

            // Monthly Profit (current month)
            if (billDate.getMonth() == today.getMonth() && billDate.getYear() == today.getYear()) {
                monthlyProfit += amount;
            }

            // Yearly Profit (current year)
            if (billDate.getYear() == today.getYear()) {
                yearlyProfit += amount;
            }
        }

        long ordersCount = paidBills.size();

        Map<String, Object> stats = new HashMap<>();
        stats.put("dailyProfit", dailyProfit);
        stats.put("monthlyProfit", monthlyProfit);
        stats.put("yearlyProfit", yearlyProfit);
        stats.put("totalRevenue", totalRevenue);
        stats.put("cashRevenue", cashRevenue);
        stats.put("onlineRevenue", onlineRevenue);
        stats.put("ordersCount", ordersCount);

        return stats;
    }
}
