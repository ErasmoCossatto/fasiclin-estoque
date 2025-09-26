package com.br.fasipe.estoque.MovimentacaoEstoque.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "TRACE", "CONNECT")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        // Serve arquivos estáticos do frontend
        registry.addResourceHandler("/frontend/**")
                .addResourceLocations("file:frontend/")
                .setCachePeriod(3600)
                .resourceChain(true);
        
        // Serve assets (CSS, JS, imagens)
        registry.addResourceHandler("/assets/**")
                .addResourceLocations("file:frontend/assets/")
                .setCachePeriod(3600)
                .resourceChain(true);
    }
}