package com.galileo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class GalileoApplication {

    public static void main(String[] args) {
        SpringApplication.run(GalileoApplication.class, args);
    }

}
