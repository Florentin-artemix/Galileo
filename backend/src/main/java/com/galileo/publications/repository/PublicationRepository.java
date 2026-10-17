package com.galileo.publications.repository;

import com.galileo.publications.entity.AccessLevel;
import com.galileo.publications.entity.Publication;
import com.galileo.publications.entity.PublicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PublicationRepository extends JpaRepository<Publication, Long> {
    Optional<Publication> findBySlug(String slug);
    Page<Publication> findByStatus(PublicationStatus status, Pageable pageable);
    Page<Publication> findByStatusAndAccessLevel(PublicationStatus status, AccessLevel accessLevel, Pageable pageable);
    Page<Publication> findByDomainIdAndStatus(Long domainId, PublicationStatus status, Pageable pageable);

    List<Publication> findTop10ByStatusOrderByPublishedAtDesc(PublicationStatus status);
    List<Publication> findTop10ByStatusOrderByViewCountDesc(PublicationStatus status);

    @Query("SELECT p FROM Publication p WHERE p.status = :status AND (" +
           "LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.abstractText) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Publication> searchByText(
            @Param("status") PublicationStatus status,
            @Param("query") String query,
            Pageable pageable
    );

    @Query("SELECT p FROM Publication p WHERE p.status = :status AND (" +
           "LOWER(p.domain.name) LIKE LOWER(CONCAT('%', :domain, '%')) OR " +
           "LOWER(p.domain.slug) = LOWER(:domain))")
    Page<Publication> findByDomainNameOrSlug(
            @Param("status") PublicationStatus status,
            @Param("domain") String domain,
            Pageable pageable
    );

    @Query("SELECT pa.publication FROM PublicationAuthor pa WHERE pa.publication.status = :status AND (" +
           "LOWER(pa.authorName) LIKE LOWER(CONCAT('%', :author, '%')))")
    Page<Publication> findByAuthorName(
            @Param("status") PublicationStatus status,
            @Param("author") String author,
            Pageable pageable
    );

    List<Publication> findTop5ByDomainIdAndStatusAndIdNotOrderByViewCountDesc(Long domainId, PublicationStatus status, Long excludeId);

    List<Publication> findTop5ByStatusAndIdNotOrderByViewCountDesc(PublicationStatus status, Long excludeId);

    Page<Publication> findByDomainId(Long domainId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(p.viewCount), 0) FROM Publication p")
    Long sumTotalViews();

    @Query("SELECT COALESCE(SUM(p.downloadCount), 0) FROM Publication p")
    Long sumTotalDownloads();

    List<Publication> findTop5ByStatusOrderByViewCountDesc(PublicationStatus status);
}
