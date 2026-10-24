package com.galileo.users.controller;

import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import com.galileo.auth.repository.UserRepository;
import com.galileo.auth.security.CustomUserDetails;
import com.galileo.common.dto.ApiResponse;
import com.galileo.common.exception.BadRequestException;
import com.galileo.common.exception.ResourceNotFoundException;
import com.galileo.publications.entity.Publication;
import com.galileo.publications.repository.PublicationRepository;
import com.galileo.recommendations.entity.Favorite;
import com.galileo.recommendations.entity.ReadingHistory;
import com.galileo.recommendations.repository.FavoriteRepository;
import com.galileo.recommendations.repository.ReadingHistoryRepository;
import com.galileo.storage.service.StorageService;
import com.galileo.users.dto.TeamMemberDTO;
import com.galileo.users.entity.UserProfile;
import com.galileo.users.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequiredArgsConstructor
public class UserProfileController {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final FavoriteRepository favoriteRepository;
    private final ReadingHistoryRepository readingHistoryRepository;
    private final PublicationRepository publicationRepository;
    private final StorageService storageService;

    // ==========================================
    // PROFIL UTILISATEUR (/api/users/me)
    // ==========================================

    @GetMapping("/api/users/me")
    public ResponseEntity<Map<String, Object>> getMyProfile(@AuthenticationPrincipal CustomUserDetails userDetails) {
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", userDetails.getId()));
        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> userProfileRepository.save(UserProfile.builder().user(user).displayName(user.getEmail().split("@")[0]).build()));

        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("uid", String.valueOf(user.getId()));
        map.put("email", user.getEmail());
        map.put("role", user.getRole().name());
        map.put("name", profile.getDisplayName() != null ? profile.getDisplayName() : user.getEmail().split("@")[0]);
        map.put("displayName", profile.getDisplayName());
        map.put("description", profile.getBio());
        map.put("bio", profile.getBio());
        map.put("imageUrl", profile.getAvatarUrl());
        map.put("department", profile.getDepartment());
        map.put("program", profile.getProgram());
        map.put("websiteUrl", profile.getWebsiteUrl());
        map.put("orcid", profile.getOrcid());
        map.put("exists", true);
        return ResponseEntity.ok(map);
    }

    @PostMapping("/api/users/me")
    public ResponseEntity<Map<String, Object>> updateMyProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, Object> body
    ) {
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", userDetails.getId()));
        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> UserProfile.builder().user(user).build());

        if (body.containsKey("name") || body.containsKey("displayName")) {
            String name = (String) body.getOrDefault("displayName", body.get("name"));
            profile.setDisplayName(name);
        }
        if (body.containsKey("description") || body.containsKey("bio")) {
            String bio = (String) body.getOrDefault("bio", body.get("description"));
            profile.setBio(bio);
        }
        if (body.containsKey("department")) profile.setDepartment((String) body.get("department"));
        if (body.containsKey("program")) profile.setProgram((String) body.get("program"));
        if (body.containsKey("websiteUrl")) profile.setWebsiteUrl((String) body.get("websiteUrl"));
        if (body.containsKey("orcid")) profile.setOrcid((String) body.get("orcid"));

        userProfileRepository.save(profile);
        return getMyProfile(userDetails);
    }

    @PostMapping("/api/profile/photo")
    public ResponseEntity<Map<String, Object>> uploadPhoto(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam("file") MultipartFile file
    ) {
        if (file.isEmpty()) {
            throw new BadRequestException("Fichier manquant");
        }

        String key = "avatars/" + userDetails.getId() + "/" + UUID.randomUUID() + "-" + file.getOriginalFilename();
        try (InputStream is = file.getInputStream()) {
            storageService.uploadFile(key, is, file.getSize(), file.getContentType());
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de l'enregistrement de l'avatar", e);
        }

        String url = storageService.generatePresignedUrl(key, 1440); // 24 heures

        UserProfile profile = userProfileRepository.findByUserId(userDetails.getId()).orElse(null);
        if (profile != null) {
            profile.setAvatarUrl(url);
            userProfileRepository.save(profile);
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "r2Key", key,
                "imageUrl", url,
                "signedUrl", url
        ));
    }

    @DeleteMapping("/api/profile/photo")
    public ResponseEntity<ApiResponse<Void>> deletePhoto(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String r2Key
    ) {
        if (r2Key != null) {
            storageService.deleteFile(r2Key);
        }
        UserProfile profile = userProfileRepository.findByUserId(userDetails.getId()).orElse(null);
        if (profile != null) {
            profile.setAvatarUrl(null);
            userProfileRepository.save(profile);
        }
        return ResponseEntity.ok(ApiResponse.ok("Photo supprimée"));
    }

    // ==========================================
    // FAVORIS (/api/userprofile/{userId}/favorites)
    // ==========================================

    @GetMapping({"/api/userprofile/{userId}/favorites", "/api/favorites"})
    public ResponseEntity<List<Map<String, Object>>> getFavorites(
            @PathVariable(required = false) String userId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long targetId = userId != null ? resolveUserId(userId, userDetails) : userDetails.getId();
        List<Favorite> favorites = favoriteRepository.findByUserId(targetId);
        List<Map<String, Object>> list = favorites.stream().map(f -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", f.getId());
            m.put("userId", String.valueOf(f.getUser().getId()));
            m.put("publicationId", f.getPublication().getId());
            m.put("publicationTitle", f.getPublication().getTitle());
            m.put("publicationDomain", f.getPublication().getDomain() != null ? f.getPublication().getDomain().getName() : "");
            m.put("createdAt", f.getCreatedAt() != null ? f.getCreatedAt().toString() : "");
            return m;
        }).toList();

        return ResponseEntity.ok(list);
    }

    @GetMapping("/api/userprofile/{userId}/favorites/paginated")
    public ResponseEntity<Page<Map<String, Object>>> getFavoritesPaginated(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long targetId = resolveUserId(userId, userDetails);
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by("createdAt").descending());
        Page<Favorite> favPage = favoriteRepository.findByUserId(targetId, pageable);

        Page<Map<String, Object>> mapped = favPage.map(f -> Map.of(
                "id", f.getId(),
                "userId", String.valueOf(f.getUser().getId()),
                "publicationId", f.getPublication().getId(),
                "publicationTitle", f.getPublication().getTitle(),
                "publicationDomain", f.getPublication().getDomain() != null ? f.getPublication().getDomain().getName() : "",
                "createdAt", f.getCreatedAt() != null ? f.getCreatedAt().toString() : ""
        ));
        return ResponseEntity.ok(mapped);
    }

    @PostMapping({"/api/userprofile/{userId}/favorites", "/api/favorites"})
    public ResponseEntity<Map<String, Object>> addFavorite(
            @PathVariable(required = false) String userId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long targetId = userId != null ? resolveUserId(userId, userDetails) : userDetails.getId();
        Object pubIdObj = body.get("publicationId");
        if (pubIdObj == null) throw new BadRequestException("publicationId est requis");

        Long publicationId = Long.parseLong(pubIdObj.toString());
        if (favoriteRepository.existsByUserIdAndPublicationId(targetId, publicationId)) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Déjà dans les favoris"));
        }

        User user = userRepository.findById(targetId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", targetId));
        Publication publication = publicationRepository.findById(publicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Publication", "id", publicationId));

        Favorite fav = Favorite.builder()
                .user(user)
                .publication(publication)
                .build();
        fav = favoriteRepository.save(fav);

        return ResponseEntity.ok(Map.of(
                "id", fav.getId(),
                "userId", String.valueOf(targetId),
                "publicationId", publicationId,
                "publicationTitle", publication.getTitle(),
                "createdAt", fav.getCreatedAt() != null ? fav.getCreatedAt().toString() : ""
        ));
    }

    @DeleteMapping({"/api/userprofile/{userId}/favorites/{publicationId}", "/api/favorites/{publicationId}"})
    public ResponseEntity<ApiResponse<Void>> removeFavorite(
            @PathVariable(required = false) String userId,
            @PathVariable Long publicationId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long targetId = userId != null ? resolveUserId(userId, userDetails) : userDetails.getId();
        favoriteRepository.findByUserIdAndPublicationId(targetId, publicationId)
                .ifPresent(favoriteRepository::delete);
        return ResponseEntity.ok(ApiResponse.ok("Retiré des favoris"));
    }

    @GetMapping("/api/userprofile/{userId}/favorites/check/{publicationId}")
    public ResponseEntity<Boolean> isFavorite(
            @PathVariable String userId,
            @PathVariable Long publicationId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long targetId = resolveUserId(userId, userDetails);
        boolean exists = favoriteRepository.existsByUserIdAndPublicationId(targetId, publicationId);
        return ResponseEntity.ok(exists);
    }

    // ==========================================
    // HISTORIQUE DE LECTURE (/api/userprofile/{userId}/history)
    // ==========================================

    @GetMapping({"/api/userprofile/{userId}/history", "/api/userprofile/{userId}/history/recent", "/api/reading-history"})
    public ResponseEntity<List<Map<String, Object>>> getReadingHistory(
            @PathVariable(required = false) String userId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long targetId = userId != null ? resolveUserId(userId, userDetails) : userDetails.getId();
        List<ReadingHistory> list = readingHistoryRepository.findByUserIdOrderByReadAtDesc(targetId);

        List<Map<String, Object>> result = list.stream().map(h -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", h.getId());
            m.put("userId", String.valueOf(h.getUser().getId()));
            m.put("publicationId", h.getPublication().getId());
            m.put("publicationTitle", h.getPublication().getTitle());
            m.put("publicationDomain", h.getPublication().getDomain() != null ? h.getPublication().getDomain().getName() : "");
            m.put("readAt", h.getReadAt() != null ? h.getReadAt().toString() : "");
            m.put("readProgress", h.getCompleted() != null && h.getCompleted() ? 100 : 50);
            return m;
        }).toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/api/userprofile/{userId}/history/paginated")
    public ResponseEntity<Page<Map<String, Object>>> getReadingHistoryPaginated(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long targetId = resolveUserId(userId, userDetails);
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        Page<ReadingHistory> histPage = readingHistoryRepository.findByUserIdOrderByReadAtDesc(targetId, pageable);

        Page<Map<String, Object>> mapped = histPage.map(h -> Map.of(
                "id", h.getId(),
                "userId", String.valueOf(h.getUser().getId()),
                "publicationId", h.getPublication().getId(),
                "publicationTitle", h.getPublication().getTitle(),
                "readAt", h.getReadAt() != null ? h.getReadAt().toString() : "",
                "readProgress", h.getCompleted() != null && h.getCompleted() ? 100 : 50
        ));
        return ResponseEntity.ok(mapped);
    }

    @PostMapping({"/api/userprofile/{userId}/history", "/api/reading-history"})
    public ResponseEntity<Map<String, Object>> recordReading(
            @PathVariable(required = false) String userId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long targetId = userId != null ? resolveUserId(userId, userDetails) : userDetails.getId();
        Object pubIdObj = body.get("publicationId");
        if (pubIdObj == null) throw new BadRequestException("publicationId est requis");

        Long publicationId = Long.parseLong(pubIdObj.toString());
        User user = userRepository.findById(targetId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", targetId));
        Publication publication = publicationRepository.findById(publicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Publication", "id", publicationId));

        ReadingHistory rh = readingHistoryRepository.findByUserIdAndPublicationId(targetId, publicationId)
                .orElseGet(() -> ReadingHistory.builder().user(user).publication(publication).build());

        rh.setReadAt(LocalDateTime.now());
        rh = readingHistoryRepository.save(rh);

        return ResponseEntity.ok(Map.of(
                "id", rh.getId(),
                "userId", String.valueOf(targetId),
                "publicationId", publicationId,
                "publicationTitle", publication.getTitle(),
                "readAt", rh.getReadAt().toString()
        ));
    }

    @PatchMapping("/api/userprofile/{userId}/history/{publicationId}/progress")
    public ResponseEntity<ApiResponse<Void>> updateReadingProgress(
            @PathVariable String userId,
            @PathVariable Long publicationId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long targetId = resolveUserId(userId, userDetails);
        readingHistoryRepository.findByUserIdAndPublicationId(targetId, publicationId).ifPresent(h -> {
            Object prog = body.get("progress");
            if (prog instanceof Number && ((Number) prog).intValue() >= 100) {
                h.setCompleted(true);
            }
            h.setReadAt(LocalDateTime.now());
            readingHistoryRepository.save(h);
        });
        return ResponseEntity.ok(ApiResponse.ok("Progression mise à jour"));
    }

    private Long resolveUserId(String userIdStr, CustomUserDetails userDetails) {
        if ("me".equalsIgnoreCase(userIdStr) || userDetails.getId().toString().equals(userIdStr)) {
            return userDetails.getId();
        }
        try {
            return Long.parseLong(userIdStr);
        } catch (NumberFormatException e) {
            return userDetails.getId();
        }
    }

    // ==========================================
    // ÉQUIPE PUBLIQUE (/api/public/team)
    // ==========================================

    private static final Set<Role> INSTITUTIONAL_ROLES = Set.of(
            Role.ADMIN,
            Role.STAFF,
            Role.TEACHER,
            Role.RESEARCHER
    );

    @GetMapping("/api/public/team")
    public ResponseEntity<List<TeamMemberDTO>> getPublicTeam() {
        List<User> users = userRepository.findByRoleInAndIsActiveTrueOrderByIdAsc(INSTITUTIONAL_ROLES);
        return ResponseEntity.ok(mapUsersToTeamDTO(users));
    }

    @GetMapping("/api/public/team/role/{role}")
    public ResponseEntity<List<TeamMemberDTO>> getPublicTeamByRole(@PathVariable String role) {
        if (role == null || role.trim().isEmpty()) {
            throw new BadRequestException("Le rôle est obligatoire");
        }

        Role parsedRole;
        try {
            parsedRole = Role.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Rôle inconnu : " + role);
        }

        if (!INSTITUTIONAL_ROLES.contains(parsedRole)) {
            throw new BadRequestException("Le rôle spécifié ne fait pas partie de l'équipe publique : " + role);
        }

        List<User> users = userRepository.findByRoleAndIsActiveTrueOrderByIdAsc(parsedRole);
        return ResponseEntity.ok(mapUsersToTeamDTO(users));
    }

    private List<TeamMemberDTO> mapUsersToTeamDTO(List<User> users) {
        if (users.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> userIds = users.stream().map(User::getId).toList();
        Map<Long, UserProfile> profileMap = userProfileRepository.findByUserIdIn(userIds).stream()
                .filter(p -> p.getUser() != null)
                .collect(Collectors.toMap(p -> p.getUser().getId(), p -> p, (p1, p2) -> p1));

        return users.stream().map(u -> {
            UserProfile p = profileMap.get(u.getId());
            String displayName = (p != null && p.getDisplayName() != null && !p.getDisplayName().trim().isEmpty())
                    ? p.getDisplayName().trim()
                    : u.getEmail().split("@")[0];

            String avatarUrl;
            if (p != null && p.getAvatarUrl() != null && !p.getAvatarUrl().trim().isEmpty()) {
                avatarUrl = p.getAvatarUrl().trim();
            } else {
                avatarUrl = "https://ui-avatars.com/api/?name=" + URLEncoder.encode(displayName, StandardCharsets.UTF_8)
                        + "&background=random&size=200";
            }

            String bio = (p != null && p.getBio() != null) ? p.getBio() : null;
            String department = (p != null && p.getDepartment() != null) ? p.getDepartment() : null;

            return TeamMemberDTO.builder()
                    .id(u.getId())
                    .uid(String.valueOf(u.getId()))
                    .displayName(displayName)
                    .email(u.getEmail())
                    .role(u.getRole().name())
                    .bio(bio)
                    .department(department)
                    .avatarUrl(avatarUrl)
                    .location(null)
                    .phone(null)
                    .build();
        }).toList();
    }
}
