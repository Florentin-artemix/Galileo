package com.galileo.search;

import com.galileo.documents.entity.Document;
import com.galileo.documents.repository.DocumentRepository;
import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import com.galileo.auth.security.CustomUserDetails;
import com.galileo.embedding.provider.EmbeddingProviderUnavailableException;
import com.galileo.embedding.provider.EmbeddingProvider;
import com.galileo.publications.entity.AccessLevel;
import com.galileo.publications.entity.Publication;
import com.galileo.publications.entity.PublicationAuthor;
import com.galileo.publications.entity.PublicationStatus;
import com.galileo.publications.repository.DomainRepository;
import com.galileo.publications.repository.PublicationAuthorRepository;
import com.galileo.publications.repository.PublicationKeywordRepository;
import com.galileo.publications.repository.PublicationRepository;
import com.galileo.recommendations.repository.SearchHistoryRepository;
import com.galileo.search.dto.SearchRequest;
import com.galileo.search.dto.SearchResult;
import com.galileo.search.service.SearchServiceImpl;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("unchecked")
class SearchServiceTest {

    @Mock
    private PublicationRepository publicationRepository;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private PublicationAuthorRepository authorRepository;

    @Mock
    private PublicationKeywordRepository keywordRepository;

    @Mock
    private DomainRepository domainRepository;

    @Mock
    private EmbeddingProvider embeddingProvider;

    @Mock
    private SearchHistoryRepository searchHistoryRepository;

    @Mock
    private com.galileo.auth.repository.UserRepository userRepository;

    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private SearchServiceImpl searchService;

    @Test
    @DisplayName("Search delegates filtering directly to database Specification and maps results")
    void testSearchDelegatesToDatabaseSpecification() {
        Publication pub = Publication.builder()
                .id(1L)
                .title("Analyse des contraintes géotechniques")
                .abstractText("Résumé de l'étude géotechnique")
                .status(PublicationStatus.PUBLISHED)
                .accessLevel(AccessLevel.PUBLIC)
                .publishedAt(LocalDateTime.now())
                .build();

        PageImpl<Publication> page = new PageImpl<>(List.of(pub));
        when(publicationRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        when(authorRepository.findByPublicationIdOrderByPositionAsc(1L)).thenReturn(List.of(
                PublicationAuthor.builder().authorName("Amina Kasongo").position(0).build()
        ));
        when(documentRepository.findByPublicationId(1L)).thenReturn(List.of(
                Document.builder().fileKey("publications/1.pdf").build()
        ));

        SearchRequest req = SearchRequest.builder()
                .query("géotechnique")
                .type("ARTICLE")
                .page(0)
                .size(10)
                .build();

        SearchResult result = searchService.search(req, null);

        assertNotNull(result);
        assertEquals(1, result.getTotalHits());
        assertEquals(1, result.getPublications().size());
        assertEquals("Analyse des contraintes géotechniques", result.getPublications().get(0).getTitle());
        assertEquals(List.of("Amina Kasongo"), result.getPublications().get(0).getAuthors());
        assertTrue(result.getPublications().get(0).isHasDocument());
        verify(publicationRepository, times(1)).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    @DisplayName("Semantic search falls back cleanly with fallbackUsed=true when embedding provider fails")
    void testSemanticSearchFallsBackOnProviderFailure() {
        when(embeddingProvider.generateEmbedding("intelligence artificielle"))
                .thenThrow(new EmbeddingProviderUnavailableException("Qwen service unavailable"));

        PageImpl<Publication> emptyPage = new PageImpl<>(Collections.emptyList());
        when(publicationRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(emptyPage);

        User student = User.builder().id(5L).email("student@mapon.cd").role(Role.STUDENT).build();
        CustomUserDetails userDetails = new CustomUserDetails(student);

        SearchResult result = searchService.semanticSearch("intelligence artificielle", 10, userDetails);

        assertNotNull(result);
        assertTrue(result.isFallbackUsed(), "fallbackUsed flag must be true when fallback occurs");
        assertEquals("TEXTUAL_FALLBACK", result.getSearchType(), "searchType must clearly indicate TEXTUAL_FALLBACK");
    }

    @Test
    @DisplayName("Semantic search with empty query returns empty results immediately")
    void testSemanticSearchEmptyQuery() {
        SearchResult result = searchService.semanticSearch("   ", 10, null);

        assertNotNull(result);
        assertEquals(0, result.getTotalHits());
        assertEquals("SEMANTIC", result.getSearchType());
        assertFalse(result.isFallbackUsed());
        verify(embeddingProvider, never()).generateEmbedding(anyString());
    }

    @Test
    @DisplayName("VIEWER receives public similar publications but not institutional metadata")
    void viewerOnlySeesPublicSimilarPublicationMetadata() {
        Publication source = Publication.builder()
                .id(10L)
                .status(PublicationStatus.PUBLISHED)
                .accessLevel(AccessLevel.PUBLIC)
                .build();
        Publication publicResult = Publication.builder()
                .id(11L)
                .title("Public publication")
                .status(PublicationStatus.PUBLISHED)
                .accessLevel(AccessLevel.PUBLIC)
                .build();
        Publication institutionalResult = Publication.builder()
                .id(12L)
                .title("Institutional publication")
                .status(PublicationStatus.PUBLISHED)
                .accessLevel(AccessLevel.INSTITUTIONAL)
                .build();
        CustomUserDetails viewer = new CustomUserDetails(User.builder()
                .id(23L)
                .email("viewer@example.test")
                .role(Role.VIEWER)
                .build());
        when(publicationRepository.findById(10L)).thenReturn(java.util.Optional.of(source));
        when(publicationRepository.findTop5ByStatusAndIdNotOrderByViewCountDesc(PublicationStatus.PUBLISHED, 10L))
                .thenReturn(List.of(institutionalResult, publicResult));
        when(authorRepository.findByPublicationIdOrderByPositionAsc(11L)).thenReturn(List.of());
        when(documentRepository.findByPublicationId(11L)).thenReturn(List.of());

        List<com.galileo.publications.dto.PublicationDTO> similar =
                searchService.getSimilarPublications(10L, 5, viewer);

        assertEquals(1, similar.size());
        assertEquals(11L, similar.get(0).getId());
    }
}
