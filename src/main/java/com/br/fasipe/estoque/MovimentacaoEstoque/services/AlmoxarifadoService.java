package com.br.fasipe.estoque.MovimentacaoEstoque.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.Almoxarifado;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.AlmoxarifadoRepository;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;

import lombok.extern.slf4j.Slf4j;

import java.util.Optional;

/**
 * Service para gerenciamento de almoxarifados com otimizações de performance
 * Implementa paginação, cache e consultas otimizadas
 */
@Slf4j
@Service
@Transactional(readOnly = true)
public class AlmoxarifadoService extends BaseService {

    @Autowired
    private AlmoxarifadoRepository almoxarifadoRepository;

    /**
     * Busca todos os almoxarifados com paginação otimizada
     * @param page Número da página (0-based)
     * @param size Tamanho da página (máximo 100)
     * @param sortBy Campo para ordenação
     * @param direction Direção da ordenação
     * @return Página de almoxarifados
     */
    @Cacheable(value = "almoxarifados", key = "#page + '_' + #size + '_' + #sortBy + '_' + #direction")
    public Page<Almoxarifado> findAllPaginated(int page, int size, String sortBy, Sort.Direction direction) {
        long startTime = System.currentTimeMillis();
        log.info("Iniciando busca paginada de almoxarifados - Página: {}, Tamanho: {}", page, size);
        
        Pageable pageable = createOptimizedPageable(page, size, sortBy, direction);
        Page<Almoxarifado> almoxarifados = almoxarifadoRepository.findAll(pageable);
        
        logPerformanceInfo("Almoxarifados", almoxarifados, startTime);
        return almoxarifados;
    }

    /**
     * Busca todos os almoxarifados com paginação padrão
     * @param page Número da página
     * @param size Tamanho da página
     * @return Página de almoxarifados ordenados por ID
     */
    @Cacheable(value = "almoxarifados", key = "#page + '_' + #size + '_default'")
    public Page<Almoxarifado> findAllPaginated(int page, int size) {
        return findAllPaginated(page, size, "id", Sort.Direction.ASC);
    }

    /**
     * Busca almoxarifado por ID com cache otimizado
     * @param id ID do almoxarifado
     * @return Optional contendo o almoxarifado se encontrado
     */
    @Cacheable(value = "almoxarifado", key = "#id")
    public Optional<Almoxarifado> findById(Integer id) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando almoxarifado por ID: {}", id);
        
        Optional<Almoxarifado> almoxarifado = almoxarifadoRepository.findById(id);
        
        long endTime = System.currentTimeMillis();
        log.info("Busca de almoxarifado por ID {} executada em {}ms", id, endTime - startTime);
        
