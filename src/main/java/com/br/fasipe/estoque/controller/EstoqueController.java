package com.br.fasipe.estoque.controller;

import com.br.fasipe.estoque.service.MovimentacaoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller REST para consultas de estoque e disponibilidade.
 */
@RestController
@RequestMapping("/api/estoque")
public class EstoqueController {

    private final MovimentacaoService movimentacaoService;

    public EstoqueController(MovimentacaoService movimentacaoService) {
        this.movimentacaoService = movimentacaoService;
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
