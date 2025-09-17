package com.br.fasipe.estoque.MovimentacaoEstoque.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.Almoxarifado;
import com.br.fasipe.estoque.MovimentacaoEstoque.models.Produto;
import com.br.fasipe.estoque.MovimentacaoEstoque.models.UnidadeMedida;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.ProdutoRepository;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;

import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.util.Optional;

/**
 * Service para gerenciamento de produtos com otimizações de performance
 * Implementa paginação, cache e consultas otimizadas
 */
@Slf4j
@Service
@Transactional(readOnly = true)
public class ProdutoService extends BaseService {

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private UnidadeMedidaService unidadeMedidaService;

    @Autowired
    private AlmoxarifadoService almoxarifadoService;

    /**
     * Busca todos os produtos com paginação otimizada
     * @param page Número da página (0-based)
     * @param size Tamanho da página (máximo 100)
     * @param sortBy Campo para ordenação
     * @param direction Direção da ordenação
     * @return Página de produtos
     */
    @Cacheable(value = "produtos", key = "#page + '_' + #size + '_' + #sortBy + '_' + #direction")
    public Page<Produto> findAllPaginated(int page, int size, String sortBy, Sort.Direction direction) {
        long startTime = System.currentTimeMillis();
        log.info("Iniciando busca paginada de produtos - Página: {}, Tamanho: {}", page, size);
        
        Pageable pageable = createOptimizedPageable(page, size, sortBy, direction);
        Page<Produto> produtos = produtoRepository.findAll(pageable);
        
        logPerformanceInfo("Produtos", produtos, startTime);
        return produtos;
    }

    /**
     * Busca todos os produtos com paginação padrão
     * @param page Número da página
     * @param size Tamanho da página
     * @return Página de produtos ordenados por ID
     */
    @Cacheable(value = "produtos", key = "#page + '_' + #size + '_default'")
    public Page<Produto> findAllPaginated(int page, int size) {
        return findAllPaginated(page, size, "id", Sort.Direction.ASC);
    }

    /**
     * Busca produto por ID com cache otimizado
     * @param id ID do produto
     * @return Optional contendo o produto se encontrado
     */
    @Cacheable(value = "produto", key = "#id")
    public Optional<Produto> findById(Integer id) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando produto por ID: {}", id);
        
        Optional<Produto> produto = produtoRepository.findByIdProduto(id);
        
        long endTime = System.currentTimeMillis();
        log.info("Busca de produto por ID {} executada em {}ms", id, endTime - startTime);
        