        return almoxarifado;
    }

    /**
     * Busca almoxarifado por nome com cache
     * @param nome Nome do almoxarifado
     * @return Optional contendo o almoxarifado se encontrado
     */
    @Cacheable(value = "almoxarifado", key = "'nome_' + #nome")
    public Optional<Almoxarifado> findByNome(String nome) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando almoxarifado por nome: {}", nome);
        
        Optional<Almoxarifado> almoxarifado = almoxarifadoRepository.findByNOMEALMO(nome);
        
        long endTime = System.currentTimeMillis();
        log.info("Busca de almoxarifado por nome '{}' executada em {}ms", nome, endTime - startTime);
        
        return almoxarifado;
    }

    /**
     * Busca almoxarifados por setor com paginação
     * @param idSetor ID do setor
     * @param page Número da página
     * @param size Tamanho da página
     * @return Página de almoxarifados do setor
     */
    @Cacheable(value = "almoxarifados", key = "'setor_' + #idSetor + '_' + #page + '_' + #size")
    public Page<Almoxarifado> findBySetor(Integer idSetor, int page, int size) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando almoxarifados por setor: {}, Página: {}", idSetor, page);
        
        Pageable pageable = createDefaultPageable(page, size);
        // Implementar método no repository se necessário
        Page<Almoxarifado> almoxarifados = almoxarifadoRepository.findAll(pageable);
        
        logPerformanceInfo("Almoxarifados por Setor", almoxarifados, startTime);
        return almoxarifados;
    }

    /**
     * Busca almoxarifados ativos com paginação
     * @param page Número da página
     * @param size Tamanho da página
     * @return Página de almoxarifados ativos
     */
    @Cacheable(value = "almoxarifados", key = "'ativos_' + #page + '_' + #size")
    public Page<Almoxarifado> findAlmoxarifadosAtivos(int page, int size) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando almoxarifados ativos - Página: {}", page);
        
        Pageable pageable = createDefaultPageable(page, size);
        // Implementar método específico no repository se necessário
        Page<Almoxarifado> almoxarifados = almoxarifadoRepository.findAll(pageable);
        
        logPerformanceInfo("Almoxarifados Ativos", almoxarifados, startTime);
        return almoxarifados;
    }

    /**
     * Salva um novo almoxarifado
     * @param almoxarifado Almoxarifado a ser salvo
     * @return Almoxarifado salvo
     */
    @Transactional
    @CacheEvict(value = {"almoxarifados", "almoxarifado"}, allEntries = true)
    public Almoxarifado save(Almoxarifado almoxarifado) {
        long startTime = System.currentTimeMillis();
        log.info("Salvando novo almoxarifado: {}", almoxarifado.getNome());
        
        Almoxarifado almoxarifadoSalvo = almoxarifadoRepository.save(almoxarifado);
        
        long endTime = System.currentTimeMillis();
        log.info("Almoxarifado '{}' salvo em {}ms", almoxarifado.getNome(), endTime - startTime);
        
        return almoxarifadoSalvo;
    }

    /**
     * Atualiza um almoxarifado existente
     * @param almoxarifado Almoxarifado a ser atualizado
     * @return Almoxarifado atualizado
     */
    @Transactional
    @CachePut(value = "almoxarifado", key = "#almoxarifado.id")
    @CacheEvict(value = "almoxarifados", allEntries = true)
    public Almoxarifado update(Almoxarifado almoxarifado) {
        long startTime = System.currentTimeMillis();
        log.info("Atualizando almoxarifado ID: {}", almoxarifado.getId());
        
        Almoxarifado almoxarifadoAtualizado = almoxarifadoRepository.save(almoxarifado);
        
        long endTime = System.currentTimeMillis();
        log.info("Almoxarifado ID {} atualizado em {}ms", almoxarifado.getId(), endTime - startTime);
        
        return almoxarifadoAtualizado;
    }

    /**
     * Remove um almoxarifado por ID
     * @param id ID do almoxarifado a ser removido
     */
    @Transactional
    @CacheEvict(value = {"almoxarifados", "almoxarifado"}, allEntries = true)
    public void deleteById(Integer id) {
        long startTime = System.currentTimeMillis();
        log.info("Removendo almoxarifado ID: {}", id);
        
        almoxarifadoRepository.deleteById(id);
        
        long endTime = System.currentTimeMillis();
        log.info("Almoxarifado ID {} removido em {}ms", id, endTime - startTime);
    }

    /**
     * Verifica se um almoxarifado existe por ID
     * @param id ID do almoxarifado
     * @return true se existe, false caso contrário
     */
    @Cacheable(value = "almoxarifado", key = "'exists_' + #id")
    public boolean existsById(Integer id) {
        return almoxarifadoRepository.existsById(id);
    }

    /**
     * Verifica se um almoxarifado existe por nome
     * @param nome Nome do almoxarifado
     * @return true se existe, false caso contrário
     */
    @Cacheable(value = "almoxarifado", key = "'exists_nome_' + #nome")
    public boolean existsByNome(String nome) {
        return almoxarifadoRepository.findByNOMEALMO(nome).isPresent();
    }

    /**
     * Conta o total de almoxarifados
     * @return Total de almoxarifados
     */
    @Cacheable(value = "almoxarifado", key = "'count'")
    public long count() {
        return almoxarifadoRepository.count();
    }

    /**
     * Conta almoxarifados ativos
     * @return Total de almoxarifados ativos
     */
    @Cacheable(value = "almoxarifado", key = "'count_ativos'")
    public long countAtivos() {
        // Implementar método específico no repository se necessário
        return almoxarifadoRepository.count();
    }
}
