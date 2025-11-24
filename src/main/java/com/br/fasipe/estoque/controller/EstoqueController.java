package com.br.fasipe.estoque.controller;

import com.br.fasipe.estoque.model.ItensAlmoxarifados;
import com.br.fasipe.estoque.repository.ItensAlmoxarifadosRepository;
import com.br.fasipe.estoque.service.MovimentacaoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller REST para consultas de estoque e disponibilidade.
 */
@RestController
@RequestMapping("/api/estoque")
public class EstoqueController {

    private final MovimentacaoService movimentacaoService;
    private final ItensAlmoxarifadosRepository itensAlmoxarifadosRepository;

    public EstoqueController(MovimentacaoService movimentacaoService,
                           ItensAlmoxarifadosRepository itensAlmoxarifadosRepository) {
        this.movimentacaoService = movimentacaoService;
        this.itensAlmoxarifadosRepository = itensAlmoxarifadosRepository;
    }

    /**
     * Lista todo o estoque.
     */
    @GetMapping
    public ResponseEntity<List<ItensAlmoxarifados>> listarTodoEstoque() {
        List<ItensAlmoxarifados> estoque = itensAlmoxarifadosRepository.findAll();
        return ResponseEntity.ok(estoque);
    }

    /**
     * Lista estoque por almoxarifado.
     */
    @GetMapping("/almoxarifado/{almoxarifadoId}")
    public ResponseEntity<List<ItensAlmoxarifados>> listarPorAlmoxarifado(@PathVariable Integer almoxarifadoId) {
        List<ItensAlmoxarifados> estoque = itensAlmoxarifadosRepository.findByAlmoxarifadoId(almoxarifadoId);
        return ResponseEntity.ok(estoque);
    }

    /**
     * Verifica se há estoque disponível para uma movimentação.
     * 
     * @param almoxarifadoId ID do almoxarifado de origem
     * @param produtoId ID do produto
     * @param loteId ID do lote
     * @param quantidade Quantidade desejada
     * @return JSON com disponibilidade e quantidade disponível
     */
    @GetMapping("/verificar-disponibilidade")
    public ResponseEntity<Map<String, Object>> verificarDisponibilidade(
            @RequestParam Integer almoxarifadoId,
            @RequestParam Integer produtoId,
            @RequestParam Integer loteId,
            @RequestParam Integer quantidade) {
        
        boolean disponivel = movimentacaoService.verificarDisponibilidade(
                almoxarifadoId, produtoId, loteId, quantidade);
        
        Integer quantidadeDisponivel = movimentacaoService.consultarQuantidadeDisponivel(
                almoxarifadoId, produtoId, loteId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("disponivel", disponivel);
        response.put("quantidadeDisponivel", quantidadeDisponivel);
        response.put("quantidadeSolicitada", quantidade);
        
        if (!disponivel && quantidadeDisponivel > 0) {
            response.put("mensagem", String.format(
                    "Estoque insuficiente. Disponível: %d, Solicitado: %d",
                    quantidadeDisponivel, quantidade));
        } else if (quantidadeDisponivel == 0) {
            response.put("mensagem", "Produto não encontrado no estoque deste almoxarifado e lote.");
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * Consulta a quantidade disponível de um produto em almoxarifado/lote específico.
     */
    @GetMapping("/quantidade-disponivel")
    public ResponseEntity<Map<String, Object>> consultarQuantidade(
            @RequestParam Integer almoxarifadoId,
            @RequestParam Integer produtoId,
            @RequestParam Integer loteId) {
        
        Integer quantidade = movimentacaoService.consultarQuantidadeDisponivel(
                almoxarifadoId, produtoId, loteId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("almoxarifadoId", almoxarifadoId);
        response.put("produtoId", produtoId);
        response.put("loteId", loteId);
        response.put("quantidadeDisponivel", quantidade);
        
        return ResponseEntity.ok(response);
    }
}
