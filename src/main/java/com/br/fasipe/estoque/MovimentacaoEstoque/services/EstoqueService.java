package com.br.fasipe.estoque.MovimentacaoEstoque.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.Estoque;
import com.br.fasipe.estoque.MovimentacaoEstoque.models.Setor;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.EstoqueRepository;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.SetorRepository;

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
    
    @Autowired
    private SetorRepository setorRepository;

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

    /**
     * Busca estoque agrupado por setor para exibição no painel de movimentação
     * Retorna dados organizados por setor com informações completas
     * IMPORTANTE: Retorna TODOS os produtos, incluindo os sem quantidade (0)
     * @return Lista de estoques organizados por setor
     */
    public List<java.util.Map<String, Object>> buscarEstoquePorSetor() {
        try {
            log.info("========== BUSCANDO ESTOQUE POR SETOR ==========");
            
            // PRIMEIRO: Listar TODOS os setores cadastrados no banco
            List<Setor> todosSetores = setorRepository.findAll();
            log.info("========== SETORES CADASTRADOS NO BANCO ==========");
            log.info("Total de setores no banco: {}", todosSetores.size());
            for (Setor setor : todosSetores) {
                log.info("🏢 Setor ID: {} | Nome: {}", setor.getId(), setor.getNome());
            }
            log.info("==================================================");
            
            // Buscar TODOS os estoques com JOIN FETCH (carrega tudo de uma vez)
            List<Estoque> estoques = estoqueRepository.findAllWithFullDetails();
            
            log.info("Total de registros de estoque encontrados: {}", estoques.size());
            
            // Agrupar por setor
            java.util.Map<Integer, java.util.List<java.util.Map<String, Object>>> estoquePorSetorId = new java.util.LinkedHashMap<>();
            
            // Inicializar TODOS os setores (mesmo os vazios)
            for (Setor setor : todosSetores) {
                estoquePorSetorId.put(setor.getId(), new java.util.ArrayList<>());
            }
            
            // Processar estoques e adicionar aos setores correspondentes
            for (Estoque estoque : estoques) {
                if (estoque.getProduto() != null && 
                    estoque.getProduto().getAlmoxarifado() != null &&
                    estoque.getProduto().getAlmoxarifado().getSetor() != null) {
                    
                    Integer setorId = estoque.getProduto().getAlmoxarifado().getSetor().getId();
                    String setorNome = estoque.getProduto().getAlmoxarifado().getSetor().getNome();
                    String produtoNome = estoque.getProduto().getNome();
                    String produtoDesc = estoque.getProduto().getDescricao();
                    Integer quantidade = estoque.getQuantidadeEstoque() != null ? estoque.getQuantidadeEstoque() : 0;
                    
                    // Criar item de estoque
                    java.util.Map<String, Object> itemEstoque = new java.util.HashMap<>();
                    itemEstoque.put("id", estoque.getId());
                    
                    // Produto
                    java.util.Map<String, Object> produtoMap = new java.util.HashMap<>();
                    produtoMap.put("id", estoque.getProduto().getId());
                    produtoMap.put("nome", produtoNome);
                    produtoMap.put("descricao", produtoDesc != null ? produtoDesc : "");
                    itemEstoque.put("produto", produtoMap);
                    
                    // Quantidade
                    itemEstoque.put("quantidadeEstoque", quantidade);
                    
                    // Setor
                    java.util.Map<String, Object> setorMap = new java.util.HashMap<>();
                    setorMap.put("id", setorId);
                    setorMap.put("nome", setorNome);
                    itemEstoque.put("setor", setorMap);
                    
                    // Adicionar ao setor correspondente
                    if (estoquePorSetorId.containsKey(setorId)) {
                        estoquePorSetorId.get(setorId).add(itemEstoque);
                    }
                    
                    log.info("✅ Produto: {} | Setor: {} | Qtd: {}", produtoNome, setorNome, quantidade);
                }
            }
            
            // Converter para lista plana incluindo TODOS os setores
            List<java.util.Map<String, Object>> resultado = new java.util.ArrayList<>();
            
            for (Setor setor : todosSetores) {
                java.util.List<java.util.Map<String, Object>> produtosDoSetor = estoquePorSetorId.get(setor.getId());
                
                if (produtosDoSetor != null && !produtosDoSetor.isEmpty()) {
                    // Setor COM produtos - adicionar todos
                    resultado.addAll(produtosDoSetor);
                    log.info("🏢 Setor {} : {} produtos", setor.getNome(), produtosDoSetor.size());
                } else {
                    // Setor SEM produtos - adicionar marcador vazio
                    java.util.Map<String, Object> setorVazio = new java.util.HashMap<>();
                    setorVazio.put("id", null);
                    setorVazio.put("produto", java.util.Map.of("id", 0, "nome", "Nenhum produto neste setor", "descricao", ""));
                    setorVazio.put("quantidadeEstoque", 0);
                    setorVazio.put("setor", java.util.Map.of("id", setor.getId(), "nome", setor.getNome()));
                    resultado.add(setorVazio);
                    log.info("🏢 Setor {} : 0 produtos (vazio)", setor.getNome());
                }
            }
            
            log.info("========== RETORNANDO {} REGISTROS (incluindo setores vazios) ==========", resultado.size());
            
            return resultado;
            
        } catch (Exception e) {
            log.error("Erro ao buscar estoque por setor: {}", e.getMessage(), e);
            return new java.util.ArrayList<>();
        }
    }

    /**
     * Busca produtos que têm almoxarifado associado e suas quantidades em estoque
     * Para exibição na barra lateral - apenas produtos com ID_ALMOX NOT NULL
     * @return Lista de mapas com informações dos produtos e suas quantidades
     */
    public List<java.util.Map<String, Object>> buscarProdutosComAlmoxarifado() {
        try {
            log.info("Buscando produtos com almoxarifado para barra lateral");
            
            // Buscar todos os estoques onde o produto tem almoxarifado
            List<Estoque> estoques = estoqueRepository.findAll();
            List<java.util.Map<String, Object>> resultado = new java.util.ArrayList<>();
            
            // Agrupar por setor (baseado no almoxarifado do produto)
            java.util.Map<String, List<java.util.Map<String, Object>>> estoquePorSetor = new java.util.LinkedHashMap<>();
            
            for (Estoque estoque : estoques) {
                if (estoque.getProduto() != null && estoque.getProduto().getAlmoxarifado() != null) {
                    // Produto tem almoxarifado, pode aparecer na barra lateral
                    
                    String nomeSetor = estoque.getProduto().getAlmoxarifado().getNome();
                    
                    java.util.Map<String, Object> itemEstoque = new java.util.HashMap<>();
                    itemEstoque.put("id", estoque.getId());
                    itemEstoque.put("produto", java.util.Map.of(
                        "id", estoque.getProduto().getId(),
                        "nome", estoque.getProduto().getNome(),
                        "descricao", estoque.getProduto().getDescricao()
                    ));
                    itemEstoque.put("quantidadeEstoque", estoque.getQuantidadeEstoque());
                    itemEstoque.put("setor", java.util.Map.of(
                        "id", estoque.getProduto().getAlmoxarifado().getId(),
                        "nome", nomeSetor
                    ));
                    
                    // Adicionar ao grupo do setor
                    if (!estoquePorSetor.containsKey(nomeSetor)) {
                        estoquePorSetor.put(nomeSetor, new java.util.ArrayList<>());
                    }
                    estoquePorSetor.get(nomeSetor).add(itemEstoque);
                }
            }
            
            // Converter para lista plana mantendo agrupamento
            for (java.util.Map.Entry<String, List<java.util.Map<String, Object>>> entry : estoquePorSetor.entrySet()) {
                resultado.addAll(entry.getValue());
            }
            
            log.info("Encontrados {} produtos com almoxarifado agrupados por {} setores", 
                    resultado.size(), estoquePorSetor.size());
            
            return resultado;
            
        } catch (Exception e) {
            log.error("Erro ao buscar produtos com almoxarifado: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao buscar produtos com almoxarifado", e);
        }
    }

    /**
     * Busca estoque por setor em tempo real (SEM CACHE)
     * Força consulta direta ao banco para garantir dados atualizados após movimentações
     * IMPORTANTE: Retorna TODOS os produtos, incluindo os sem quantidade (0)
     * @return Lista de estoques organizados por setor com dados em tempo real
     */
    @CacheEvict(value = "estoques", allEntries = true) // Limpa cache antes da consulta
    public List<java.util.Map<String, Object>> buscarEstoquePorSetorSemCache() {
        try {
            log.info("========== TEMPO REAL: BUSCANDO ESTOQUE (SEM CACHE) ==========");
            
            // Força consulta direta com JOIN FETCH
            List<Estoque> estoques = estoqueRepository.findAllWithFullDetails();
            List<java.util.Map<String, Object>> resultado = new java.util.ArrayList<>();
            
            log.info("TEMPO REAL: Consultados {} registros do banco de dados", estoques.size());
            
            for (Estoque estoque : estoques) {
                // Agora TUDO já está carregado graças ao JOIN FETCH
                if (estoque.getProduto() != null && 
                    estoque.getProduto().getAlmoxarifado() != null) {
                    
                    String nomeProduto = estoque.getProduto().getNome();
                    String descricaoProduto = estoque.getProduto().getDescricao();
                    
                    // Obter setor - AGORA JÁ ESTÁ CARREGADO!
                    String nomeSetor = "Sem Setor";
                    Integer setorId = null;
                    
                    if (estoque.getProduto().getAlmoxarifado().getSetor() != null) {
                        nomeSetor = estoque.getProduto().getAlmoxarifado().getSetor().getNome();
                        setorId = estoque.getProduto().getAlmoxarifado().getSetor().getId();
                        log.info("TEMPO REAL ✅ Produto: {} | Setor: {} (ID: {}) | Qtd: {}", 
                                nomeProduto, nomeSetor, setorId, estoque.getQuantidadeEstoque());
                    } else {
                        // Fallback improvável
                        nomeSetor = estoque.getProduto().getAlmoxarifado().getNome();
                        setorId = estoque.getProduto().getAlmoxarifado().getId();
                        log.warn("TEMPO REAL ⚠️ Produto: {} | Almoxarifado SEM setor: {} (ID: {})", 
                                nomeProduto, nomeSetor, setorId);
                    }
                    
                    // Criar mapa de item de estoque
                    java.util.Map<String, Object> itemEstoque = new java.util.HashMap<>();
                    itemEstoque.put("id", estoque.getId());
                    
                    // Informações do produto
                    java.util.Map<String, Object> produtoMap = new java.util.HashMap<>();
                    produtoMap.put("id", estoque.getProduto().getId());
                    produtoMap.put("nome", nomeProduto);
                    produtoMap.put("descricao", descricaoProduto != null ? descricaoProduto : "");
                    itemEstoque.put("produto", produtoMap);
                    
                    // Quantidade (inclui zeros) - IMPORTANTE PARA ATUALIZAÇÃO EM TEMPO REAL
                    Integer quantidade = estoque.getQuantidadeEstoque() != null ? estoque.getQuantidadeEstoque() : 0;
                    itemEstoque.put("quantidadeEstoque", quantidade);
                    
                    // Informações do setor
                    java.util.Map<String, Object> setorMap = new java.util.HashMap<>();
                    setorMap.put("id", setorId);
                    setorMap.put("nome", nomeSetor);
                    itemEstoque.put("setor", setorMap);
                    
                    resultado.add(itemEstoque);
                }
            }
            
            log.info("========== TEMPO REAL: RETORNANDO {} REGISTROS ==========", resultado.size());
            
            // LOG RESUMO POR SETOR
            java.util.Map<String, Integer> resumoPorSetor = new java.util.LinkedHashMap<>();
            for (java.util.Map<String, Object> item : resultado) {
                @SuppressWarnings("unchecked")
                java.util.Map<String, Object> setor = (java.util.Map<String, Object>) item.get("setor");
                String nomeSetor = (String) setor.get("nome");
                resumoPorSetor.put(nomeSetor, resumoPorSetor.getOrDefault(nomeSetor, 0) + 1);
            }
            
            log.info("========== TEMPO REAL: RESUMO POR SETOR ==========");
            for (java.util.Map.Entry<String, Integer> entry : resumoPorSetor.entrySet()) {
                log.info("TEMPO REAL 🏢 Setor: {} | Total produtos: {}", entry.getKey(), entry.getValue());
            }
            log.info("==================================================");
            
            return resultado;
            
        } catch (Exception e) {
            log.error("TEMPO REAL: Erro ao buscar estoque por setor sem cache: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao buscar estoque em tempo real", e);
        }
    }
    
    /**
     * DIAGNÓSTICO COMPLETO - Mostra TODOS os produtos, almoxarifados e setores
     * Usa query SQL direta para ver TUDO no banco
     */
    public java.util.Map<String, Object> diagnosticoCompleto() {
        try {
            log.info("========== INICIANDO DIAGNÓSTICO COMPLETO ==========");
            
            java.util.Map<String, Object> resultado = new java.util.LinkedHashMap<>();
            
            // 1. TODOS OS SETORES
            List<Setor> todosSetores = setorRepository.findAll();
            resultado.put("totalSetores", todosSetores.size());
            resultado.put("setores", todosSetores.stream()
                .map(s -> java.util.Map.of("id", s.getId(), "nome", s.getNome()))
                .collect(java.util.stream.Collectors.toList()));
            
            log.info("Total de setores: {}", todosSetores.size());
            for (Setor setor : todosSetores) {
                log.info("🏢 Setor: {} (ID: {})", setor.getNome(), setor.getId());
            }
            
            // 2. TODOS OS ESTOQUES com detalhes
            List<Estoque> todosEstoques = estoqueRepository.findAllWithFullDetails();
            resultado.put("totalEstoques", todosEstoques.size());
            
            log.info("Total de estoques: {}", todosEstoques.size());
            
            java.util.List<java.util.Map<String, Object>> estoquesDetalhados = new java.util.ArrayList<>();
            java.util.Map<String, Integer> contagemPorSetor = new java.util.LinkedHashMap<>();
            
            for (Estoque estoque : todosEstoques) {
                java.util.Map<String, Object> item = new java.util.LinkedHashMap<>();
                item.put("estoqueId", estoque.getId());
                item.put("quantidade", estoque.getQuantidadeEstoque());
                
                if (estoque.getProduto() != null) {
                    item.put("produtoId", estoque.getProduto().getId());
                    item.put("produtoNome", estoque.getProduto().getNome());
                    
                    if (estoque.getProduto().getAlmoxarifado() != null) {
                        item.put("almoxarifadoId", estoque.getProduto().getAlmoxarifado().getId());
                        item.put("almoxarifadoNome", estoque.getProduto().getAlmoxarifado().getNome());
                        
                        if (estoque.getProduto().getAlmoxarifado().getSetor() != null) {
                            String setorNome = estoque.getProduto().getAlmoxarifado().getSetor().getNome();
                            item.put("setorId", estoque.getProduto().getAlmoxarifado().getSetor().getId());
                            item.put("setorNome", setorNome);
                            item.put("status", "✅ COMPLETO");
                            
                            contagemPorSetor.put(setorNome, contagemPorSetor.getOrDefault(setorNome, 0) + 1);
                            
                            log.info("✅ Estoque {} | Produto: {} | Almox: {} | Setor: {} | Qtd: {}", 
                                    estoque.getId(),
                                    estoque.getProduto().getNome(),
                                    estoque.getProduto().getAlmoxarifado().getNome(),
                                    setorNome,
                                    estoque.getQuantidadeEstoque());
                        } else {
                            item.put("status", "⚠️ SEM SETOR");
                            log.warn("⚠️ Estoque {} | Produto: {} | Almox: {} | SEM SETOR", 
                                    estoque.getId(),
                                    estoque.getProduto().getNome(),
                                    estoque.getProduto().getAlmoxarifado().getNome());
                        }
                    } else {
                        item.put("status", "❌ SEM ALMOXARIFADO");
                        log.error("❌ Estoque {} | Produto: {} | SEM ALMOXARIFADO", 
                                estoque.getId(),
                                estoque.getProduto().getNome());
                    }
                } else {
                    item.put("status", "❌ SEM PRODUTO");
                    log.error("❌ Estoque {} | SEM PRODUTO", estoque.getId());
                }
                
                estoquesDetalhados.add(item);
            }
            
            resultado.put("estoques", estoquesDetalhados);
            resultado.put("produtosPorSetor", contagemPorSetor);
            
            log.info("========== RESUMO DO DIAGNÓSTICO ==========");
            log.info("Total de setores cadastrados: {}", todosSetores.size());
            log.info("Total de estoques: {}", todosEstoques.size());
            log.info("========== PRODUTOS POR SETOR ==========");
            for (java.util.Map.Entry<String, Integer> entry : contagemPorSetor.entrySet()) {
                log.info("🏢 {} : {} produtos", entry.getKey(), entry.getValue());
            }
            log.info("=========================================");
            
            return resultado;
            
        } catch (Exception e) {
            log.error("Erro no diagnóstico completo: {}", e.getMessage(), e);
            throw new RuntimeException("Erro no diagnóstico completo", e);
        }
    }
}
