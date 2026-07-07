package com.caagent.config;

import com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * With spring.jpa.open-in-view disabled, entities serialized after their transaction ends can
 * still carry uninitialized lazy associations. This module serializes those as null instead of
 * throwing LazyInitializationException.
 */
@Configuration
public class JacksonConfig {

    @Bean
    public Hibernate6Module hibernate6Module() {
        return new Hibernate6Module();
    }
}
