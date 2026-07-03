package com.onescoop.security;

import com.onescoop.entity.Employee;
import com.onescoop.entity.User;
import com.onescoop.entity.UserRole;
import com.onescoop.repository.EmployeeRepository;
import com.onescoop.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class SecurityUtils {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;

    public SecurityUtils(UserRepository userRepository, EmployeeRepository employeeRepository) {
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
    }

    public User getOwnerOfCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        String email = authentication.getName();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current user not found"));

        if (currentUser.getRole() == UserRole.OWNER) {
            return currentUser;
        } else {
            Employee currentEmp = employeeRepository.findByUserEmail(email)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Employee record not found for logged in user"));
            if (currentEmp.getOwner() == null) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No owner associated with your employee record");
            }
            return currentEmp.getOwner();
        }
    }

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current user not found"));
    }
}
