package com.galileo.lecture.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventCreateDTO {
    
    @NotNull(message = "Le titre est requis")
    private Map<String, String> title;
    
    @NotBlank(message = "La date est requise")
    private String date;
    
    @NotNull(message = "Le type est requis")
    private Map<String, String> type;
    
    private Map<String, String> domain;
    
    @NotBlank(message = "Le lieu est requis")
    private String location;
    
    private Map<String, String> summary;
    
    private Map<String, String> description;
    
    private List<EventDTO.SpeakerDTO> speakers;
    
    private List<String> tags;
    
    private String imageUrl;
    
    private List<String> photos;
    
    private List<EventDTO.ResourceDTO> resources;
}
