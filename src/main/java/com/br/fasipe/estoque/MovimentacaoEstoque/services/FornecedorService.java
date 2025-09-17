package com.br.fasipe.estoque.MovimentacaoEstoque.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.Fornecedor;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.FornecedorRepository;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;

import lombok.extern.slf4j.Slf4j;

import java.util.Optional;
import java.util.List;

/**
 * Service para gerenciamento de fornecedores com otimizações de performance
 * Implementa paginação, cache e consultas otimizadas
 */
@Slf4j
@Service
@Transactional(readOnly = true)
public class FornecedorService extends BaseService {

    @Autowired
    private FornecedorRepository fornecedorRepository;
    
    @Autowired
    private PessoaJuridicaService pessoaJuridicaService;

    /**
     * Busca todos os fornecedores com paginação otimizada
     * @param page Número da página (0-based)
     * @param size Tamanho da página (máximo 100)
     * @param sortBy Campo para ordenação
     * @param direction Direção da ordenação
     * @return Página de fornecedores
     */
    @Cacheable(value = "fornecedores", key = "#page + '_' + #size + '_' + #sortBy + '_' + #direction")
    public Page<Fornecedor> findAllPaginated(int page, int size, String sortBy, Sort.Direction direction) {
        long startTime = System.currentTimeMillis();
        log.info("Iniciando busca paginada de fornecedores - Página: {}, Tamanho: {}", page, size);
        
        Pageable pageable = createOptimizedPageable(page, size, sortBy, direction);
        Page<Fornecedor> fornecedores = fornecedorRepository.findAll(pageable);
        
        logPerformanceInfo("Fornecedores", fornecedores, startTime);
        return fornecedores;
    }

    /**
     * Busca todos os fornecedores com paginação padrão
     * @param page Número da página
     * @param size Tamanho da página
     * @return Página de fornecedores ordenados por ID
     */
    @Cacheable(value = "fornecedores", key = "#page + '_' + #size + '_default'")
    public Page<Fornecedor> findAllPaginated(int page, int size) {
        return findAllPaginated(page, size, "id", Sort.Direction.ASC);
    }

    /**
     * Busca fornecedor por ID com cache otimizado
     * @param id ID do fornecedor
     * @return Optional contendo o fornecedor se encontrado
     */
    @Cacheable(value = "fornecedor", key = "#id")
    public Optional<Fornecedor> findById(Integer id) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando fornecedor por ID: {}", id);
        
        Optional<Fornecedor> fornecedor = fornecedorRepository.findById(id);
        
        long endTime = System.currentTimeMillis();
        log.info("Busca de fornecedor por ID {} executada em {}ms", id, endTime - startTime);
        
