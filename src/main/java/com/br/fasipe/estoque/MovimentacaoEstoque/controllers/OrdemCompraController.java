package com.br.fasipe.estoque.MovimentacaoEstoque.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.OrdemCompra;
import com.br.fasipe.estoque.MovimentacaoEstoque.models.OrdemCompra.StatusOrdem;
import com.br.fasipe.estoque.MovimentacaoEstoque.services.OrdemCompraService;

import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.util.Optional;

/**
 * Controller para gerenciamento de ordens de compra
 * Endpoints CORE do sistema de controle de estoque
 */
@Slf4j
@RestController
@RequestMapping("/api/ordens-compra")
@CrossOrigin(origins = "*")
public class OrdemCompraController {

    @Autowired
    private OrdemCompraService ordemCompraService;

    /**
     * Lista todas as ordens de compra com paginação
     * Endpoint principal para visualização de ordens
     */
    @GetMapping
    public ResponseEntity<Page<OrdemCompra>> listarOrdensCompra(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction) {
        
        log.info("Listando ordens de compra - Página: {}, Tamanho: {}, Ordenação: {}", page, size, sortBy);
        
        Page<OrdemCompra> ordens = ordemCompraService.findAllPaginated(page, size, sortBy, direction);
        
        return ResponseEntity.ok(ordens);
    }

    /**
     * Busca ordem de compra por ID
     * Endpoint para detalhamento de ordem específica
     */
    @GetMapping("/{id}")
    public ResponseEntity<OrdemCompra> buscarOrdemCompraPorId(@PathVariable Integer id) {
        log.info("Buscando ordem de compra por ID: {}", id);
        
        Optional<OrdemCompra> ordem = ordemCompraService.findById(id);
        
        return ordem.map(ResponseEntity::ok)
                   .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Lista ordens de compra por status
     * Endpoint CRÍTICO para acompanhamento de workflow
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<Page<OrdemCompra>> listarOrdensPorStatus(
            @PathVariable StatusOrdem status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("Listando ordens de compra com status: {} - Página: {}", status, page);
        
        Page<OrdemCompra> ordens = ordemCompraService.findByStatus(status, page, size);
        
        return ResponseEntity.ok(ordens);
    }

    /**
     * Lista ordens de compra pendentes
     * Endpoint CRÍTICO para acompanhamento de ordens em andamento
     */
    @GetMapping("/pendentes")
    public ResponseEntity<Page<OrdemCompra>> listarOrdensPendentes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("Listando ordens de compra pendentes - Página: {}", page);
        
        Page<OrdemCompra> ordens = ordemCompraService.findOrdensPendentes(page, size);
        
        return ResponseEntity.ok(ordens);
    }

    /**
     * Lista ordens de compra por período
     * Endpoint para relatórios e análise temporal
     */
    @GetMapping("/periodo")
    public ResponseEntity<Page<OrdemCompra>> listarOrdensPorPeriodo(
            @RequestParam LocalDate dataInicio,
            @RequestParam LocalDate dataFim,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("Listando ordens de compra no período: {} a {} - Página: {}", dataInicio, dataFim, page);
        
        Page<OrdemCompra> ordens = ordemCompraService.findOrdensPorPeriodo(dataInicio, dataFim, page, size);
        
        return ResponseEntity.ok(ordens);
    }

    /**
     * Lista ordens de compra por data de previsão
     * Endpoint para planejamento de entregas
     */
    @GetMapping("/previsao/{dataPrevisao}")
    public ResponseEntity<Page<OrdemCompra>> listarOrdensPorDataPrevisao(
            @PathVariable LocalDate dataPrevisao,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("Listando ordens de compra com previsão: {} - Página: {}", dataPrevisao, page);
        
        Page<OrdemCompra> ordens = ordemCompraService.findByDataPrevisao(dataPrevisao, page, size);
        
        return ResponseEntity.ok(ordens);
    }

