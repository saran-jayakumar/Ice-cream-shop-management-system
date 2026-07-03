package com.onescoop.repository;

import com.onescoop.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByOrderStatus(Order.OrderStatus status);
    List<Order> findByServerId(Long serverId);
    List<Order> findByOwnerId(Long ownerId);
    List<Order> findByOwnerIdAndOrderStatus(Long ownerId, Order.OrderStatus status);
    List<Order> findByTableId(Long tableId);
}
