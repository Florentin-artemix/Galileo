package com.galileo.userprofile.controller;

import com.galileo.userprofile.dto.AddFavoriteDTO;
import com.galileo.userprofile.dto.FavoriteDTO;
import com.galileo.userprofile.service.FavoriteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class FavoriteController {
    
    private final FavoriteService favoriteService;
    
    /**
     * Récupérer tous les favoris d'un utilisateur
     */
    @GetMapping("/{firebaseUid}/favorites")
    public ResponseEntity<List<FavoriteDTO>> getFavorites(@PathVariable String firebaseUid) {
        log.info("Récupération des favoris pour: {}", firebaseUid);
        List<FavoriteDTO> favorites = favoriteService.getFavorites(firebaseUid);
        return ResponseEntity.ok(favorites);
    }
    
    /**
     * Récupérer les favoris avec pagination
     */
    @GetMapping("/{firebaseUid}/favorites/paginated")
    public ResponseEntity<Page<FavoriteDTO>> getFavoritesPaginated(
            @PathVariable String firebaseUid,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Récupération des favoris paginés pour: {} (page {}, size {})", firebaseUid, page, size);
        Page<FavoriteDTO> favorites = favoriteService.getFavoritesPaginated(
                firebaseUid, 
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity.ok(favorites);
    }
    
    /**
     * Ajouter une publication aux favoris
     */
    @PostMapping("/{firebaseUid}/favorites")
    public ResponseEntity<FavoriteDTO> addFavorite(
            @PathVariable String firebaseUid,
            @Valid @RequestBody AddFavoriteDTO addFavoriteDTO) {
        log.info("Ajout aux favoris pour {} : publication {}", firebaseUid, addFavoriteDTO.getPublicationId());
        FavoriteDTO favorite = favoriteService.addFavorite(firebaseUid, addFavoriteDTO);
        return ResponseEntity.ok(favorite);
    }
    
    /**
     * Retirer une publication des favoris
     */
    @DeleteMapping("/{firebaseUid}/favorites/{publicationId}")
    public ResponseEntity<Void> removeFavorite(
            @PathVariable String firebaseUid,
            @PathVariable Long publicationId) {
        log.info("Suppression du favori pour {} : publication {}", firebaseUid, publicationId);
        favoriteService.removeFavorite(firebaseUid, publicationId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Vérifier si une publication est en favori
     */
    @GetMapping("/{firebaseUid}/favorites/check/{publicationId}")
    public ResponseEntity<Map<String, Boolean>> isFavorite(
            @PathVariable String firebaseUid,
            @PathVariable Long publicationId) {
        boolean isFavorite = favoriteService.isFavorite(firebaseUid, publicationId);
        return ResponseEntity.ok(Map.of("isFavorite", isFavorite));
    }
}

