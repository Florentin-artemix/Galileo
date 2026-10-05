package com.galileo.storage.service;

import java.io.InputStream;

public interface StorageService {

    String uploadFile(String key, InputStream inputStream, long contentLength, String contentType);

    InputStream downloadFile(String key);

    void deleteFile(String key);

    String generatePresignedUrl(String key, int expirationMinutes);
}
