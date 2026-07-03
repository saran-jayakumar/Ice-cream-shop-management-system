package com.onescoop.repository;

import com.onescoop.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.List;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    @Query("SELECT e FROM Employee e WHERE LOWER(e.user.email) = LOWER(:email)")
    Optional<Employee> findByUserEmail(@Param("email") String email);

    @Query("SELECT e FROM Employee e WHERE LOWER(e.user.email) = LOWER(:email) AND UPPER(e.position) = UPPER(:position)")
    Optional<Employee> findByUserEmailAndPosition(@Param("email") String email, @Param("position") String position);

    Optional<Employee> findByUser(com.onescoop.entity.User user);

    List<Employee> findByOwnerId(Long ownerId);
}
