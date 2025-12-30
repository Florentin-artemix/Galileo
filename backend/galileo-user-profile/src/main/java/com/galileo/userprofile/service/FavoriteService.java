package com.galileo.userprofile.service;

import com.galileo.userprofile.dto.AddFavoriteDTO;
import com.galileo.userprofile.dto.FavoriteDTO;
import com.galileo.userprofile.entity.Favorite;
import com.galileo.userprofile.repository.FavoriteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FavoriteService {
    
    private final FavoriteRepository favoriteRepository;
    
    public List<FavoriteDTO> getFavorites(String firebaseUid) {
        return favoriteRepository.findByFirebaseUidOrderByCreatedAtDesc(firebaseUid)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    public Page<FavoriteDTO> getFavoritesPaginated(String firebaseUid, Pageable pageable) {
        return favoriteRepository.findByFirebaseUid(firebaseUid, pageable)
                .map(this::toDTO);
    }
    
    @Transactional
    public FavoriteDTO addFavorite(String firebaseUid, AddFavoriteDTO addFavoriteDTO) {
        // Vérifier si déjà en favori
        if (favoriteRepository.existsByFirebaseUidAndPublicationId(firebaseUid, addFavoriteDTO.getPublicationId())) {
            log.info("Publication {} déjà en favori pour l'utilisateur {}", 
                    addFavoriteDTO.getPublicationId(), firebaseUid);
            return favoriteRepository.findByFirebaseUidAndPublicationId(firebaseUid, addFavoriteDTO.getPublicationId())
                    .map(this::toDTO)
                    .orElseThrow();
        }
        
        Favorite favorite = Favorite.builder()
                .firebaseUid(firebaseUid)
                .publicationId(addFavoriteDTO.getPublicationId())
                .publicationTitle(addFavoriteDTO.getPublicationTitle())
                .publicationDomain(addFavoriteDTO.getPublicationDomain())
                .build();
        
        favorite = favoriteRepository.save(favorite);
        log.info("Publication {} ajoutée aux favoris pour l'utilisateur {}", 
                addFavoriteDTO.getPublicationId(), firebaseUid);
        
        return toDTO(favorite);
    }
    
    @Transactional
    public void removeFavorite(String firebaseUid, Long publicationId) {
        favoriteRepository.deleteByFirebaseUidAndPublicationId(firebaseUid, publicationId);
        log.info("Publication {} retirée des favoris pour l'utilisateur {}", publicationId, firebaseUid);
    }
    
    public boolean isFavorite(String firebaseUid, Long publicationId) {
        return favoriteRepository.existsByFirebaseUidAndPublicationId(firebaseUid, publicationId);
    }
    
    private FavoriteDTO toDTO(Favorite favorite) {
        return FavoriteDTO.builder()
                .id(favorite.getId())
                .publicationId(favorite.getPublicationId())
                .publicationTitle(favorite.getPublicationTitle())
                .publicationDomain(favorite.getPublicationDomain())
                .createdAt(favorite.getCreatedAt())
                .build();
    }
}

