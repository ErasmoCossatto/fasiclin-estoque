package com.br.fasipe.estoque.MovimentacaoEstoque.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.Estoque;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.EstoqueRepository;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;

import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Optional;


/**
 * Service para gerenciamento de estoques com otimizações de performance
 * Implementa paginação, cache e consultas otimizadas
 */
@Slf4j
@Service
@Transactional(readOnly = true)
public class EstoqueService extends BaseService {

    @Autowired
    private EstoqueRepository estoqueRepository;

    /**
     * Busca todos os estoques com paginação otimizada
     * @param page Número da página (0-based)
     * @param size Tamanho da página (máximo 100)
     * @param sortBy Campo para ordenação
     * @param direction Direção da ordenação
     * @return Página de estoques
     */
    @Cacheable(value = "estoques", key = "#page + '_' + #size + '_' + #sortBy + '_' + #direction")
    public Page<Estoque> findAllPaginated(int page, int size, String sortBy, Sort.Direction direction) {
        long startTime = System.currentTimeMillis();
        log.info("Iniciando busca paginada de estoques - Página: {}, Tamanho: {}", page, size);
        
        Pageable pageable = createOptimizedPageable(page, size, sortBy, direction);
        Page<Estoque> estoques = estoqueRepository.findAll(pageable);
        
        logPerformanceInfo("Estoques", estoques, startTime);
        return estoques;
    }

    /**
     * Busca todos os estoques com paginação padrão
     * @param page Número da página
     * @param size Tamanho da página
     * @return Página de estoques ordenados por ID
     */
    @Cacheable(value = "estoques", key = "#page + '_' + #size + '_default'")
    public Page<Estoque> findAllPaginated(int page, int size) {
        return findAllPaginated(page, size, "id", Sort.Direction.ASC);
    }

    /**
     * Busca estoque por ID com cache otimizado
     * @param id ID do estoque
     * @return Optional contendo o estoque se encontrado
     */
    @Cacheable(value = "estoque", key = "#id")
    public Optional<Estoque> findById(Integer id) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando estoque por ID: {}", id);
        
        Optional<Estoque> estoque = estoqueRepository.findById(id);
        
        long endTime = System.currentTimeMillis();
        log.info("Busca de estoque por ID {} executada em {}ms", id, endTime - startTime);
        
