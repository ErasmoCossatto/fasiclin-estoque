package com.br.fasipe.estoque.controller;

import com.br.fasipe.estoque.model.Almoxarifado;
import com.br.fasipe.estoque.model.ItensAlmoxarifados;
import com.br.fasipe.estoque.model.Lote;
import com.br.fasipe.estoque.repository.AlmoxarifadoRepository;
import com.br.fasipe.estoque.repository.ItensAlmoxarifadosRepository;
import com.br.fasipe.estoque.repository.LoteRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller TEMPORÁRIO para popular ITENS_ALMOXARIFADOS
 * APAGAR após usar!
 */
@Slf4j
@RestController
@RequestMapping("/api/popular")
public class PopularEstoqueController {

    private final LoteRepository loteRepository;
    private final ItensAlmoxarifadosRepository itensRepository;
    private final AlmoxarifadoRepository almoxarifadoRepository;

    public PopularEstoqueController(
            LoteRepository loteRepository,
            ItensAlmoxarifadosRepository itensRepository,
            AlmoxarifadoRepository almoxarifadoRepository) {
        this.loteRepository = loteRepository;
        this.itensRepository = itensRepository;
        this.almoxarifadoRepository = almoxarifadoRepository;
    }

    @PostMapping("/itens-almoxarifados")
    public ResponseEntity<String> popularItensAlmoxarifados() {
        try {
            log.info("Iniciando população de ITENS_ALMOXARIFADOS...");

            // Buscar almoxarifado TESTE (ID 1)
            Almoxarifado teste = almoxarifadoRepository.findById(1)
                    .orElseThrow(() -> new RuntimeException("Almoxarifado TESTE não encontrado"));

            // Buscar todos os lotes
            List<Lote> lotes = loteRepository.findAll();
            log.info("Encontrados {} lotes no banco", lotes.size());

            int inseridos = 0;
            int erros = 0;

            for (Lote lote : lotes) {
                try {
                    // Verificar se lote tem produto e quantidade
                    if (lote.getItem() == null) {
                        log.warn("Lote {} sem produto - pulando", lote.getId());
                        continue;
                    }

                    if (lote.getQuantidade() == null || lote.getQuantidade() <= 0) {
                        log.warn("Lote {} sem quantidade - pulando", lote.getId());
                        continue;
                    }

                    // Verificar se já existe
                    boolean jaExiste = !itensRepository
                            .findByAlmoxarifadoIdAndItemIdAndLoteId(
                                    teste.getId(),
                                    lote.getItem().getId(),
                                    lote.getId())
                            .isEmpty();

                    if (jaExiste) {
                        log.info("Item já existe para Lote {} - pulando", lote.getId());
                        continue;
                    }

                    // Criar item
                    ItensAlmoxarifados item = new ItensAlmoxarifados();
                    item.setAlmoxarifado(teste);
                    item.setItem(lote.getItem());
                    item.setLote(lote);
                    item.setQuantidade(lote.getQuantidade());
                    item.setEstoqueMinimo(10);
                    item.setEstoqueMaximo(100);
                    item.setAtivo(true);

                    itensRepository.save(item);
                    inseridos++;
                    log.info("Lote {} inserido com sucesso", lote.getId());

                } catch (Exception e) {
                    erros++;
                    log.error("Erro ao inserir Lote {}: {}", lote.getId(), e.getMessage());
                }
            }

            String mensagem = String.format("População concluída! Inseridos: %d | Erros: %d", inseridos, erros);
            log.info(mensagem);

            return ResponseEntity.ok(mensagem);

        } catch (Exception e) {
            log.error("Erro ao popular ITENS_ALMOXARIFADOS", e);
            return ResponseEntity.status(500).body("Erro: " + e.getMessage());
        }
    }
}
