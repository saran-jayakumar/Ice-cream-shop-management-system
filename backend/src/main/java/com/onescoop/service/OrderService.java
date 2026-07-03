package com.onescoop.service;

import com.onescoop.dto.OrderItemRequest;
import com.onescoop.dto.OrderRequest;
import com.onescoop.entity.*;
import com.onescoop.repository.*;
import com.onescoop.security.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final IceCreamTableRepository tableRepository;
    private final FlavourRepository flavourRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;

    public OrderService(OrderRepository orderRepository,
                        IceCreamTableRepository tableRepository,
                        FlavourRepository flavourRepository,
                        UserRepository userRepository,
                        SecurityUtils securityUtils) {
        this.orderRepository = orderRepository;
        this.tableRepository = tableRepository;
        this.flavourRepository = flavourRepository;
        this.userRepository = userRepository;
        this.securityUtils = securityUtils;
    }

    public List<Order> getAllOrders() {
        User owner = securityUtils.getOwnerOfCurrentUser();
        return orderRepository.findByOwnerId(owner.getId());
    }

    public List<Order> getPendingOrders() {
        User owner = securityUtils.getOwnerOfCurrentUser();
        return orderRepository.findByOwnerIdAndOrderStatus(owner.getId(), Order.OrderStatus.PENDING);
    }

    public Optional<Order> getOrderById(Long id) {
        User owner = securityUtils.getOwnerOfCurrentUser();
        return orderRepository.findById(id)
                .filter(o -> o.getOwner() != null && o.getOwner().getId().equals(owner.getId()));
    }

    public List<IceCreamTable> getAllTables() {
        User owner = securityUtils.getOwnerOfCurrentUser();
        return tableRepository.findByOwnerId(owner.getId());
    }

    public IceCreamTable updateTableStatus(Long id, IceCreamTable.TableStatus status) {
        User owner = securityUtils.getOwnerOfCurrentUser();
        IceCreamTable table = tableRepository.findById(id)
                .filter(t -> t.getOwner() != null && t.getOwner().getId().equals(owner.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Table not found"));
        table.setStatus(status);
        return tableRepository.save(table);
    }

    public IceCreamTable splitTable(Long parentTableId, String suffix) {
        User owner = securityUtils.getOwnerOfCurrentUser();
        IceCreamTable parentTable = tableRepository.findById(parentTableId)
                .filter(t -> t.getOwner() != null && t.getOwner().getId().equals(owner.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Parent table not found"));

        String suffixClean = suffix.trim().toUpperCase();
        if (suffixClean.isEmpty() || !suffixClean.matches("^[A-Z0-9]+$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid table suffix");
        }

        // e.g. parent is 1, new table number is 1-A. If parent is 1-A, split is 1-B
        String parentNumber = parentTable.getTableNumber();
        String baseNumber = parentNumber.split("-")[0];
        String newNumber = baseNumber + "-" + suffixClean;

        // Check if table number already exists
        Optional<IceCreamTable> existing = tableRepository.findByOwnerIdAndTableNumber(owner.getId(), newNumber);
        if (existing.isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Split table " + newNumber + " already exists");
        }

        IceCreamTable newTable = new IceCreamTable(newNumber, IceCreamTable.TableStatus.AVAILABLE, owner);
        return tableRepository.save(newTable);
    }

    public void deleteTable(Long tableId) {
        User owner = securityUtils.getOwnerOfCurrentUser();
        IceCreamTable table = tableRepository.findById(tableId)
                .filter(t -> t.getOwner() != null && t.getOwner().getId().equals(owner.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Table not found"));

        if (!table.getTableNumber().contains("-")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot delete main tables");
        }

        if (table.getStatus() != IceCreamTable.TableStatus.AVAILABLE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Table is currently active and cannot be deleted");
        }

        List<Order> orders = orderRepository.findByTableId(tableId);
        for (Order o : orders) {
            o.setTable(null);
            orderRepository.save(o);
        }

        tableRepository.delete(table);
    }

    @Transactional
    public Order createOrder(OrderRequest orderRequest, String serverEmail) {
        User owner = securityUtils.getOwnerOfCurrentUser();
        IceCreamTable table = tableRepository.findById(orderRequest.getTableId())
                .filter(t -> t.getOwner() != null && t.getOwner().getId().equals(owner.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Table not found"));

        User server = userRepository.findByEmail(serverEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Server not found"));

        // Check if there is an active pending order for this table
        List<Order> pendingOrders = orderRepository.findByOwnerIdAndOrderStatus(owner.getId(), Order.OrderStatus.PENDING);
        Order existingOrder = pendingOrders.stream()
                .filter(o -> o.getTable().getId().equals(table.getId()))
                .findFirst()
                .orElse(null);

        Order order;
        if (existingOrder != null) {
            // Update existing order items
            order = existingOrder;
        } else {
            order = new Order();
            order.setTable(table);
            order.setTableNumber(table.getTableNumber());
            order.setServer(server);
            order.setOrderStatus(Order.OrderStatus.PENDING);
            order.setOwner(owner);
        }

        double totalAmount = 0.0;
        List<OrderItem> items = new ArrayList<>();

        for (OrderItemRequest itemReq : orderRequest.getItems()) {
            Flavour flavour = flavourRepository.findById(itemReq.getFlavourId())
                    .filter(f -> f.getOwner() != null && f.getOwner().getId().equals(owner.getId()))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Flavour not found"));

            OrderItem item = new OrderItem(order, flavour, itemReq.getQuantity());
            items.add(item);
            totalAmount += flavour.getPrice() * itemReq.getQuantity();
        }

        order.getItems().clear();
        order.getItems().addAll(items);
        order.setTotalAmount(totalAmount);

        // Update table status
        table.setStatus(IceCreamTable.TableStatus.OCCUPIED);
        tableRepository.save(table);

        return orderRepository.save(order);
    }
}
