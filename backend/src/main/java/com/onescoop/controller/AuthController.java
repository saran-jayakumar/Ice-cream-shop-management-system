package com.onescoop.controller;

import com.onescoop.dto.AuthRequest;
import com.onescoop.dto.AuthResponse;
import com.onescoop.dto.SignupRequest;
import com.onescoop.entity.Employee;
import com.onescoop.entity.User;
import com.onescoop.entity.UserRole;
import com.onescoop.entity.Flavour;
import com.onescoop.entity.IceCreamTable;
import com.onescoop.entity.Bill;
import com.onescoop.entity.Order;
import com.onescoop.repository.EmployeeRepository;
import com.onescoop.repository.UserRepository;
import com.onescoop.repository.FlavourRepository;
import com.onescoop.repository.IceCreamTableRepository;
import com.onescoop.repository.OrderRepository;
import com.onescoop.repository.BillRepository;
import com.onescoop.security.JwtTokenProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final FlavourRepository flavourRepository;
    private final IceCreamTableRepository tableRepository;
    private final OrderRepository orderRepository;
    private final BillRepository billRepository;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtTokenProvider tokenProvider,
                          UserRepository userRepository,
                          EmployeeRepository employeeRepository,
                          PasswordEncoder passwordEncoder,
                          FlavourRepository flavourRepository,
                          IceCreamTableRepository tableRepository,
                          OrderRepository orderRepository,
                          BillRepository billRepository) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
        this.flavourRepository = flavourRepository;
        this.tableRepository = tableRepository;
        this.orderRepository = orderRepository;
        this.billRepository = billRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody AuthRequest authRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        authRequest.getEmail(),
                        authRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(
                authentication.getName(),
                authentication.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "")
        );
        
        User user = userRepository.findByEmail(authRequest.getEmail()).orElseThrow();
        
        return ResponseEntity.ok(new AuthResponse(
                jwt,
                user.getEmail(),
                user.getName(),
                user.getRole().name()
        ));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody SignupRequest signupRequest) {
        if (userRepository.findByEmail(signupRequest.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Error: Email is already in use!");
        }

        if (signupRequest.getRole() != UserRole.OWNER) {
            return ResponseEntity.badRequest().body("Error: Only the Owner role is allowed to sign up publicly.");
        }

        User user = new User(
                signupRequest.getName(),
                signupRequest.getEmail(),
                passwordEncoder.encode(signupRequest.getPassword()),
                UserRole.OWNER
        );
        user.setPlainTextPassword(signupRequest.getPassword());

        User savedUser = userRepository.save(user);

        // Auto-initialize tables (1-8) for this Owner
        for (int i = 1; i <= 8; i++) {
            tableRepository.save(new IceCreamTable(String.valueOf(i), IceCreamTable.TableStatus.AVAILABLE, savedUser));
        }

        // Auto-initialize standard flavours for this Owner
        flavourRepository.save(new Flavour("Vanilla Supreme", 3.50, true, null, savedUser));
        flavourRepository.save(new Flavour("Double Chocolate", 3.75, true, null, savedUser));
        flavourRepository.save(new Flavour("Fresh Strawberry", 3.50, true, null, savedUser));
        flavourRepository.save(new Flavour("Mint Chocolate Chip", 4.00, true, null, savedUser));
        flavourRepository.save(new Flavour("Butter Pecan", 4.25, true, null, savedUser));
        flavourRepository.save(new Flavour("Classic Cookie Dough", 4.50, true, null, savedUser));
        flavourRepository.save(new Flavour("Mango Sorbet", 3.90, true, null, savedUser));
        flavourRepository.save(new Flavour("Rocky Road", 4.30, false, null, savedUser));

        return ResponseEntity.ok().body("User registered successfully!");
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody SignupRequest updateRequest, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body("Error: Not authenticated");
        }
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (updateRequest.getName() != null && !updateRequest.getName().trim().isEmpty()) {
            user.setName(updateRequest.getName());
            
            // Also update associated employee name if exists
            employeeRepository.findByUserEmail(email).ifPresent(emp -> {
                emp.setEmployeeName(updateRequest.getName());
                employeeRepository.save(emp);
            });
        }

        if (updateRequest.getPassword() != null && !updateRequest.getPassword().trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(updateRequest.getPassword()));
            user.setPlainTextPassword(updateRequest.getPassword());
        }

        userRepository.save(user);
        return ResponseEntity.ok().body("Profile updated successfully");
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUserDetails(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body("Error: Not authenticated");
        }
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        java.util.Map<String, Object> details = new java.util.HashMap<>();
        details.put("name", user.getName());
        details.put("email", user.getEmail());
        details.put("role", user.getRole().name());

        if (user.getRole() != UserRole.OWNER) {
            employeeRepository.findByUser(user).ifPresent(emp -> {
                details.put("salary", emp.getSalary());
            });
        }

        return ResponseEntity.ok(details);
    }

    @GetMapping("/dump")
    public ResponseEntity<?> dumpDatabase() {
        try {
            java.util.List<java.util.Map<String, Object>> usersList = new java.util.ArrayList<>();
            for (User u : userRepository.findAll()) {
                java.util.Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", u.getId());
                map.put("name", u.getName());
                map.put("email", u.getEmail());
                map.put("role", u.getRole().name());
                usersList.add(map);
            }

            java.util.List<java.util.Map<String, Object>> employeesList = new java.util.ArrayList<>();
            for (Employee e : employeeRepository.findAll()) {
                java.util.Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", e.getId());
                map.put("name", e.getEmployeeName());
                map.put("position", e.getPosition());
                map.put("salary", e.getSalary());
                map.put("userId", e.getUser() != null ? e.getUser().getId() : null);
                map.put("userEmail", e.getUser() != null ? e.getUser().getEmail() : null);
                map.put("ownerId", e.getOwner() != null ? e.getOwner().getId() : null);
                employeesList.add(map);
            }

            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("users", usersList);
            response.put("employees", employeesList);
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            return ResponseEntity.ok("Error: " + ex.getMessage());
        }
    }

    @DeleteMapping("/delete")
    @Transactional
    public ResponseEntity<?> deleteAccount(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body("Error: Not authenticated");
        }
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == UserRole.OWNER) {
            Long ownerId = user.getId();

            // 1. Delete all bills
            java.util.List<Bill> bills = billRepository.findByOwnerId(ownerId);
            billRepository.deleteAll(bills);

            // 2. Delete all orders
            java.util.List<Order> orders = orderRepository.findByOwnerId(ownerId);
            orderRepository.deleteAll(orders);

            // 3. Delete all flavours
            java.util.List<Flavour> flavours = flavourRepository.findByOwnerId(ownerId);
            flavourRepository.deleteAll(flavours);

            // 4. Delete all tables
            java.util.List<IceCreamTable> tables = tableRepository.findByOwnerId(ownerId);
            tableRepository.deleteAll(tables);

            // 5. Delete all employees (cascades to their User accounts)
            java.util.List<Employee> employees = employeeRepository.findByOwnerId(ownerId);
            employeeRepository.deleteAll(employees);

            // 6. Delete the owner user
            userRepository.delete(user);
        } else {
            Employee employee = employeeRepository.findByUser(user)
                    .orElseThrow(() -> new RuntimeException("Employee record not found"));

            // Re-assign orders served by this employee to the owner to avoid foreign key violations
            java.util.List<Order> servedOrders = orderRepository.findByServerId(user.getId());
            for (Order order : servedOrders) {
                order.setServer(employee.getOwner());
                orderRepository.save(order);
            }

            employeeRepository.delete(employee);
        }

        return ResponseEntity.ok().body("Account and all associated data deleted successfully!");
    }
}
