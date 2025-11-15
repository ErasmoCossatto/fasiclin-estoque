package com.br.fasipe.estoque.controller;

import com.br.fasipe.estoque.model.MovimentacaoAlmoxarifado;
import com.br.fasipe.estoque.service.MovimentacaoService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller REST para operações de movimentação de estoque entre almoxarifados.
 */
@RestController
@RequestMapping("/api/movimentacao")
public class MovimentacaoController {

    private final MovimentacaoService movimentacaoService;

    public MovimentacaoController(MovimentacaoService movimentacaoService) {
        this.movimentacaoService = movimentacaoService;
    }

    /**
     * Transfere estoque entre almoxarifados e lotes.
     */
    @PostMapping("/transferir")
    public ResponseEntity<MovimentacaoAlmoxarifado> transferir(@RequestBody TransferenciaRequest request) {
        MovimentacaoAlmoxarifado movimentacao = movimentacaoService.transferirEstoquePorLote(
                request.getIdProduto(),
                request.getIdAlmoxOrigem(),
                request.getIdAlmoxDestino(),
                request.getIdLoteOrigem(),
                request.getIdLoteDestino(),
                request.getQuantidade(),
                request.getResponsavel(),
                request.getObservacao()
        );
        
        return ResponseEntity.status(HttpStatus.CREATED).body(movimentacao);
    }

    /**
     * Registra entrada de estoque (sem origem).
     */
    @PostMapping("/entrada")
    public ResponseEntity<MovimentacaoAlmoxarifado> registrarEntrada(@RequestBody EntradaRequest request) {
        MovimentacaoAlmoxarifado movimentacao = movimentacaoService.registrarEntrada(
                request.getIdProduto(),
                request.getIdAlmoxDestino(),
                request.getIdLoteDestino(),
                request.getQuantidade(),
                request.getResponsavel(),
                request.getObservacao()
        );
        
        return ResponseEntity.status(HttpStatus.CREATED).body(movimentacao);
    }

    /**
     * Consulta histórico de movimentações.
     */
    @GetMapping("/historico")
    public ResponseEntity<List<MovimentacaoAlmoxarifado>> consultarHistorico(
            @RequestParam(required = false) Integer almoxarifadoId) {
        List<MovimentacaoAlmoxarifado> historico = movimentacaoService.consultarHistorico(almoxarifadoId);
        return ResponseEntity.ok(historico);
    }

    // DTOs

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransferenciaRequest {
        private Integer idProduto;
        private Integer idAlmoxOrigem;
        private Integer idAlmoxDestino;
        private Integer idLoteOrigem;
        private Integer idLoteDestino;
        private Integer quantidade;
        private String responsavel;
        private String observacao;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EntradaRequest {
        private Integer idProduto;
        private Integer idAlmoxDestino;
        private Integer idLoteDestino;
        private Integer quantidade;
        private String responsavel;
        private String observacao;
    }
}