    /**
     * Lista ordens de compra por data da ordem
     * Endpoint para análise por data de criação
     */
    @GetMapping("/data-ordem/{dataOrdem}")
    public ResponseEntity<Page<OrdemCompra>> listarOrdensPorDataOrdem(
            @PathVariable LocalDate dataOrdem,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("Listando ordens de compra da data: {} - Página: {}", dataOrdem, page);
        
        Page<OrdemCompra> ordens = ordemCompraService.findByDataOrdem(dataOrdem, page, size);
        
        return ResponseEntity.ok(ordens);
    }

    /**
     * Lista ordens de compra por data de entrega
     * Endpoint para controle de entregas
     */
    @GetMapping("/entrega/{dataEntrega}")
    public ResponseEntity<Page<OrdemCompra>> listarOrdensPorDataEntrega(
            @PathVariable LocalDate dataEntrega,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("Listando ordens de compra com entrega: {} - Página: {}", dataEntrega, page);
        
        Page<OrdemCompra> ordens = ordemCompraService.findByDataEntrega(dataEntrega, page, size);
        
        return ResponseEntity.ok(ordens);
    }

    /**
     * Cria uma nova ordem de compra
     * Endpoint CRÍTICO para criação de ordens
     */
    @PostMapping
    public ResponseEntity<OrdemCompra> criarOrdemCompra(@RequestBody OrdemCompra ordemCompra) {
        log.info("Criando nova ordem de compra ID: {}", ordemCompra.getId());
        
        OrdemCompra ordemSalva = ordemCompraService.save(ordemCompra);
        
        return ResponseEntity.ok(ordemSalva);
    }

    /**
     * Atualiza uma ordem de compra existente
     * Endpoint para edição de informações da ordem
     */
    @PutMapping("/{id}")
    public ResponseEntity<OrdemCompra> atualizarOrdemCompra(@PathVariable Integer id, @RequestBody OrdemCompra ordemCompra) {
        log.info("Atualizando ordem de compra ID: {}", id);
        
        ordemCompra.setId(id);
        OrdemCompra ordemAtualizada = ordemCompraService.update(ordemCompra);
        
        return ResponseEntity.ok(ordemAtualizada);
    }

    /**
     * Atualiza o status de uma ordem de compra
     * Endpoint CRÍTICO para workflow de aprovação
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<OrdemCompra> atualizarStatus(
            @PathVariable Integer id,
            @RequestParam StatusOrdem novoStatus) {
        
        log.info("Atualizando status da ordem de compra ID: {} para {}", id, novoStatus);
        
        OrdemCompra ordemAtualizada = ordemCompraService.updateStatus(id, novoStatus);
        
        if (ordemAtualizada != null) {
            return ResponseEntity.ok(ordemAtualizada);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Remove uma ordem de compra
     * Endpoint para cancelamento de ordens (usar com cuidado)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removerOrdemCompra(@PathVariable Integer id) {
        log.info("Removendo ordem de compra ID: {}", id);
        
        ordemCompraService.deleteById(id);
        
        return ResponseEntity.noContent().build();
    }

    /**
     * Verifica se ordem de compra existe
     * Endpoint para validação de existência
     */
    @GetMapping("/{id}/existe")
    public ResponseEntity<Boolean> verificarExistencia(@PathVariable Integer id) {
        log.info("Verificando existência da ordem de compra ID: {}", id);
        
        boolean existe = ordemCompraService.existsById(id);
        
        return ResponseEntity.ok(existe);
    }

    /**
     * Conta total de ordens de compra
     * Endpoint para estatísticas
     */
    @GetMapping("/total")
    public ResponseEntity<Long> contarOrdensCompra() {
        log.info("Contando total de ordens de compra");
        
        long total = ordemCompraService.count();
        
        return ResponseEntity.ok(total);
    }

    /**
     * Conta ordens de compra por status
     * Endpoint para estatísticas de workflow
     */
    @GetMapping("/total-status/{status}")
    public ResponseEntity<Long> contarOrdensPorStatus(@PathVariable StatusOrdem status) {
        log.info("Contando ordens de compra com status: {}", status);
        
        long total = ordemCompraService.countByStatus(status);
        
        return ResponseEntity.ok(total);
    }
}
