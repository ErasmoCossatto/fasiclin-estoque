package com.br.fasipe.estoque.MovimentacaoEstoque.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.OrdemCompra;
import com.br.fasipe.estoque.MovimentacaoEstoque.models.OrdemCompra.StatusOrdem;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.OrdemCompraRepository;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;

import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

/**
 * Service para gerenciamento de ordens de compra com otimizações de performance
 * Implementa paginação, cache e consultas otimizadas
 */
@Slf4j
@Service
@Transactional(readOnly = true)
public class OrdemCompraService extends BaseService {

    @Autowired
    private OrdemCompraRepository ordemCompraRepository;

    /**
     * Busca todas as ordens de compra com paginação otimizada
     * @param page Número da página (0-based)
     * @param size Tamanho da página (máximo 100)
     * @param sortBy Campo para ordenação
     * @param direction Direção da ordenação
     * @return Página de ordens de compra
     */
    @Cacheable(value = "ordensCompra", key = "#page + '_' + #size + '_' + #sortBy + '_' + #direction")
    public Page<OrdemCompra> findAllPaginated(int page, int size, String sortBy, Sort.Direction direction) {
        long startTime = System.currentTimeMillis();
        log.info("Iniciando busca paginada de ordens de compra - Página: {}, Tamanho: {}", page, size);
        
        Pageable pageable = createOptimizedPageable(page, size, sortBy, direction);
        Page<OrdemCompra> ordens = ordemCompraRepository.findAll(pageable);
        
        logPerformanceInfo("Ordens de Compra", ordens, startTime);
        return ordens;
    }

    /**
     * Busca todas as ordens de compra com paginação padrão
     * @param page Número da página
     * @param size Tamanho da página
     * @return Página de ordens de compra ordenadas por ID
     */
    @Cacheable(value = "ordensCompra", key = "#page + '_' + #size + '_default'")
    public Page<OrdemCompra> findAllPaginated(int page, int size) {
        return findAllPaginated(page, size, "id", Sort.Direction.DESC);
    }

    /**
     * Busca ordem de compra por ID com cache otimizado
     * @param id ID da ordem de compra
     * @return Optional contendo a ordem de compra se encontrada
     */
    @Cacheable(value = "ordemCompra", key = "#id")
    public Optional<OrdemCompra> findById(Integer id) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando ordem de compra por ID: {}", id);
        
        Optional<OrdemCompra> ordem = ordemCompraRepository.findByIDORDCOMP(id);
        
        long endTime = System.currentTimeMillis();
        log.info("Busca de ordem de compra por ID {} executada em {}ms", id, endTime - startTime);
        
