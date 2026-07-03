package com.onescoop.service;

import com.onescoop.entity.Flavour;
import com.onescoop.entity.User;
import com.onescoop.entity.UserRole;
import com.onescoop.repository.FlavourRepository;
import com.onescoop.security.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Optional;

@Service
public class FlavourService {

    private final FlavourRepository flavourRepository;
    private final SecurityUtils securityUtils;

    public FlavourService(FlavourRepository flavourRepository, SecurityUtils securityUtils) {
        this.flavourRepository = flavourRepository;
        this.securityUtils = securityUtils;
    }

    public List<Flavour> getAllFlavours() {
        User owner = securityUtils.getOwnerOfCurrentUser();
        return flavourRepository.findByOwnerId(owner.getId());
    }

    public Optional<Flavour> getFlavourById(Long id) {
        User owner = securityUtils.getOwnerOfCurrentUser();
        return flavourRepository.findById(id)
                .filter(f -> f.getOwner() != null && f.getOwner().getId().equals(owner.getId()));
    }

    public Flavour saveFlavour(Flavour flavour) {
        User owner = securityUtils.getOwnerOfCurrentUser();
        if (owner.getRole() != UserRole.OWNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only owners can manage flavours");
        }
        
        Optional<Flavour> existing = flavourRepository.findByOwnerIdAndFlavourName(owner.getId(), flavour.getFlavourName());
        if (existing.isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Flavour name already exists");
        }
        
        flavour.setOwner(owner);
        return flavourRepository.save(flavour);
    }

    public Flavour updateFlavour(Long id, Flavour flavourDetails) {
        User owner = securityUtils.getOwnerOfCurrentUser();
        if (owner.getRole() != UserRole.OWNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only owners can manage flavours");
        }
        
        Flavour flavour = flavourRepository.findById(id)
                .filter(f -> f.getOwner() != null && f.getOwner().getId().equals(owner.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Flavour not found with id: " + id));

        Optional<Flavour> nameConflict = flavourRepository.findByOwnerIdAndFlavourName(owner.getId(), flavourDetails.getFlavourName());
        if (nameConflict.isPresent() && !nameConflict.get().getId().equals(flavour.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Flavour name already in use");
        }

        flavour.setFlavourName(flavourDetails.getFlavourName());
        flavour.setPrice(flavourDetails.getPrice());
        flavour.setAvailability(flavourDetails.getAvailability());
        flavour.setImageUrl(flavourDetails.getImageUrl());

        return flavourRepository.save(flavour);
    }

    public void deleteFlavour(Long id) {
        User owner = securityUtils.getOwnerOfCurrentUser();
        if (owner.getRole() != UserRole.OWNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only owners can manage flavours");
        }
        
        Flavour flavour = flavourRepository.findById(id)
                .filter(f -> f.getOwner() != null && f.getOwner().getId().equals(owner.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Flavour not found with id: " + id));
        flavourRepository.delete(flavour);
    }
}
