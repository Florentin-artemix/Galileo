package com.galileo.lecture.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration des propriétés Cloudflare R2
 */
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "cloudflare.r2")
public class CloudflareR2Properties {
    
    private String endpoint;
    private String accountId;
    private String accessKey;
    private String secretKey;
    private String bucketName;
    private String publicUrl;
}