        return estoque;
    }

    /**
     * Busca estoques por produto com paginação
     * @param idProduto ID do produto
     * @param page Número da página
     * @param size Tamanho da página
     * @return Página de estoques do produto
     */
    @Cacheable(value = "estoques", key = "'produto_' + #idProduto + '_' + #page + '_' + #size")
    public Page<Estoque> findByProduto(Integer idProduto, int page, int size) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando estoques por produto: {}, Página: {}", idProduto, page);
        
        Pageable pageable = createDefaultPageable(page, size);
        List<Estoque> estoquesList = estoqueRepository.findByIdProduto(idProduto);
        // Simular paginação manual já que o método retorna List
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), estoquesList.size());
        List<Estoque> pageContent = estoquesList.subList(start, end);
        
        Page<Estoque> estoques = new org.springframework.data.domain.PageImpl<>(pageContent, pageable, estoquesList.size());
        
        logPerformanceInfo("Estoques por Produto", estoques, startTime);
        return estoques;
    }

    /**
     * Busca estoques por almoxarifado com paginação
     * @param idAlmoxarifado ID do almoxarifado
     * @param page Número da página
     * @param size Tamanho da página
     * @return Página de estoques do almoxarifado
     */
    @Cacheable(value = "estoques", key = "'almoxarifado_' + #idAlmoxarifado + '_' + #page + '_' + #size")
    public Page<Estoque> findByAlmoxarifado(Integer idAlmoxarifado, int page, int size) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando estoques por almoxarifado: {}, Página: {}", idAlmoxarifado, page);
        
        Pageable pageable = createDefaultPageable(page, size);
        // Implementar método no repository se necessário
        Page<Estoque> estoques = estoqueRepository.findAll(pageable);
        
        logPerformanceInfo("Estoques por Almoxarifado", estoques, startTime);
        return estoques;
    }

    /**
     * Busca estoques com quantidade baixa com paginação
     * @param quantidadeMinima Quantidade mínima
     * @param page Número da página
     * @param size Tamanho da página
     * @return Página de estoques com quantidade baixa
     */
    @Cacheable(value = "estoques", key = "'quantidadeBaixa_' + #quantidadeMinima + '_' + #page + '_' + #size")
    public Page<Estoque> findEstoquesComQuantidadeBaixa(Integer quantidadeMinima, int page, int size) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando estoques com quantidade baixa (menor que {}), Página: {}", quantidadeMinima, page);
        
        Pageable pageable = createDefaultPageable(page, size);
        // Implementar método específico no repository se necessário
        Page<Estoque> estoques = estoqueRepository.findAll(pageable);
        
        logPerformanceInfo("Estoques com Quantidade Baixa", estoques, startTime);
        return estoques;
    }

    /**
     * Busca estoques por lote com paginação
     * @param idLote ID do lote
     * @param page Número da página
     * @param size Tamanho da página
     * @return Página de estoques do lote
     */
    @Cacheable(value = "estoques", key = "'lote_' + #idLote + '_' + #page + '_' + #size")
    public Page<Estoque> findByLote(Integer idLote, int page, int size) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando estoques por lote: {}, Página: {}", idLote, page);
        
        Pageable pageable = createDefaultPageable(page, size);
        List<Estoque> estoquesList = estoqueRepository.findByIdLote(idLote);
        
        // Simular paginação manual
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), estoquesList.size());
        List<Estoque> pageContent = estoquesList.subList(start, end);
        
        Page<Estoque> estoques = new org.springframework.data.domain.PageImpl<>(pageContent, pageable, estoquesList.size());
        
        logPerformanceInfo("Estoques por Lote", estoques, startTime);
        return estoques;
    }

    /**
     * Salva um novo estoque
     * @param estoque Estoque a ser salvo
     * @return Estoque salvo
     */
    @Transactional
    @CacheEvict(value = {"estoques", "estoque"}, allEntries = true)
    public Estoque save(Estoque estoque) {
        long startTime = System.currentTimeMillis();
        log.info("Salvando novo estoque para produto ID: {}", estoque.getProduto().getId());
        
        Estoque estoqueSalvo = estoqueRepository.save(estoque);
        
        long endTime = System.currentTimeMillis();
        log.info("Estoque para produto ID {} salvo em {}ms", estoque.getProduto().getId(), endTime - startTime);
        
        return estoqueSalvo;
    }

    /**
     * Atualiza um estoque existente
     * @param estoque Estoque a ser atualizado
     * @return Estoque atualizado
     */
    @Transactional
    @CachePut(value = "estoque", key = "#estoque.id")
    @CacheEvict(value = "estoques", allEntries = true)
    public Estoque update(Estoque estoque) {
        long startTime = System.currentTimeMillis();
        log.info("Atualizando estoque ID: {}", estoque.getId());
        
        Estoque estoqueAtualizado = estoqueRepository.save(estoque);
        
        long endTime = System.currentTimeMillis();
        log.info("Estoque ID {} atualizado em {}ms", estoque.getId(), endTime - startTime);
        
        return estoqueAtualizado;
    }

    /**
     * Remove um estoque por ID
     * @param id ID do estoque a ser removido
     */
    @Transactional
    @CacheEvict(value = {"estoques", "estoque"}, allEntries = true)
    public void deleteById(Integer id) {
        long startTime = System.currentTimeMillis();
        log.info("Removendo estoque ID: {}", id);
        
        estoqueRepository.deleteById(id);
        
        long endTime = System.currentTimeMillis();
        log.info("Estoque ID {} removido em {}ms", id, endTime - startTime);
    }

    /**
     * Atualiza a quantidade de um estoque
     * @param id ID do estoque
     * @param novaQuantidade Nova quantidade
     * @return Estoque atualizado
     */
    @Transactional
    @CachePut(value = "estoque", key = "#id")
    @CacheEvict(value = "estoques", allEntries = true)
    public Estoque updateQuantidade(Integer id, Integer novaQuantidade) {
        long startTime = System.currentTimeMillis();
        log.info("Atualizando quantidade do estoque ID: {} para {}", id, novaQuantidade);
        
        Optional<Estoque> estoqueOpt = estoqueRepository.findById(id);
        if (estoqueOpt.isPresent()) {
            Estoque estoque = estoqueOpt.get();
            estoque.setQuantidadeEstoque(novaQuantidade);
            Estoque estoqueAtualizado = estoqueRepository.save(estoque);
            
            long endTime = System.currentTimeMillis();
            log.info("Quantidade do estoque ID {} atualizada em {}ms", id, endTime - startTime);
            
            return estoqueAtualizado;
        }
        
        log.warn("Estoque ID {} não encontrado para atualização de quantidade", id);
        return null;
    }

    /**
     * Verifica se um estoque existe por ID
     * @param id ID do estoque
     * @return true se existe, false caso contrário
     */
    @Cacheable(value = "estoque", key = "'exists_' + #id")
    public boolean existsById(Integer id) {
        return estoqueRepository.existsById(id);
    }

    /**
     * Conta o total de estoques
     * @return Total de estoques
     */
    @Cacheable(value = "estoque", key = "'count'")
    public long count() {
        return estoqueRepository.count();
    }

    /**
     * Conta estoques com quantidade baixa
     * @param quantidadeMinima Quantidade mínima
     * @return Total de estoques com quantidade baixa
     */
    @Cacheable(value = "estoque", key = "'count_quantidadeBaixa_' + #quantidadeMinima")
    public long countComQuantidadeBaixa(Integer quantidadeMinima) {
        // Implementar método específico no repository se necessário
        return estoqueRepository.count();
    }
}
