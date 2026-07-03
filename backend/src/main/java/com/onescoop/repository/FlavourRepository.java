package com.onescoop.repository;

import com.onescoop.entity.Flavour;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FlavourRepository extends JpaRepository<Flavour, Long> {
    Optional<Flavour> findByFlavourName(String flavourName);
    List<Flavour> findByOwnerId(Long ownerId);
    Optional<Flavour> findByOwnerIdAndFlavourName(Long ownerId, String flavourName);
}
