package com.gym.manager;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class GymManagerApplication {

    public static void main(String[] args) {
        SpringApplication.run(GymManagerApplication.class, args);
    }
}
