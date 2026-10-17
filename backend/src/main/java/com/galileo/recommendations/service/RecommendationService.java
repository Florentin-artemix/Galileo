package com.galileo.recommendations.service;

import com.galileo.auth.entity.User;
import com.galileo.auth.repository.UserRepository;
import com.galileo.common.exception.BadRequestException;
import com.galileo.common.exception.ResourceNotFoundException;
import com.galileo.publications.dto.PublicationDTO;
import com.galileo.publications.entity.Domain;
import com.galileo.publications.entity.Publication;
import com.galileo.publications.entity.PublicationAuthor;
import com.galileo.publications.entity.PublicationKeyword;
import com.galileo.publications.entity.PublicationStatus;
import com.galileo.publications.repository.DomainRepository;
import com.galileo.publications.repository.PublicationAuthorRepository;
import com.galileo.publications.repository.PublicationKeywordRepository;
import com.galileo.publications.repository.PublicationRepository;
import com.galileo.recommendations.entity.Favorite;
import com.galileo.recommendations.entity.FollowedAuthor;
import com.galileo.recommendations.entity.FollowedTopic;
import com.galileo.recommendations.entity.ReadingHistory;
import com.galileo.recommendations.entity.Recommendation;
import com.galileo.recommendations.repository.FavoriteRepository;
import com.galileo.recommendations.repository.FollowedAuthorRepository;
import com.galileo.recommendations.repository.FollowedTopicRepository;
import com.galileo.recommendations.repository.ReadingHistoryRepository;
import com.galileo.recommendations.repository.RecommendationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final FavoriteRepository favoriteRepository;
    private final FollowedAuthorRepository followedAuthorRepository;
    private final FollowedTopicRepository followedTopicRepository;
    private final RecommendationRepository recommendationRepository;
    private final ReadingHistoryRepository readingHistoryRepository;
    private final PublicationRepository publicationRepository;
    private final PublicationAuthorRepository authorRepository;
    private final PublicationKeywordRepository keywordRepository;
    private final DomainRepository domainRepository;
    private final UserRepository userRepository;

    @Transactional
    public void followAuthor(Long userId, Long followedUserId) {
        if (userId.equals(followedUserId)) {
            throw new BadRequestException("Vous ne pouvez pas vous suivre vous-même");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", userId));
        User followed = userRepository.findById(followedUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Auteur", "id", followedUserId));

        if (followedAuthorRepository.findByUserIdAndFollowedUserId(userId, followedUserId).isEmpty()) {
            FollowedAuthor fa = FollowedAuthor.builder()
                    .user(user)
                    .followedUser(followed)
                    .build();
            followedAuthorRepository.save(fa);
        }
    }

    @Transactional
    public void unfollowAuthor(Long userId, Long followedUserId) {
        followedAuthorRepository.deleteByUserIdAndFollowedUserId(userId, followedUserId);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getFollowedAuthors(Long userId) {
        List<FollowedAuthor> list = followedAuthorRepository.findByUserId(userId);
        return list.stream().map(fa -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", fa.getId());
            m.put("authorId", fa.getFollowedUser().getId());
            m.put("authorEmail", fa.getFollowedUser().getEmail());
            m.put("createdAt", fa.getCreatedAt() != null ? fa.getCreatedAt().toString() : "");
            return m;
        }).toList();
    }

    @Transactional
    public void followTopic(Long userId, String topic, Long domainId) {
        if (topic == null || topic.trim().isEmpty()) {
            throw new BadRequestException("Le thème à suivre ne peut pas être vide");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", userId));

        Domain domain = domainId != null ? domainRepository.findById(domainId).orElse(null) : null;

        if (followedTopicRepository.findByUserIdAndTopic(userId, topic.trim()).isEmpty()) {
            FollowedTopic ft = FollowedTopic.builder()
                    .user(user)
                    .topic(topic.trim())
                    .domain(domain)
                    .build();
            followedTopicRepository.save(ft);
        }
    }

    @Transactional
    public void unfollowTopic(Long userId, String topic) {
        followedTopicRepository.deleteByUserIdAndTopic(userId, topic.trim());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getFollowedTopics(Long userId) {
        List<FollowedTopic> list = followedTopicRepository.findByUserId(userId);
        return list.stream().map(ft -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", ft.getId());
            m.put("topic", ft.getTopic());
            m.put("domainId", ft.getDomain() != null ? ft.getDomain().getId() : null);
            m.put("domainName", ft.getDomain() != null ? ft.getDomain().getName() : null);
            m.put("createdAt", ft.getCreatedAt() != null ? ft.getCreatedAt().toString() : "");
            return m;
        }).toList();
    }

    @Transactional
    public List<Map<String, Object>> getPersonalizedRecommendations(Long userId, int limit) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", userId));

        int fetchLimit = limit > 0 ? Math.min(limit, 20) : 10;

        // 1. Découverte des centres d'intérêt de l'utilisateur
        List<FollowedTopic> topics = followedTopicRepository.findByUserId(userId);
        List<ReadingHistory> history = readingHistoryRepository.findByUserIdOrderByReadAtDesc(userId);

        Set<Long> alreadyReadPubIds = new HashSet<>();
        Set<Long> preferredDomainIds = new HashSet<>();

        for (ReadingHistory rh : history) {
            alreadyReadPubIds.add(rh.getPublication().getId());
            if (rh.getPublication().getDomain() != null) {
                preferredDomainIds.add(rh.getPublication().getDomain().getId());
            }
        }

        for (FollowedTopic ft : topics) {
            if (ft.getDomain() != null) {
                preferredDomainIds.add(ft.getDomain().getId());
            }
        }

        List<Publication> candidates = publicationRepository.findAll();
        List<Map<String, Object>> recommended = new ArrayList<>();

        for (Publication p : candidates) {
            if (p.getStatus() != PublicationStatus.PUBLISHED) continue;
            if (alreadyReadPubIds.contains(p.getId())) continue;

            float score = 0.5f;
            String reason = "Découverte académique";

            if (p.getDomain() != null && preferredDomainIds.contains(p.getDomain().getId())) {
                score += 0.35f;
                reason = "Dans votre domaine d'intérêt (« " + p.getDomain().getName() + " »)";
            }

            if (p.getViewCount() != null && p.getViewCount() > 5) {
                score += 0.15f;
            }

            Map<String, Object> item = new HashMap<>();
            item.put("publication", toDTO(p));
            item.put("publicationId", p.getId());
            item.put("score", Math.min(1.0f, score));
            item.put("reason", reason);
            recommended.add(item);

            if (recommended.size() >= fetchLimit) break;
        }

        // Si peu de candidats, ajouter les publications les plus populaires
        if (recommended.size() < fetchLimit) {
            List<Publication> popular = publicationRepository.findTop10ByStatusOrderByViewCountDesc(PublicationStatus.PUBLISHED);
            for (Publication p : popular) {
                if (!alreadyReadPubIds.contains(p.getId()) && recommended.stream().noneMatch(r -> r.get("publicationId").equals(p.getId()))) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("publication", toDTO(p));
                    item.put("publicationId", p.getId());
                    item.put("score", 0.7f);
                    item.put("reason", "Travail populaire sur Galileo");
                    recommended.add(item);
                    if (recommended.size() >= fetchLimit) break;
                }
            }
        }

        return recommended;
    }

    @Transactional
    public void markRecommendationSeen(Long recommendationId, Long userId) {
        recommendationRepository.findById(recommendationId).ifPresent(r -> {
            if (r.getUser().getId().equals(userId)) {
                r.setIsSeen(true);
                recommendationRepository.save(r);
            }
        });
    }

    // ==========================================
    // FAVORIS
    // ==========================================

    @Transactional
    public void addFavorite(Long userId, Long publicationId) {
        if (!favoriteRepository.existsByUserIdAndPublicationId(userId, publicationId)) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", userId));
            Publication publication = publicationRepository.findById(publicationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Publication", "id", publicationId));

            Favorite favorite = Favorite.builder()
                    .user(user)
                    .publication(publication)
                    .build();
            favoriteRepository.save(favorite);
        }
    }

    @Transactional
    public void removeFavorite(Long userId, Long publicationId) {
        favoriteRepository.deleteByUserIdAndPublicationId(userId, publicationId);
    }

    @Transactional(readOnly = true)
    public boolean isFavorite(Long userId, Long publicationId) {
        return favoriteRepository.existsByUserIdAndPublicationId(userId, publicationId);
    }

    @Transactional(readOnly = true)
    public List<PublicationDTO> getFavorites(Long userId) {
        List<Favorite> favorites = favoriteRepository.findByUserId(userId);
        return favorites.stream()
                .map(f -> toDTO(f.getPublication()))
                .toList();
    }

    // ==========================================
    // HISTORIQUE DE LECTURE
    // ==========================================

    @Transactional
    public void recordReading(Long userId, Long publicationId, Integer lastPage, Float progress, Integer durationSeconds) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", userId));
        Publication publication = publicationRepository.findById(publicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Publication", "id", publicationId));

        ReadingHistory rh = readingHistoryRepository.findByUserIdAndPublicationId(userId, publicationId)
                .orElse(ReadingHistory.builder()
                        .user(user)
                        .publication(publication)
                        .build());

        if (lastPage != null) rh.setLastPage(lastPage);
        if (progress != null) rh.setProgress(progress);
        if (durationSeconds != null) {
            rh.setDurationSeconds((rh.getDurationSeconds() != null ? rh.getDurationSeconds() : 0) + durationSeconds);
        }
        rh.setReadAt(java.time.LocalDateTime.now());
        readingHistoryRepository.save(rh);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getReadingHistory(Long userId) {
        List<ReadingHistory> list = readingHistoryRepository.findByUserIdOrderByReadAtDesc(userId);
        return list.stream().map(rh -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", rh.getId());
            map.put("publication", toDTO(rh.getPublication()));
            map.put("lastPage", rh.getLastPage());
            map.put("progress", rh.getProgress());
            map.put("durationSeconds", rh.getDurationSeconds());
            map.put("readAt", rh.getReadAt() != null ? rh.getReadAt().toString() : "");
            return map;
        }).toList();
    }

    private PublicationDTO toDTO(Publication p) {
        List<PublicationAuthor> authors = authorRepository.findByPublicationIdOrderByPositionAsc(p.getId());
        List<PublicationKeyword> pks = keywordRepository.findByPublicationId(p.getId());

        return PublicationDTO.builder()
                .id(p.getId())
                .title(p.getTitle())
                .slug(p.getSlug())
                .abstractText(p.getAbstractText())
                .type(p.getType())
                .status(p.getStatus())
                .accessLevel(p.getAccessLevel())
                .domainId(p.getDomain() != null ? p.getDomain().getId() : null)
                .domainName(p.getDomain() != null ? p.getDomain().getName() : null)
                .language(p.getLanguage())
                .publishedAt(p.getPublishedAt())
                .viewCount(p.getViewCount())
                .downloadCount(p.getDownloadCount())
                .build();
    }
}
