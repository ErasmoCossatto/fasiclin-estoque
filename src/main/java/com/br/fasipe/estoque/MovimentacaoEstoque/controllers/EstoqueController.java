package com.br.fasipe.estoque.MovimentacaoEstoque.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.Estoque;
import com.br.fasipe.estoque.MovimentacaoEstoque.services.EstoqueService;

import lombok.extern.slf4j.Slf4j;

import java.util.Optional;

/**
 * Controller para gerenciamento de estoque
 * Endpoints CRÍTICOS para controle de quantidade de produtos
 */
@Slf4j
@RestController
@RequestMapping("/api/estoque")
@CrossOrigin(origins = "*")
public class EstoqueController {

    @Autowired
    private EstoqueService estoqueService;

    /**
     * Lista todos os estoques com paginação
     * Endpoint principal para visualização do estoque atual
     */
    @GetMapping
    public ResponseEntity<Page<Estoque>> listarEstoques(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") Sort.Direction direction) {
        
        log.info("Listando estoques - Página: {}, Tamanho: {}, Ordenação: {}", page, size, sortBy);
        
        Page<Estoque> estoques = estoqueService.findAllPaginated(page, size, sortBy, direction);
        
        return ResponseEntity.ok(estoques);
    }

    /**
     * Busca estoque por ID
     * Endpoint para detalhamento de estoque específico
     */
    @GetMapping("/{id}")
    public ResponseEntity<Estoque> buscarEstoquePorId(@PathVariable Integer id) {
        log.info("Buscando estoque por ID: {}", id);
        
        Optional<Estoque> estoque = estoqueService.findById(id);
        
        return estoque.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Lista estoques por produto
     * Endpoint CRÍTICO para verificar quantidade de um produto específico
     */
    @GetMapping("/produto/{idProduto}")
    public ResponseEntity<Page<Estoque>> listarEstoquesPorProduto(
            @PathVariable Integer idProduto,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("Listando estoques do produto {} - Página: {}", idProduto, page);
        
        Page<Estoque> estoques = estoqueService.findByProduto(idProduto, page, size);
        
        return ResponseEntity.ok(estoques);
    }

    /**
     * Lista estoques por almoxarifado
     * Endpoint para controle por localização física
     */
    @GetMapping("/almoxarifado/{idAlmoxarifado}")
    public ResponseEntity<Page<Estoque>> listarEstoquesPorAlmoxarifado(
            @PathVariable Integer idAlmoxarifado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("Listando estoques do almoxarifado {} - Página: {}", idAlmoxarifado, page);
        
        Page<Estoque> estoques = estoqueService.findByAlmoxarifado(idAlmoxarifado, page, size);
        
        return ResponseEntity.ok(estoques);
    }

    /**
     * Lista estoques com quantidade baixa
     * Endpoint CRÍTICO para alertas de reposição
     */
    @GetMapping("/quantidade-baixa")
    public ResponseEntity<Page<Estoque>> listarEstoquesComQuantidadeBaixa(
            @RequestParam(defaultValue = "10") Integer quantidadeMinima,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("Listando estoques com quantidade baixa (menor que {}) - Página: {}", quantidadeMinima, page);
        
        Page<Estoque> estoques = estoqueService.findEstoquesComQuantidadeBaixa(quantidadeMinima, page, size);
        
        return ResponseEntity.ok(estoques);
    }

    /**
     * Lista estoques por lote
     * Endpoint para controle de lotes específicos
     */
    @GetMapping("/lote/{idLote}")
    public ResponseEntity<Page<Estoque>> listarEstoquesPorLote(
            @PathVariable Integer idLote,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("Listando estoques do lote {} - Página: {}", idLote, page);
        
        Page<Estoque> estoques = estoqueService.findByLote(idLote, page, size);
        
        return ResponseEntity.ok(estoques);
    }

    /**
     * Cria um novo registro de estoque
     * Endpoint para entrada de produtos no estoque
     */
    @PostMapping
    public ResponseEntity<Estoque> criarEstoque(@RequestBody Estoque estoque) {
        log.info("Criando novo estoque para produto ID: {}", estoque.getProduto() != null ? estoque.getProduto().getId() : "null");
        
        try {
            Estoque estoqueSalvo = estoqueService.save(estoque);
            return ResponseEntity.status(201).body(estoqueSalvo);
        } catch (Exception e) {
            log.error("Erro ao criar estoque: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Atualiza um estoque existente
     * Endpoint para edição de informações do estoque
     */
    @PutMapping("/{id}")
    public ResponseEntity<Estoque> atualizarEstoque(@PathVariable Integer id, @RequestBody Estoque estoque) {
        log.info("Atualizando estoque ID: {}", id);
        
        estoque.setId(id);
        Estoque estoqueAtualizado = estoqueService.update(estoque);
        
        return ResponseEntity.ok(estoqueAtualizado);
    }

    /**
     * Atualiza a quantidade de um estoque
     * Endpoint CRÍTICO para movimentação de estoque (entrada/saída)
     */
    @PutMapping("/{id}/quantidade")
    public ResponseEntity<Estoque> atualizarQuantidade(
            @PathVariable Integer id,
            @RequestParam Integer novaQuantidade) {
        
        log.info("Atualizando quantidade do estoque ID: {} para {}", id, novaQuantidade);
        
        Estoque estoqueAtualizado = estoqueService.updateQuantidade(id, novaQuantidade);
        
        if (estoqueAtualizado != null) {
            return ResponseEntity.ok(estoqueAtualizado);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Remove um estoque
     * Endpoint para exclusão de registros de estoque (usar com cuidado)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removerEstoque(@PathVariable Integer id) {
        log.info("Removendo estoque ID: {}", id);
        
        estoqueService.deleteById(id);
        
        return ResponseEntity.noContent().build();
    }

    /**
     * Verifica se estoque existe
     * Endpoint para validação de existência
     */
    @GetMapping("/{id}/existe")
    public ResponseEntity<Boolean> verificarExistencia(@PathVariable Integer id) {
        log.info("Verificando existência do estoque ID: {}", id);
        
        boolean existe = estoqueService.existsById(id);
        
        return ResponseEntity.ok(existe);
    }

    /**
     * Conta total de registros de estoque
     * Endpoint para estatísticas
     */
    @GetMapping("/total")
    public ResponseEntity<Long> contarEstoques() {
        log.info("Contando total de registros de estoque");
        
        long total = estoqueService.count();
        
        return ResponseEntity.ok(total);
    }

    /**
     * Conta estoques com quantidade baixa
     * Endpoint para alertas e estatísticas
     */
    @GetMapping("/total-quantidade-baixa")
    public ResponseEntity<Long> contarEstoquesComQuantidadeBaixa(
            @RequestParam(defaultValue = "10") Integer quantidadeMinima) {
        
        log.info("Contando estoques com quantidade baixa (menor que {})", quantidadeMinima);
        
        long total = estoqueService.countComQuantidadeBaixa(quantidadeMinima);
        
        return ResponseEntity.ok(total);
    }
}
