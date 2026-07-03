package com.onescoop.repository;

import com.onescoop.entity.IceCreamTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface IceCreamTableRepository extends JpaRepository<IceCreamTable, Long> {
    Optional<IceCreamTable> findByTableNumber(String tableNumber);
    List<IceCreamTable> findByOwnerId(Long ownerId);
    Optional<IceCreamTable> findByOwnerIdAndTableNumber(Long ownerId, String tableNumber);
}