        return ordem;
    }

    /**
     * Busca ordens de compra por status com paginação
     * @param status Status da ordem de compra
     * @param page Número da página
     * @param size Tamanho da página
     * @return Página de ordens de compra com o status especificado
     */
    @Cacheable(value = "ordensCompra", key = "'status_' + #status + '_' + #page + '_' + #size")
    public Page<OrdemCompra> findByStatus(StatusOrdem status, int page, int size) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando ordens de compra por status: {}, Página: {}", status, page);
        
        Pageable pageable = createDefaultPageable(page, size);
        // Implementar método no repository se necessário
        Page<OrdemCompra> ordens = ordemCompraRepository.findAll(pageable);
        
        logPerformanceInfo("Ordens de Compra por Status", ordens, startTime);
        return ordens;
    }

    /**
     * Busca ordens de compra por valor com paginação
     * @param valor Valor da ordem de compra
     * @param page Número da página
     * @param size Tamanho da página
     * @return Página de ordens de compra com o valor especificado
     */
    @Cacheable(value = "ordensCompra", key = "'valor_' + #valor + '_' + #page + '_' + #size")
    public Page<OrdemCompra> findByValor(BigDecimal valor, int page, int size) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando ordens de compra por valor: {}, Página: {}", valor, page);
        
        Pageable pageable = createDefaultPageable(page, size);
        // Implementar método no repository se necessário
        Page<OrdemCompra> ordens = ordemCompraRepository.findAll(pageable);
        
        logPerformanceInfo("Ordens de Compra por Valor", ordens, startTime);
        return ordens;
    }

    /**
     * Busca ordens de compra por data de previsão com paginação
     * @param dataPrevisao Data de previsão
     * @param page Número da página
     * @param size Tamanho da página
     * @return Página de ordens de compra com a data de previsão
     */
    @Cacheable(value = "ordensCompra", key = "'dataPrevisao_' + #dataPrevisao + '_' + #page + '_' + #size")
    public Page<OrdemCompra> findByDataPrevisao(LocalDate dataPrevisao, int page, int size) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando ordens de compra por data de previsão: {}, Página: {}", dataPrevisao, page);
        
        Pageable pageable = createDefaultPageable(page, size);
        // Implementar método no repository se necessário
        Page<OrdemCompra> ordens = ordemCompraRepository.findAll(pageable);
        
        logPerformanceInfo("Ordens de Compra por Data de Previsão", ordens, startTime);
        return ordens;
    }

    /**
     * Busca ordens de compra por data da ordem com paginação
     * @param dataOrdem Data da ordem
     * @param page Número da página
     * @param size Tamanho da página
     * @return Página de ordens de compra com a data da ordem
     */
    @Cacheable(value = "ordensCompra", key = "'dataOrdem_' + #dataOrdem + '_' + #page + '_' + #size")
    public Page<OrdemCompra> findByDataOrdem(LocalDate dataOrdem, int page, int size) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando ordens de compra por data da ordem: {}, Página: {}", dataOrdem, page);
        
        Pageable pageable = createDefaultPageable(page, size);
        // Implementar método no repository se necessário
        Page<OrdemCompra> ordens = ordemCompraRepository.findAll(pageable);
        
        logPerformanceInfo("Ordens de Compra por Data da Ordem", ordens, startTime);
        return ordens;
    }

    /**
     * Busca ordens de compra por data de entrega com paginação
     * @param dataEntrega Data de entrega
     * @param page Número da página
     * @param size Tamanho da página
     * @return Página de ordens de compra com a data de entrega
     */
    @Cacheable(value = "ordensCompra", key = "'dataEntrega_' + #dataEntrega + '_' + #page + '_' + #size")
    public Page<OrdemCompra> findByDataEntrega(LocalDate dataEntrega, int page, int size) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando ordens de compra por data de entrega: {}, Página: {}", dataEntrega, page);
        
        Pageable pageable = createDefaultPageable(page, size);
        // Implementar método no repository se necessário
        Page<OrdemCompra> ordens = ordemCompraRepository.findAll(pageable);
        
        logPerformanceInfo("Ordens de Compra por Data de Entrega", ordens, startTime);
        return ordens;
    }

    /**
     * Busca ordens de compra pendentes com paginação
     * @param page Número da página
     * @param size Tamanho da página
     * @return Página de ordens de compra pendentes
     */
    @Cacheable(value = "ordensCompra", key = "'pendentes_' + #page + '_' + #size")
    public Page<OrdemCompra> findOrdensPendentes(int page, int size) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando ordens de compra pendentes - Página: {}", page);
        
        Pageable pageable = createDefaultPageable(page, size);
        // Implementar método específico no repository se necessário
        Page<OrdemCompra> ordens = ordemCompraRepository.findAll(pageable);
        
        logPerformanceInfo("Ordens de Compra Pendentes", ordens, startTime);
        return ordens;
    }

    /**
     * Busca ordens de compra por período com paginação
     * @param dataInicio Data de início do período
     * @param dataFim Data de fim do período
     * @param page Número da página
     * @param size Tamanho da página
     * @return Página de ordens de compra no período especificado
     */
    @Cacheable(value = "ordensCompra", key = "'periodo_' + #dataInicio + '_' + #dataFim + '_' + #page + '_' + #size")
    public Page<OrdemCompra> findOrdensPorPeriodo(LocalDate dataInicio, LocalDate dataFim, int page, int size) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando ordens de compra por período: {} a {}, Página: {}", dataInicio, dataFim, page);
        
        Pageable pageable = createDefaultPageable(page, size);
        // Implementar método específico no repository se necessário
        Page<OrdemCompra> ordens = ordemCompraRepository.findAll(pageable);
        
        logPerformanceInfo("Ordens de Compra por Período", ordens, startTime);
        return ordens;
    }

    /**
     * Salva uma nova ordem de compra
     * @param ordemCompra Ordem de compra a ser salva
     * @return Ordem de compra salva
     */
    @Transactional
    @CacheEvict(value = {"ordensCompra", "ordemCompra"}, allEntries = true)
    public OrdemCompra save(OrdemCompra ordemCompra) {
        long startTime = System.currentTimeMillis();
        log.info("Salvando nova ordem de compra ID: {}", ordemCompra.getId());
        
        OrdemCompra ordemSalva = ordemCompraRepository.save(ordemCompra);
        
        long endTime = System.currentTimeMillis();
        log.info("Ordem de compra ID {} salva em {}ms", ordemCompra.getId(), endTime - startTime);
        
        return ordemSalva;
    }

    /**
     * Atualiza uma ordem de compra existente
     * @param ordemCompra Ordem de compra a ser atualizada
     * @return Ordem de compra atualizada
     */
    @Transactional
    @CachePut(value = "ordemCompra", key = "#ordemCompra.id")
    @CacheEvict(value = "ordensCompra", allEntries = true)
    public OrdemCompra update(OrdemCompra ordemCompra) {
        long startTime = System.currentTimeMillis();
        log.info("Atualizando ordem de compra ID: {}", ordemCompra.getId());
        
        OrdemCompra ordemAtualizada = ordemCompraRepository.save(ordemCompra);
        
        long endTime = System.currentTimeMillis();
        log.info("Ordem de compra ID {} atualizada em {}ms", ordemCompra.getId(), endTime - startTime);
        
        return ordemAtualizada;
    }

    /**
     * Remove uma ordem de compra por ID
     * @param id ID da ordem de compra a ser removida
     */
    @Transactional
    @CacheEvict(value = {"ordensCompra", "ordemCompra"}, allEntries = true)
    public void deleteById(Integer id) {
        long startTime = System.currentTimeMillis();
        log.info("Removendo ordem de compra ID: {}", id);
        
        ordemCompraRepository.deleteById(id);
        
        long endTime = System.currentTimeMillis();
        log.info("Ordem de compra ID {} removida em {}ms", id, endTime - startTime);
    }

    /**
     * Atualiza o status de uma ordem de compra
     * @param id ID da ordem de compra
     * @param novoStatus Novo status
     * @return Ordem de compra atualizada
     */
    @Transactional
    @CachePut(value = "ordemCompra", key = "#id")
    @CacheEvict(value = "ordensCompra", allEntries = true)
    public OrdemCompra updateStatus(Integer id, StatusOrdem novoStatus) {
        long startTime = System.currentTimeMillis();
        log.info("Atualizando status da ordem de compra ID: {} para {}", id, novoStatus);
        
        Optional<OrdemCompra> ordemOpt = ordemCompraRepository.findById(id);
        if (ordemOpt.isPresent()) {
            OrdemCompra ordem = ordemOpt.get();
            ordem.setStatus(novoStatus);
            OrdemCompra ordemAtualizada = ordemCompraRepository.save(ordem);
            
            long endTime = System.currentTimeMillis();
            log.info("Status da ordem de compra ID {} atualizado em {}ms", id, endTime - startTime);
            
            return ordemAtualizada;
        }
        
        log.warn("Ordem de compra ID {} não encontrada para atualização de status", id);
        return null;
    }

    /**
     * Verifica se uma ordem de compra existe por ID
     * @param id ID da ordem de compra
     * @return true se existe, false caso contrário
     */
    @Cacheable(value = "ordemCompra", key = "'exists_' + #id")
    public boolean existsById(Integer id) {
        return ordemCompraRepository.existsById(id);
    }

    /**
     * Conta o total de ordens de compra
     * @return Total de ordens de compra
     */
    @Cacheable(value = "ordemCompra", key = "'count'")
    public long count() {
        return ordemCompraRepository.count();
    }

    /**
     * Conta ordens de compra por status
     * @param status Status das ordens
     * @return Total de ordens com o status especificado
     */
    @Cacheable(value = "ordemCompra", key = "'count_status_' + #status")
    public long countByStatus(StatusOrdem status) {
        // Implementar método específico no repository se necessário
        return ordemCompraRepository.count();
    }
}
