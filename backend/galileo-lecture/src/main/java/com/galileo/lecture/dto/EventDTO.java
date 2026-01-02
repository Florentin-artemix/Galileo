package com.galileo.lecture.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventDTO {
    
    private Long id;
    private Map<String, String> title;
    private String date;
    private Map<String, String> type;
    private Map<String, String> domain;
    private String location;
    private Map<String, String> summary;
    private Map<String, String> description;
    private List<SpeakerDTO> speakers;
    private List<String> tags;
    private String imageUrl;
    private List<String> photos;
    private List<ResourceDTO> resources;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SpeakerDTO {
        private String name;
        private Map<String, String> role;
        private String imageUrl;
        private String linkedin;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResourceDTO {
        private String name;
        private String url;
        private String size;
        private String format;
    }
}