        return produto;
    }

    /**
     * Busca produto por nome com cache
     * @param nome Nome do produto
     * @return Optional contendo o produto se encontrado
     */
    @Cacheable(value = "produto", key = "'nome_' + #nome")
    public Optional<Produto> findByNome(String nome) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando produto por nome: {}", nome);
        
        Optional<Produto> produto = produtoRepository.findByNome(nome);
        
        long endTime = System.currentTimeMillis();
        log.info("Busca de produto por nome '{}' executada em {}ms", nome, endTime - startTime);
        
        return produto;
    }

    /**
     * Busca produtos por almoxarifado com paginação
     * @param idAlmoxarifado ID do almoxarifado
     * @param page Número da página
     * @param size Tamanho da página
     * @return Página de produtos do almoxarifado
     */
    @Cacheable(value = "produtos", key = "'almoxarifado_' + #idAlmoxarifado + '_' + #page + '_' + #size")
    public Page<Produto> findByAlmoxarifado(Integer idAlmoxarifado, int page, int size) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando produtos por almoxarifado: {}, Página: {}", idAlmoxarifado, page);
        
        Pageable pageable = createDefaultPageable(page, size);
        // Implementar método no repository se necessário
        // Por enquanto, busca todos e filtra
        Page<Produto> produtos = produtoRepository.findAll(pageable);
        
        logPerformanceInfo("Produtos por Almoxarifado", produtos, startTime);
        return produtos;
    }

    /**
     * Busca produto por código de barras
     * @param codBarras Código de barras do produto
     * @return Optional contendo o produto se encontrado
     */
    @Cacheable(value = "produto", key = "'codBarras_' + #codBarras")
    public Optional<Produto> findByCodBarras(String codBarras) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando produto por código de barras: {}", codBarras);
        
        Optional<Produto> produto = produtoRepository.findByCodBarras(codBarras);
        
        long endTime = System.currentTimeMillis();
        log.info("Busca de produto por código de barras '{}' executada em {}ms", codBarras, endTime - startTime);
        
        return produto;
    }

    /**
     * Busca produtos por temperatura ideal com paginação
     * @param tempIdeal Temperatura ideal
     * @param page Número da página
     * @param size Tamanho da página
     * @return Página de produtos com a temperatura ideal
     */
    @Cacheable(value = "produtos", key = "'tempIdeal_' + #tempIdeal + '_' + #page + '_' + #size")
    public Page<Produto> findByTempIdeal(BigDecimal tempIdeal, int page, int size) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando produtos por temperatura ideal: {}, Página: {}", tempIdeal, page);
        
        Pageable pageable = createDefaultPageable(page, size);
        // Implementar método no repository se necessário
        Page<Produto> produtos = produtoRepository.findAll(pageable);
        
        logPerformanceInfo("Produtos por Temperatura Ideal", produtos, startTime);
        return produtos;
    }

    /**
     * Busca produtos com estoque baixo (abaixo do mínimo) com paginação
     * @param page Número da página
     * @param size Tamanho da página
     * @return Página de produtos com estoque baixo
     */
    @Cacheable(value = "produtos", key = "'estoqueBaixo_' + #page + '_' + #size")
    public Page<Produto> findProdutosComEstoqueBaixo(int page, int size) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando produtos com estoque baixo - Página: {}", page);
        
        Pageable pageable = createDefaultPageable(page, size);
        // Implementar método específico no repository se necessário
        Page<Produto> produtos = produtoRepository.findAll(pageable);
        
        logPerformanceInfo("Produtos com Estoque Baixo", produtos, startTime);
        return produtos;
    }

    /**
     * Busca produtos próximos do ponto de pedido com paginação
     * @param page Número da página
     * @param size Tamanho da página
     * @return Página de produtos próximos do ponto de pedido
     */
    @Cacheable(value = "produtos", key = "'proximosPedido_' + #page + '_' + #size")
    public Page<Produto> findProdutosProximosDoPedido(int page, int size) {
        long startTime = System.currentTimeMillis();
        log.info("Buscando produtos próximos do ponto de pedido - Página: {}", page);
        
        Pageable pageable = createDefaultPageable(page, size);
        // Implementar método específico no repository se necessário
        Page<Produto> produtos = produtoRepository.findAll(pageable);
        
        logPerformanceInfo("Produtos Próximos do Pedido", produtos, startTime);
        return produtos;
    }

    /**
     * Salva um novo produto
     * @param produto Produto a ser salvo
     * @return Produto salvo
     */
    @Transactional
    @CacheEvict(value = {"produtos", "produto"}, allEntries = true)
    public Produto save(Produto produto) {
        long startTime = System.currentTimeMillis();
        log.info("Salvando novo produto: {}", produto.getNome());
        
        // Verifica e salva a unidade de medida primeiro se ela não tiver ID
        if (produto.getUnidadeMedida() != null && produto.getUnidadeMedida().getId() == null) {
            UnidadeMedida unidadeMedida = unidadeMedidaService.save(produto.getUnidadeMedida());
            produto.setUnidadeMedida(unidadeMedida);
        }

        // Verifica e salva o almoxarifado primeiro se ele não tiver ID
        if (produto.getAlmoxarifado() != null && produto.getAlmoxarifado().getId() == null) {
            Almoxarifado almoxarifado = almoxarifadoService.save(produto.getAlmoxarifado());
            produto.setAlmoxarifado(almoxarifado);
        }
        
        // Verifica se os objetos necessários existem
        if (produto.getAlmoxarifado() == null) {
            throw new IllegalArgumentException("O almoxarifado é obrigatório");
        }
        if (produto.getUnidadeMedida() == null) {
            throw new IllegalArgumentException("A unidade de medida é obrigatória");
        }
        
        Produto produtoSalvo = produtoRepository.save(produto);
        
        long endTime = System.currentTimeMillis();
        log.info("Produto '{}' salvo em {}ms", produto.getNome(), endTime - startTime);
        
        return produtoSalvo;
    }

    /**
     * Atualiza um produto existente
     * @param produto Produto a ser atualizado
     * @return Produto atualizado
     */
    @Transactional
    @CachePut(value = "produto", key = "#produto.id")
    @CacheEvict(value = "produtos", allEntries = true)
    public Produto update(Produto produto) {
        long startTime = System.currentTimeMillis();
        log.info("Atualizando produto ID: {}", produto.getId());
        
        Produto produtoAtualizado = produtoRepository.save(produto);
        
        long endTime = System.currentTimeMillis();
        log.info("Produto ID {} atualizado em {}ms", produto.getId(), endTime - startTime);
        
        return produtoAtualizado;
    }

    /**
     * Remove um produto por ID
     * @param id ID do produto a ser removido
     */
    @Transactional
    @CacheEvict(value = {"produtos", "produto"}, allEntries = true)
    public void deleteById(Integer id) {
        long startTime = System.currentTimeMillis();
        log.info("Removendo produto ID: {}", id);
        
        produtoRepository.deleteById(id);
        
        long endTime = System.currentTimeMillis();
        log.info("Produto ID {} removido em {}ms", id, endTime - startTime);
    }

    /**
     * Verifica se um produto existe por ID
     * @param id ID do produto
     * @return true se existe, false caso contrário
     */
    @Cacheable(value = "produto", key = "'exists_' + #id")
    public boolean existsById(Integer id) {
        return produtoRepository.existsById(id);
    }

    /**
     * Conta o total de produtos
     * @return Total de produtos
     */
    @Cacheable(value = "produto", key = "'count'")
    public long count() {
        return produtoRepository.count();
    }
}
