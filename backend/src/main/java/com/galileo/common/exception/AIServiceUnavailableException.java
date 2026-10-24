package com.galileo.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
public class AIServiceUnavailableException extends RuntimeException {
    public AIServiceUnavailableException(String message) {
        super(message);
    }
}

