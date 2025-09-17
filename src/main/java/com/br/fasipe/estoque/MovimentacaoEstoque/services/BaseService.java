package com.br.fasipe.estoque.MovimentacaoEstoque.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;


import lombok.extern.slf4j.Slf4j;

/**
 * Classe base para services com métodos comuns de paginação e otimização
 * Fornece funcionalidades reutilizáveis para todos os services
 */
@Slf4j
@Service
public abstract class BaseService {

    /**
     * Cria um Pageable otimizado com configurações de performance
     * @param page Número da página (0-based)
     * @param size Tamanho da página
     * @param sortBy Campo para ordenação
     * @param direction Direção da ordenação
     * @return Pageable configurado
     */
    protected Pageable createOptimizedPageable(int page, int size, String sortBy, Sort.Direction direction) {
        // Validação de parâmetros para evitar valores inválidos
        if (page < 0) {
            log.warn("Página negativa detectada, ajustando para 0");
            page = 0;
        }
        
        if (size <= 0 || size > 100) {
            log.warn("Tamanho de página inválido: {}. Ajustando para 20", size);
            size = 20;
        }
        
        // Criação do Sort com fallback para ID se o campo não existir
        Sort sort = Sort.by(direction != null ? direction : Sort.Direction.ASC, 
                           sortBy != null && !sortBy.trim().isEmpty() ? sortBy : "id");
        
        return PageRequest.of(page, size, sort);
    }

    /**
     * Cria um Pageable padrão com configurações otimizadas
     * @param page Número da página
     * @param size Tamanho da página
     * @return Pageable com ordenação padrão por ID
     */
    protected Pageable createDefaultPageable(int page, int size) {
        return createOptimizedPageable(page, size, "id", Sort.Direction.ASC);
    }

    /**
     * Valida se uma página contém dados
     * @param page Página a ser validada
     * @return true se a página tem conteúdo, false caso contrário
     */
    protected boolean hasContent(Page<?> page) {
        return page != null && page.hasContent();
    }

    /**
     * Loga informações de performance da consulta
     * @param entityName Nome da entidade consultada
     * @param page Página resultante
     * @param startTime Tempo de início da consulta
     */
    protected void logPerformanceInfo(String entityName, Page<?> page, long startTime) {
        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;
        
        log.info("Consulta de {} executada em {}ms. Página: {}/{}, Total: {}, Tamanho: {}", 
                entityName, duration, page.getNumber(), page.getTotalPages(), 
                page.getTotalElements(), page.getSize());
    }
}