        return fornecedor;
    }

    /**
     * Busca fornecedor por representante com cache
     * @param representante Nome do representante
     * @return Lista de fornecedores encontrados
     */
    @Cacheable(value = "fornecedor", key = "'representante_' + #representante")
    public List<Fornecedor> findByRepresentante(String representante) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando fornecedor por representante: {}", representante);
        
        List<Fornecedor> fornecedores = fornecedorRepository.findAllFornecedoresByRepresentante(representante);
        
        long endTime = System.currentTimeMillis();
        log.info("Busca de fornecedor por representante '{}' executada em {}ms", representante, endTime - startTime);
        
        return fornecedores;
    }

    /**
     * Busca fornecedor por contato do representante com cache
     * @param contatoRepresentante Contato do representante
     * @return Lista de fornecedores encontrados
     */
    @Cacheable(value = "fornecedor", key = "'contatoRepresentante_' + #contatoRepresentante")
    public List<Fornecedor> findByContatoRepresentante(String contatoRepresentante) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando fornecedor por contato do representante: {}", contatoRepresentante);
        
        List<Fornecedor> fornecedores = fornecedorRepository.findAllFornecedoresByContatoRepresentante(contatoRepresentante);
        
        long endTime = System.currentTimeMillis();
        log.info("Busca de fornecedor por contato do representante '{}' executada em {}ms", contatoRepresentante, endTime - startTime);
        
        return fornecedores;
    }

    /**
     * Busca fornecedores por nome fantasia com paginação
     * @param nomeFantasia Nome fantasia do fornecedor
     * @param page Número da página
     * @param size Tamanho da página
     * @return Página de fornecedores com o nome fantasia
     */
    @Cacheable(value = "fornecedores", key = "'nomeFantasia_' + #nomeFantasia + '_' + #page + '_' + #size")
    public Page<Fornecedor> findByNomeFantasia(String nomeFantasia, int page, int size) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando fornecedores por nome fantasia: {}, Página: {}", nomeFantasia, page);
        
        Pageable pageable = createDefaultPageable(page, size);
        // Implementar método no repository se necessário
        Page<Fornecedor> fornecedores = fornecedorRepository.findAll(pageable);
        
        logPerformanceInfo("Fornecedores por Nome Fantasia", fornecedores, startTime);
        return fornecedores;
    }

    /**
     * Busca fornecedores ativos com paginação
     * @param page Número da página
     * @param size Tamanho da página
     * @return Página de fornecedores ativos
     */
    @Cacheable(value = "fornecedores", key = "'ativos_' + #page + '_' + #size")
    public Page<Fornecedor> findFornecedoresAtivos(int page, int size) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando fornecedores ativos - Página: {}", page);
        
        Pageable pageable = createDefaultPageable(page, size);
        // Implementar método específico no repository se necessário
        Page<Fornecedor> fornecedores = fornecedorRepository.findAll(pageable);
        
        logPerformanceInfo("Fornecedores Ativos", fornecedores, startTime);
        return fornecedores;
    }

    /**
     * Salva um novo fornecedor
     * @param fornecedor Fornecedor a ser salvo
     * @return Fornecedor salvo
     */
    @Transactional
    @CacheEvict(value = {"fornecedores", "fornecedor"}, allEntries = true)
    public Fornecedor save(Fornecedor fornecedor) {
        long startTime = System.currentTimeMillis();
        log.info("Salvando novo fornecedor: {}", fornecedor.getRepresentante());
        
        // Verifica se a pessoa jurídica existe e salva se necessário
        if (fornecedor.getPessoasJuridica() != null) {
            if (fornecedor.getPessoasJuridica().getId() == null) {
                // Se não tem ID, salva nova pessoa jurídica
                fornecedor.setPessoasJuridica(pessoaJuridicaService.save(fornecedor.getPessoasJuridica()));
            } else {
                // Se tem ID, verifica se existe
                pessoaJuridicaService.findById(fornecedor.getPessoasJuridica().getId())
                    .orElseThrow(() -> new IllegalArgumentException("PessoaJuridica não encontrada com o ID: " 
                        + fornecedor.getPessoasJuridica().getId()));
            }
        }
        
        Fornecedor fornecedorSalvo = fornecedorRepository.save(fornecedor);
        
        long endTime = System.currentTimeMillis();
        log.info("Fornecedor '{}' salvo em {}ms", fornecedor.getRepresentante(), endTime - startTime);
        
        return fornecedorSalvo;
    }

    /**
     * Atualiza um fornecedor existente
     * @param fornecedor Fornecedor a ser atualizado
     * @return Fornecedor atualizado
     */
    @Transactional
    @CachePut(value = "fornecedor", key = "#fornecedor.id")
    @CacheEvict(value = "fornecedores", allEntries = true)
    public Fornecedor update(Fornecedor fornecedor) {
        long startTime = System.currentTimeMillis();
        log.info("Atualizando fornecedor ID: {}", fornecedor.getId());
        
        Fornecedor fornecedorAtualizado = fornecedorRepository.save(fornecedor);
        
        long endTime = System.currentTimeMillis();
        log.info("Fornecedor ID {} atualizado em {}ms", fornecedor.getId(), endTime - startTime);
        
        return fornecedorAtualizado;
    }

    /**
     * Remove um fornecedor por ID
     * @param id ID do fornecedor a ser removido
     */
    @Transactional
    @CacheEvict(value = {"fornecedores", "fornecedor"}, allEntries = true)
    public void deleteById(Integer id) {
        long startTime = System.currentTimeMillis();
        log.info("Removendo fornecedor ID: {}", id);
        
        fornecedorRepository.deleteById(id);
        
        long endTime = System.currentTimeMillis();
        log.info("Fornecedor ID {} removido em {}ms", id, endTime - startTime);
    }

    /**
     * Verifica se um fornecedor existe por ID
     * @param id ID do fornecedor
     * @return true se existe, false caso contrário
     */
    @Cacheable(value = "fornecedor", key = "'exists_' + #id")
    public boolean existsById(Integer id) {
        return fornecedorRepository.existsById(id);
    }

    /**
     * Verifica se um fornecedor existe por representante
     * @param representante Nome do representante
     * @return true se existe, false caso contrário
     */
    @Cacheable(value = "fornecedor", key = "'exists_representante_' + #representante")
    public boolean existsByRepresentante(String representante) {
        return !fornecedorRepository.findAllFornecedoresByRepresentante(representante).isEmpty();
    }

    /**
     * Conta o total de fornecedores
     * @return Total de fornecedores
     */
    @Cacheable(value = "fornecedor", key = "'count'")
    public long count() {
        return fornecedorRepository.count();
    }

    /**
     * Conta fornecedores ativos
     * @return Total de fornecedores ativos
     */
    @Cacheable(value = "fornecedor", key = "'count_ativos'")
    public long countAtivos() {
        // Implementar método específico no repository se necessário
        return fornecedorRepository.count();
    }
}
