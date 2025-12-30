package com.galileo.userprofile.controller;

import com.galileo.userprofile.dto.UpdateProfileDTO;
import com.galileo.userprofile.dto.UserProfileDTO;
import com.galileo.userprofile.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class UserProfileController {
    
    private final UserProfileService userProfileService;
    
    /**
     * Récupérer le profil d'un utilisateur
     */
    @GetMapping("/{firebaseUid}/profile")
    public ResponseEntity<UserProfileDTO> getProfile(@PathVariable String firebaseUid) {
        log.info("Récupération du profil pour: {}", firebaseUid);
        UserProfileDTO profile = userProfileService.getProfile(firebaseUid);
        return ResponseEntity.ok(profile);
    }
    
    /**
     * Mettre à jour le profil d'un utilisateur
     */
    @PutMapping("/{firebaseUid}/profile")
    public ResponseEntity<UserProfileDTO> updateProfile(
            @PathVariable String firebaseUid,
            @Valid @RequestBody UpdateProfileDTO updateDTO) {
        log.info("Mise à jour du profil pour: {}", firebaseUid);
        UserProfileDTO profile = userProfileService.updateProfile(firebaseUid, updateDTO);
        return ResponseEntity.ok(profile);
    }
    
    /**
     * Créer ou mettre à jour le profil (upsert)
     */
    @PostMapping("/{firebaseUid}/profile")
    public ResponseEntity<UserProfileDTO> createOrUpdateProfile(
            @PathVariable String firebaseUid,
            @Valid @RequestBody UpdateProfileDTO updateDTO) {
        log.info("Création/mise à jour du profil pour: {}", firebaseUid);
        UserProfileDTO profile = userProfileService.createOrUpdateProfile(firebaseUid, updateDTO);
        return ResponseEntity.ok(profile);
    }
}

