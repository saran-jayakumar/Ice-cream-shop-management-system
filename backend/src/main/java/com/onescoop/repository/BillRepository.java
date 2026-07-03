package com.onescoop.repository;

import com.onescoop.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {
    List<Bill> findByPaymentStatus(Bill.PaymentStatus status);
    List<Bill> findByOwnerId(Long ownerId);
    List<Bill> findByOwnerIdAndPaymentStatus(Long ownerId, Bill.PaymentStatus status);
}
