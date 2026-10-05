package com.galileo.users.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstitutionDTO {
    private Long id;
    private String name;
    private String shortName;
    private String country;
    private String city;
    private String website;
    private String logoUrl;
}
