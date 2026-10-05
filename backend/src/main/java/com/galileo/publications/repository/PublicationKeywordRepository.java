package com.galileo.publications.repository;

import com.galileo.publications.entity.PublicationKeyword;
import com.galileo.publications.entity.PublicationKeywordId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PublicationKeywordRepository extends JpaRepository<PublicationKeyword, PublicationKeywordId> {
    List<PublicationKeyword> findByPublicationId(Long publicationId);
    List<PublicationKeyword> findByKeywordId(Long keywordId);
}
