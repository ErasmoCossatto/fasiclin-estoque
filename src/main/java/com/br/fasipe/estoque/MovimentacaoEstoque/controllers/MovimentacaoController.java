package com.br.fasipe.estoque.MovimentacaoEstoque.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.Movimentacao;
import com.br.fasipe.estoque.MovimentacaoEstoque.models.Movimentacao.TipoMovimentacao;
import com.br.fasipe.estoque.MovimentacaoEstoque.services.MovimentacaoService;

import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.util.List;

/**
 * Controller para gerenciamento de movimentações de estoque
 * Endpoints para controle de entrada e saída de produtos
 */
@Slf4j
@RestController
@RequestMapping("/api/movimentacoes")
@CrossOrigin(origins = "*")
public class MovimentacaoController {

    @Autowired
    private MovimentacaoService movimentacaoService;

    /**
     * Lista todas as movimentações
     * Endpoint principal para visualização do histórico de movimentações
     */
    @GetMapping
    public ResponseEntity<List<Movimentacao>> listarMovimentacoes() {
        log.info("Listando todas as movimentações");
        try {
            List<Movimentacao> movimentacoes = movimentacaoService.findAll();
            log.info("Encontradas {} movimentações", movimentacoes.size());

            return ResponseEntity.ok(movimentacoes);
        } catch (Exception e) {
            log.error("Erro ao listar movimentações: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(List.of()); // Retorna lista vazia em caso de erro
        }
    }

    /**
     * Busca movimentação por ID
     * Endpoint para detalhamento de movimentação específica
     */
    @GetMapping("/{id}")
    public ResponseEntity<Movimentacao> buscarMovimentacaoPorId(@PathVariable Integer id) {
        log.info("Buscando movimentação por ID: {}", id);
        Movimentacao movimentacao = movimentacaoService.findById(id);
        return ResponseEntity.ok(movimentacao);
    }

    /**
     * Registra uma nova movimentação
     * Endpoint para registrar entrada ou saída de produtos
     */
    @PostMapping
    public ResponseEntity<Movimentacao> registrarMovimentacao(@RequestBody Movimentacao movimentacao) {
        log.info("Registrando nova movimentação do tipo: {}", movimentacao.getTipoMovimentacao());
        log.info("Dados recebidos - Quantidade: {}, Data: {}", movimentacao.getQuantidade(), movimentacao.getDataMovimentacao());
        
        try {
            Movimentacao novaMovimentacao = movimentacaoService.insert(movimentacao);
            log.info("Movimentação criada com sucesso - ID: {}", novaMovimentacao.getId());
            return ResponseEntity.ok(novaMovimentacao);
        } catch (Exception e) {
            log.error("Erro ao criar movimentação: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Atualiza uma movimentação existente
     * Endpoint para correção de registros de movimentação
     */
    @PutMapping("/{id}")
    public ResponseEntity<Movimentacao> atualizarMovimentacao(
            @PathVariable Integer id,
            @RequestBody Movimentacao movimentacao) {
        log.info("Atualizando movimentação ID: {}", id);
        Movimentacao movimentacaoAtualizada = movimentacaoService.update(id, movimentacao);
        return ResponseEntity.ok(movimentacaoAtualizada);
    }

    /**
     * Remove uma movimentação
     * Endpoint para exclusão de registros de movimentação (usar com cautela)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removerMovimentacao(@PathVariable Integer id) {
        log.info("Removendo movimentação ID: {}", id);
        movimentacaoService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Busca movimentações por quantidade
     * Endpoint para filtrar movimentações por quantidade específica
     */
    @GetMapping("/quantidade/{quantidade}")
    public ResponseEntity<List<Movimentacao>> buscarPorQuantidade(@PathVariable Integer quantidade) {
        log.info("Buscando movimentações com quantidade: {}", quantidade);
        List<Movimentacao> movimentacoes = movimentacaoService.findByQuantidade(quantidade);
        return ResponseEntity.ok(movimentacoes);
    }

    /**
     * Busca movimentações por intervalo de quantidade
     * Endpoint para filtrar movimentações por faixa de quantidade
     */
    @GetMapping("/quantidade/entre")
    public ResponseEntity<List<Movimentacao>> buscarPorIntervaloQuantidade(
            @RequestParam Integer quantidadeMinima,
            @RequestParam Integer quantidadeMaxima) {
        log.info("Buscando movimentações com quantidade entre {} e {}", quantidadeMinima, quantidadeMaxima);
        List<Movimentacao> movimentacoes = movimentacaoService.findByQuantidadeBetween(quantidadeMinima, quantidadeMaxima);
        return ResponseEntity.ok(movimentacoes);
    }

    /**
     * Busca movimentações por data
     * Endpoint para filtrar movimentações por data específica
     */
    @GetMapping("/data/{data}")
    public ResponseEntity<List<Movimentacao>> buscarPorData(
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate data) {
        log.info("Buscando movimentações na data: {}", data);
        List<Movimentacao> movimentacoes = movimentacaoService.findByDataMovimentacao(data);
        return ResponseEntity.ok(movimentacoes);
    }

    /**
     * Busca movimentações por intervalo de data
     * Endpoint para filtrar movimentações por período
     */
    @GetMapping("/data/entre")
    public ResponseEntity<List<Movimentacao>> buscarPorIntervaloData(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate dataInicial,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate dataFinal) {
        log.info("Buscando movimentações entre {} e {}", dataInicial, dataFinal);
        List<Movimentacao> movimentacoes = movimentacaoService.findByDataMovimentacaoBetween(dataInicial, dataFinal);
        return ResponseEntity.ok(movimentacoes);
    }

    /**
     * Busca movimentações por tipo
     * Endpoint para filtrar movimentações por tipo (entrada/saída)
     */
    @GetMapping("/tipo/{tipo}")
    public ResponseEntity<List<Movimentacao>> buscarPorTipo(@PathVariable TipoMovimentacao tipo) {
        log.info("Buscando movimentações do tipo: {}", tipo);
        List<Movimentacao> movimentacoes = movimentacaoService.findByTipoMovimentacao(tipo);
        return ResponseEntity.ok(movimentacoes);
    }

    /**
     * Endpoint para criar dados de teste (temporário para desenvolvimento)
     */
    @PostMapping("/test-data")
    public ResponseEntity<String> criarDadosTeste() {
        log.info("Criando dados de teste");
        try {
            movimentacaoService.criarDadosTeste();
            return ResponseEntity.ok("Dados de teste criados com sucesso!");
        } catch (Exception e) {
            log.error("Erro ao criar dados de teste: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erro ao criar dados de teste: " + e.getMessage());
        }
    }
}
