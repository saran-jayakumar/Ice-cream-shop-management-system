package com.onescoop;

import com.onescoop.entity.*;
import com.onescoop.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;

@Component
public class OneScoopDataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final IceCreamTableRepository tableRepository;
    private final FlavourRepository flavourRepository;
    private final PasswordEncoder passwordEncoder;

    public OneScoopDataLoader(UserRepository userRepository,
                              EmployeeRepository employeeRepository,
                              IceCreamTableRepository tableRepository,
                              FlavourRepository flavourRepository,
                              PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.tableRepository = tableRepository;
        this.flavourRepository = flavourRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // Copy logo from Images directory to frontend public assets on start
        try {
            File src = new File("../Images/logo.png");
            File dest = new File("../frontend/public/logo.png");
            if (src.exists()) {
                dest.getParentFile().mkdirs();
                Files.copy(src.toPath(), dest.toPath(), StandardCopyOption.REPLACE_EXISTING);
                System.out.println("Logo copied successfully from Java DataLoader startup!");
            } else {
                System.out.println("Source logo file not found at " + src.getAbsolutePath());
            }
        } catch (Exception e) {
            System.err.println("Failed to copy logo in Java startup: " + e.getMessage());
        }

        // Seed Users & Linked Employees
        if (userRepository.count() == 0 && employeeRepository.count() == 0) {
            // 1. Seed Owner (independent account)
            User ownerObj = new User("Alice Owner", "owner@onescoop.com", passwordEncoder.encode("owner123"), UserRole.OWNER);
            ownerObj.setPlainTextPassword("owner123");
            User owner = userRepository.save(ownerObj);

            // 2. Seed Assistant Manager (linked)
            User managerUser = new User("Emma Manager", "manager@onescoop.com", passwordEncoder.encode("manager123"), UserRole.ASSISTANT_MANAGER);
            managerUser.setPlainTextPassword("manager123");
            Employee managerEmp = new Employee("Emma Manager", "ASSISTANT_MANAGER", 4800.0, "Evening", managerUser);
            managerEmp.setOwner(owner);
            employeeRepository.save(managerEmp);

            // 3. Seed Cashier (linked)
            User cashierUser = new User("Charlie Cashier", "cashier@onescoop.com", passwordEncoder.encode("cashier123"), UserRole.CASHIER);
            cashierUser.setPlainTextPassword("cashier123");
            Employee cashierEmp = new Employee("Charlie Cashier", "CASHIER", 3500.0, "Morning", cashierUser);
            cashierEmp.setOwner(owner);
            employeeRepository.save(cashierEmp);

            // 4. Seed Server 1 (linked)
            User serverUser1 = new User("David Server", "server@onescoop.com", passwordEncoder.encode("server123"), UserRole.SERVER);
            serverUser1.setPlainTextPassword("server123");
            Employee serverEmp1 = new Employee("David Server", "SERVER", 3000.0, "Morning", serverUser1);
            serverEmp1.setOwner(owner);
            employeeRepository.save(serverEmp1);

            // 5. Seed Server 2 (linked)
            User serverUser2 = new User("John Server", "john@onescoop.com", passwordEncoder.encode("john123"), UserRole.SERVER);
            serverUser2.setPlainTextPassword("john123");
            Employee serverEmp2 = new Employee("John Server", "SERVER", 3200.0, "Evening", serverUser2);
            serverEmp2.setOwner(owner);
            employeeRepository.save(serverEmp2);

            System.out.println("Default users & linked employees seeded successfully!");
        }

        // Seed IceCreamTables
        User owner = userRepository.findByEmail("owner@onescoop.com").orElse(null);

        if (tableRepository.count() == 0 && owner != null) {
            for (int i = 1; i <= 8; i++) {
                tableRepository.save(new IceCreamTable(String.valueOf(i), IceCreamTable.TableStatus.AVAILABLE, owner));
            }
            System.out.println("Default tables (1-8) seeded successfully!");
        }

        // Seed Flavours
        if (flavourRepository.count() == 0 && owner != null) {
            flavourRepository.save(new Flavour("Vanilla Supreme", 3.50, true, null, owner));
            flavourRepository.save(new Flavour("Double Chocolate", 3.75, true, null, owner));
            flavourRepository.save(new Flavour("Fresh Strawberry", 3.50, true, null, owner));
            flavourRepository.save(new Flavour("Mint Chocolate Chip", 4.00, true, null, owner));
            flavourRepository.save(new Flavour("Butter Pecan", 4.25, true, null, owner));
            flavourRepository.save(new Flavour("Classic Cookie Dough", 4.50, true, null, owner));
            flavourRepository.save(new Flavour("Mango Sorbet", 3.90, true, null, owner));
            flavourRepository.save(new Flavour("Rocky Road", 4.30, false, null, owner));
            System.out.println("Default ice cream flavours seeded successfully!");
        }
    }
}
