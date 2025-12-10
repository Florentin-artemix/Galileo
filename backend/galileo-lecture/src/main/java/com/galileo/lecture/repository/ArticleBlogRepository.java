package com.galileo.lecture.repository;

import com.galileo.lecture.entity.ArticleBlog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArticleBlogRepository extends JpaRepository<ArticleBlog, Long> {

    List<ArticleBlog> findByPublieTrue();
    
    List<ArticleBlog> findByCategorieAndPublieTrue(String categorie);
    
    List<ArticleBlog> findTop10ByPublieTrueOrderByDatePublicationDesc();
    
    List<ArticleBlog> findTop10ByPublieTrueOrderByNombreVuesDesc();

    @Modifying
    @Query("UPDATE ArticleBlog a SET a.nombreVues = a.nombreVues + 1 WHERE a.id = :id")
    void incrementerVues(Long id);
}
