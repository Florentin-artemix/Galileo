package com.galileo.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.GATEWAY_TIMEOUT)
public class AIServiceTimeoutException extends RuntimeException {
    public AIServiceTimeoutException(String message) {
        super(message);
    }
}

