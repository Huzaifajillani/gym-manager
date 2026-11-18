
package com.gym.manager.config;

import de.bwaldvogel.mongo.MongoServer;
import de.bwaldvogel.mongo.backend.memory.MemoryBackend;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(
        name = "gym.mongodb.embedded.enabled",
        havingValue = "true"
)
public class MongoConfig {

    private static final Logger log =
            LoggerFactory.getLogger(MongoConfig.class);

    private MongoServer server;

    @PostConstruct
    public void init() {
        try {
            log.info("Starting development embedded MongoDB...");

            server = new MongoServer(new MemoryBackend());
            server.bind("127.0.0.1", 27017);

            log.info("Embedded MongoDB started on 127.0.0.1:27017");

        } catch (Exception e) {
            log.error("Embedded MongoDB startup failed", e);
            throw new IllegalStateException(
                    "Could not start embedded MongoDB", e
            );
        }
    }

    @PreDestroy
    public void cleanup() {
        if (server != null) {
            log.info("Stopping embedded MongoDB...");
            server.shutdown();
        }
    }
}
