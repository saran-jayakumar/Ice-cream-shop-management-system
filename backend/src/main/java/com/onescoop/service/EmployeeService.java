package com.onescoop.service;

import com.onescoop.entity.Employee;
import com.onescoop.entity.User;
import com.onescoop.entity.UserRole;
import com.onescoop.repository.EmployeeRepository;
import com.onescoop.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.onescoop.security.SecurityUtils;
import java.util.List;
import java.util.Optional;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecurityUtils securityUtils;

    public EmployeeService(EmployeeRepository employeeRepository,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           SecurityUtils securityUtils) {
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.securityUtils = securityUtils;
    }

    public List<Employee> getAllEmployees() {
        User owner = securityUtils.getOwnerOfCurrentUser();
        return employeeRepository.findByOwnerId(owner.getId());
    }

    public Optional<Employee> getEmployeeById(Long id) {
        User owner = securityUtils.getOwnerOfCurrentUser();
        return employeeRepository.findById(id)
                .filter(emp -> emp.getOwner() != null && emp.getOwner().getId().equals(owner.getId()));
    }

    @Transactional
    public Employee saveEmployee(Employee employee) {
        User currentUser = securityUtils.getCurrentUser();
        if (currentUser.getRole() != UserRole.OWNER && currentUser.getRole() != UserRole.ASSISTANT_MANAGER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only owners and assistant managers can create employees");
        }
        User owner = securityUtils.getOwnerOfCurrentUser();
        
        User user = employee.getUser();
        if (user != null) {
            if (user.getEmail() == null || !user.getEmail().toLowerCase().endsWith("@onescoop.com")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email must end with @onescoop.com");
            }
            user.setEmail(user.getEmail().trim().toLowerCase());
            
            // Check if email already exists
            Optional<User> existingUser = userRepository.findByEmail(user.getEmail());
            if (existingUser.isPresent()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already registered for another login account");
            }
            
            // Configure user profile
            user.setName(employee.getEmployeeName());
            user.setPlainTextPassword(user.getPassword());
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            user.setRole(mapPositionToRole(employee.getPosition()));
        }
        employee.setOwner(owner);
        return employeeRepository.save(employee);
    }

    @Transactional
    public Employee updateEmployee(Long id, Employee employeeDetails) {
        User currentUser = securityUtils.getCurrentUser();
        if (currentUser.getRole() != UserRole.OWNER && currentUser.getRole() != UserRole.ASSISTANT_MANAGER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only owners and assistant managers can update employees");
        }
        User owner = securityUtils.getOwnerOfCurrentUser();

        Employee employee = employeeRepository.findById(id)
                .filter(emp -> emp.getOwner() != null && emp.getOwner().getId().equals(owner.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        employee.setEmployeeName(employeeDetails.getEmployeeName());
        employee.setPosition(employeeDetails.getPosition());
        employee.setSalary(employeeDetails.getSalary());
        employee.setShift(employeeDetails.getShift());

        User existingUser = employee.getUser();
        User detailsUser = employeeDetails.getUser();

        if (detailsUser != null) {
            if (detailsUser.getEmail() == null || !detailsUser.getEmail().toLowerCase().endsWith("@onescoop.com")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email must end with @onescoop.com");
            }
            detailsUser.setEmail(detailsUser.getEmail().trim().toLowerCase());
        }

        if (existingUser != null && detailsUser != null) {
            // Update existing associated user account
            if (!existingUser.getEmail().equals(detailsUser.getEmail())) {
                // Check if new email conflicts with another user
                Optional<User> emailConflict = userRepository.findByEmail(detailsUser.getEmail());
                if (emailConflict.isPresent() && !emailConflict.get().getId().equals(existingUser.getId())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already in use");
                }
                existingUser.setEmail(detailsUser.getEmail());
            }
            
            existingUser.setName(employeeDetails.getEmployeeName());
            existingUser.setRole(mapPositionToRole(employeeDetails.getPosition()));

            // Update password if a new one is explicitly supplied
            if (detailsUser.getPassword() != null && !detailsUser.getPassword().trim().isEmpty()) {
                existingUser.setPlainTextPassword(detailsUser.getPassword());
                existingUser.setPassword(passwordEncoder.encode(detailsUser.getPassword()));
            }
        } else if (detailsUser != null) {
            // Create user account if one didn't exist
            detailsUser.setName(employeeDetails.getEmployeeName());
            detailsUser.setPassword(passwordEncoder.encode(detailsUser.getPassword()));
            detailsUser.setRole(mapPositionToRole(employeeDetails.getPosition()));
            employee.setUser(detailsUser);
        }

        return employeeRepository.save(employee);
    }

    @Transactional
    public void deleteEmployee(Long id) {
        User currentUser = securityUtils.getCurrentUser();
        if (currentUser.getRole() != UserRole.OWNER && currentUser.getRole() != UserRole.ASSISTANT_MANAGER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only owners and assistant managers can delete employees");
        }
        User owner = securityUtils.getOwnerOfCurrentUser();

        Employee employee = employeeRepository.findById(id)
                .filter(emp -> emp.getOwner() != null && emp.getOwner().getId().equals(owner.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));
        employeeRepository.delete(employee);
    }

    private UserRole mapPositionToRole(String position) {
        if (position == null) return UserRole.SERVER;
        switch (position.toUpperCase()) {
            case "OWNER":
                return UserRole.OWNER;
            case "ASSISTANT_MANAGER":
                return UserRole.ASSISTANT_MANAGER;
            case "CASHIER":
                return UserRole.CASHIER;
            case "SERVER":
            default:
                return UserRole.SERVER;
        }
    }
}
