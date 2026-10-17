package com.galileo.search.service;

import com.galileo.auth.security.CustomUserDetails;
import com.galileo.publications.dto.PublicationDTO;
import com.galileo.search.dto.SearchRequest;
import com.galileo.search.dto.SearchResult;

import java.util.List;

public interface SearchService {

    SearchResult search(SearchRequest request, CustomUserDetails currentUser);

    SearchResult search(SearchRequest request);

    SearchResult semanticSearch(String query, int limit, CustomUserDetails currentUser);

    SearchResult semanticSearch(String query, int limit);

    List<String> getSuggestions(String query);

    List<PublicationDTO> getSimilarPublications(Long publicationId, int limit, CustomUserDetails currentUser);
}
