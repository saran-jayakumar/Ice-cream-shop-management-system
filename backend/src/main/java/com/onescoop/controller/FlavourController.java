package com.onescoop.controller;

import com.onescoop.entity.Flavour;
import com.onescoop.service.FlavourService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/flavours")
public class FlavourController {

    private final FlavourService flavourService;

    public FlavourController(FlavourService flavourService) {
        this.flavourService = flavourService;
    }

    @GetMapping
    public List<Flavour> getAllFlavours() {
        return flavourService.getAllFlavours();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Flavour> getFlavourById(@PathVariable Long id) {
        return flavourService.getFlavourById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ASSISTANT_MANAGER')")
    public Flavour createFlavour(@RequestBody Flavour flavour) {
        return flavourService.saveFlavour(flavour);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ASSISTANT_MANAGER')")
    public ResponseEntity<Flavour> updateFlavour(@PathVariable Long id, @RequestBody Flavour flavourDetails) {
        try {
            return ResponseEntity.ok(flavourService.updateFlavour(id, flavourDetails));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ASSISTANT_MANAGER')")
    public ResponseEntity<?> deleteFlavour(@PathVariable Long id) {
        try {
            flavourService.deleteFlavour(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
