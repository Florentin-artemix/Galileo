package com.galileo.userprofile.service;

import com.galileo.userprofile.dto.UpdateProfileDTO;
import com.galileo.userprofile.dto.UserProfileDTO;
import com.galileo.userprofile.entity.UserProfile;
import com.galileo.userprofile.repository.FavoriteRepository;
import com.galileo.userprofile.repository.ReadingHistoryRepository;
import com.galileo.userprofile.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserProfileService {
    
    private final UserProfileRepository userProfileRepository;
    private final FavoriteRepository favoriteRepository;
    private final ReadingHistoryRepository readingHistoryRepository;
    
    public UserProfileDTO getProfile(String firebaseUid) {
        UserProfile profile = userProfileRepository.findByFirebaseUid(firebaseUid)
                .orElseGet(() -> createDefaultProfile(firebaseUid));
        
        return enrichWithStats(profile);
    }
    
    @Transactional
    public UserProfileDTO updateProfile(String firebaseUid, UpdateProfileDTO updateDTO) {
        UserProfile profile = userProfileRepository.findByFirebaseUid(firebaseUid)
                .orElseGet(() -> createDefaultProfile(firebaseUid));
        
        if (updateDTO.getDisplayName() != null) {
            profile.setDisplayName(updateDTO.getDisplayName());
        }
        if (updateDTO.getBio() != null) {
            profile.setBio(updateDTO.getBio());
        }
        if (updateDTO.getAvatarUrl() != null) {
            profile.setAvatarUrl(updateDTO.getAvatarUrl());
        }
        if (updateDTO.getInstitution() != null) {
            profile.setInstitution(updateDTO.getInstitution());
        }
        if (updateDTO.getFieldOfStudy() != null) {
            profile.setFieldOfStudy(updateDTO.getFieldOfStudy());
        }
        if (updateDTO.getPreferredLanguage() != null) {
            profile.setPreferredLanguage(updateDTO.getPreferredLanguage());
        }
        if (updateDTO.getDarkModeEnabled() != null) {
            profile.setDarkModeEnabled(updateDTO.getDarkModeEnabled());
        }
        
        profile = userProfileRepository.save(profile);
        log.info("Profil mis à jour pour l'utilisateur: {}", firebaseUid);
        
        return enrichWithStats(profile);
    }
    
    @Transactional
    public UserProfileDTO createOrUpdateProfile(String firebaseUid, UpdateProfileDTO updateDTO) {
        return updateProfile(firebaseUid, updateDTO);
    }
    
    private UserProfile createDefaultProfile(String firebaseUid) {
        UserProfile newProfile = UserProfile.builder()
                .firebaseUid(firebaseUid)
                .preferredLanguage("fr")
                .darkModeEnabled(false)
                .build();
        
        newProfile = userProfileRepository.save(newProfile);
        log.info("Nouveau profil créé pour l'utilisateur: {}", firebaseUid);
        
        return newProfile;
    }
    
    private UserProfileDTO enrichWithStats(UserProfile profile) {
        long favoritesCount = favoriteRepository.countByFirebaseUid(profile.getFirebaseUid());
        long publicationsRead = readingHistoryRepository.countDistinctPublicationsRead(profile.getFirebaseUid());
        Long totalReadingTimeSeconds = readingHistoryRepository.getTotalReadingTime(profile.getFirebaseUid());
        
        return UserProfileDTO.builder()
                .id(profile.getId())
                .firebaseUid(profile.getFirebaseUid())
                .displayName(profile.getDisplayName())
                .bio(profile.getBio())
                .avatarUrl(profile.getAvatarUrl())
                .institution(profile.getInstitution())
                .fieldOfStudy(profile.getFieldOfStudy())
                .preferredLanguage(profile.getPreferredLanguage())
                .darkModeEnabled(profile.getDarkModeEnabled())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .favoritesCount(favoritesCount)
                .publicationsReadCount(publicationsRead)
                .totalReadingTimeMinutes(totalReadingTimeSeconds != null ? totalReadingTimeSeconds / 60 : 0L)
                .build();
    }
}

