package com.galileo.search.service;

import com.galileo.search.dto.SearchRequest;
import com.galileo.search.dto.SearchResult;

public interface SearchService {

    SearchResult search(SearchRequest request);

    SearchResult semanticSearch(String query, int limit);
}
