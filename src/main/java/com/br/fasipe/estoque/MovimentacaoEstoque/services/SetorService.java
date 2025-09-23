package com.br.fasipe.estoque.MovimentacaoEstoque.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.Setor;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.SetorRepository;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;

import lombok.extern.slf4j.Slf4j;

import java.util.Optional;


/**
 * Service para gerenciamento de setores com otimizações de performance
 * Implementa paginação, cache e consultas otimizadas
 */
@Slf4j
@Service
@Transactional(readOnly = true)
public class SetorService extends BaseService {

    @Autowired
    private SetorRepository setorRepository;

    /**
     * Busca todos os setores sem paginação
     * @return Lista de todos os setores
     */
    @Cacheable(value = "setores", key = "'all'")
    public java.util.List<Setor> findAll() {
        long startTime = System.currentTimeMillis();
        log.info("Buscando todos os setores");
        
        java.util.List<Setor> setores = setorRepository.findAll();
        
        long endTime = System.currentTimeMillis();
        log.info("Busca de todos os setores executada em {}ms. Total: {}", endTime - startTime, setores.size());
        
        return setores;
    }

    /**
     * Busca todos os setores com paginação otimizada
     * @param page Número da página (0-based)
     * @param size Tamanho da página (máximo 100)
     * @param sortBy Campo para ordenação
     * @param direction Direção da ordenação
     * @return Página de setores
     */
    @Cacheable(value = "setores", key = "#page + '_' + #size + '_' + #sortBy + '_' + #direction")
    public Page<Setor> findAllPaginated(int page, int size, String sortBy, Sort.Direction direction) {
        long startTime = System.currentTimeMillis();
        log.info("Iniciando busca paginada de setores - Página: {}, Tamanho: {}", page, size);
        
        Pageable pageable = createOptimizedPageable(page, size, sortBy, direction);
        Page<Setor> setores = setorRepository.findAll(pageable);
        
        logPerformanceInfo("Setores", setores, startTime);
        return setores;
    }

    /**
     * Busca todos os setores com paginação padrão
     * @param page Número da página
     * @param size Tamanho da página
     * @return Página de setores ordenados por ID
     */
    @Cacheable(value = "setores", key = "#page + '_' + #size + '_default'")
    public Page<Setor> findAllPaginated(int page, int size) {
        return findAllPaginated(page, size, "id", Sort.Direction.ASC);
    }

    /**
     * Busca setor por ID com cache otimizado
     * @param id ID do setor
     * @return Optional contendo o setor se encontrado
     */
    @Cacheable(value = "setor", key = "#id")
    public Optional<Setor> findById(Integer id) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando setor por ID: {}", id);
        
        Optional<Setor> setor = setorRepository.findById(id);
        
        long endTime = System.currentTimeMillis();
        log.info("Busca de setor por ID {} executada em {}ms", id, endTime - startTime);
        
        return setor;
    }

    /**
     * Busca setor por nome com cache
     * @param nome Nome do setor
     * @return Optional contendo o setor se encontrado
     */
    @Cacheable(value = "setor", key = "'nome_' + #nome")
    public Optional<Setor> findByNome(String nome) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando setor por nome: {}", nome);
        
        Optional<Setor> setor = setorRepository.findByNomeSetor(nome);
        
        long endTime = System.currentTimeMillis();
        log.info("Busca de setor por nome '{}' executada em {}ms", nome, endTime - startTime);
        
        return setor;
    }

    /**
     * Salva um novo setor
     * @param setor Setor a ser salvo
     * @return Setor salvo
     */
    @Transactional
    @CacheEvict(value = {"setores", "setor"}, allEntries = true)
    public Setor save(Setor setor) {
        long startTime = System.currentTimeMillis();
        log.info("Salvando novo setor: {}", setor.getNome());
        
        Setor setorSalvo = setorRepository.save(setor);
        
        long endTime = System.currentTimeMillis();
        log.info("Setor '{}' salvo em {}ms", setor.getNome(), endTime - startTime);
        
        return setorSalvo;
    }

    /**
     * Atualiza um setor existente
     * @param setor Setor a ser atualizado
     * @return Setor atualizado
     */
    @Transactional
    @CachePut(value = "setor", key = "#setor.id")
    @CacheEvict(value = "setores", allEntries = true)
    public Setor update(Setor setor) {
        long startTime = System.currentTimeMillis();
        log.info("Atualizando setor ID: {}", setor.getId());
        
        Setor setorAtualizado = setorRepository.save(setor);
        
        long endTime = System.currentTimeMillis();
        log.info("Setor ID {} atualizado em {}ms", setor.getId(), endTime - startTime);
        
        return setorAtualizado;
    }

    /**
     * Remove um setor por ID
     * @param id ID do setor a ser removido
     */
    @Transactional
    @CacheEvict(value = {"setores", "setor"}, allEntries = true)
    public void deleteById(Integer id) {
        long startTime = System.currentTimeMillis();
        log.info("Removendo setor ID: {}", id);
        
        setorRepository.deleteById(id);
        
        long endTime = System.currentTimeMillis();
        log.info("Setor ID {} removido em {}ms", id, endTime - startTime);
    }

    /**
     * Verifica se um setor existe por ID
     * @param id ID do setor
     * @return true se existe, false caso contrário
     */
    @Cacheable(value = "setor", key = "'exists_' + #id")
    public boolean existsById(Integer id) {
        return setorRepository.existsById(id);
    }

    /**
     * Verifica se um setor existe por nome
     * @param nome Nome do setor
     * @return true se existe, false caso contrário
     */
    @Cacheable(value = "setor", key = "'exists_nome_' + #nome")
    public boolean existsByNome(String nome) {
        return setorRepository.findByNomeSetor(nome).isPresent();
    }

    /**
     * Conta o total de setores
     * @return Total de setores
     */
    @Cacheable(value = "setor", key = "'count'")
    public long count() {
        return setorRepository.count();
    }
}
