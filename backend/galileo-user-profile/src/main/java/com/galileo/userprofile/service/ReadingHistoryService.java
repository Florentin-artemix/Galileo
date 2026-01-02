package com.galileo.userprofile.service;

import com.galileo.userprofile.dto.ReadingHistoryDTO;
import com.galileo.userprofile.dto.RecordReadingDTO;
import com.galileo.userprofile.entity.ReadingHistory;
import com.galileo.userprofile.repository.ReadingHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReadingHistoryService {
    
    private final ReadingHistoryRepository readingHistoryRepository;
    
    public List<ReadingHistoryDTO> getHistory(String firebaseUid) {
        return readingHistoryRepository.findByFirebaseUidOrderByReadAtDesc(firebaseUid)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    public Page<ReadingHistoryDTO> getHistoryPaginated(String firebaseUid, Pageable pageable) {
        return readingHistoryRepository.findByFirebaseUid(firebaseUid, pageable)
                .map(this::toDTO);
    }
    
    public List<ReadingHistoryDTO> getRecentHistory(String firebaseUid, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return readingHistoryRepository.findRecentHistory(firebaseUid, since)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    public List<ReadingHistoryDTO> getInProgressReadings(String firebaseUid) {
        // Récupérer les lectures récentes (dernières 24h) qui ne sont pas terminées (< 100%)
        LocalDateTime since = LocalDateTime.now().minusDays(1);
        return readingHistoryRepository.findRecentHistory(firebaseUid, since)
                .stream()
                .filter(h -> h.getProgressPercentage() != null && h.getProgressPercentage() < 100)
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public ReadingHistoryDTO recordReading(String firebaseUid, RecordReadingDTO recordDTO) {
        ReadingHistory history = ReadingHistory.builder()
                .firebaseUid(firebaseUid)
                .publicationId(recordDTO.getPublicationId())
                .publicationTitle(recordDTO.getPublicationTitle())
                .publicationDomain(recordDTO.getPublicationDomain())
                .readingDurationSeconds(recordDTO.getReadingDurationSeconds())
                .progressPercentage(recordDTO.getProgressPercentage())
                .build();
        
        history = readingHistoryRepository.save(history);
        log.info("Lecture enregistrée pour la publication {} par l'utilisateur {}", 
                recordDTO.getPublicationId(), firebaseUid);
        
        return toDTO(history);
    }
    
    @Transactional
    public ReadingHistoryDTO updateProgress(String firebaseUid, Long publicationId, 
                                            Integer durationSeconds, Integer progressPercentage) {
        ReadingHistory lastEntry = readingHistoryRepository
                .findFirstByFirebaseUidAndPublicationIdOrderByReadAtDesc(firebaseUid, publicationId)
                .orElse(null);
        
        if (lastEntry != null && lastEntry.getReadAt().isAfter(LocalDateTime.now().minusMinutes(30))) {
            // Mettre à jour l'entrée existante si lecture récente (< 30 min)
            if (durationSeconds != null) {
                lastEntry.setReadingDurationSeconds(
                        (lastEntry.getReadingDurationSeconds() != null ? lastEntry.getReadingDurationSeconds() : 0) 
                        + durationSeconds);
            }
            if (progressPercentage != null) {
                lastEntry.setProgressPercentage(progressPercentage);
            }
            lastEntry = readingHistoryRepository.save(lastEntry);
            return toDTO(lastEntry);
        }
        
        // Créer une nouvelle entrée
        RecordReadingDTO recordDTO = RecordReadingDTO.builder()
                .publicationId(publicationId)
                .readingDurationSeconds(durationSeconds)
                .progressPercentage(progressPercentage)
                .build();
        
        return recordReading(firebaseUid, recordDTO);
    }
    
    private ReadingHistoryDTO toDTO(ReadingHistory history) {
        return ReadingHistoryDTO.builder()
                .id(history.getId())
                .publicationId(history.getPublicationId())
                .publicationTitle(history.getPublicationTitle())
                .publicationDomain(history.getPublicationDomain())
                .readAt(history.getReadAt())
                .readingDurationSeconds(history.getReadingDurationSeconds())
                .progressPercentage(history.getProgressPercentage())
                .build();
    }
}

