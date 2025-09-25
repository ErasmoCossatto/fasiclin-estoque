package com.br.fasipe.estoque.MovimentacaoEstoque.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.Setor;
import com.br.fasipe.estoque.MovimentacaoEstoque.services.SetorService;

import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Optional;

/**
 * Controller para gerenciamento de setores
 * Endpoints para controle de setores do sistema
 */
@Slf4j
@RestController
@RequestMapping("/api/setores")
@CrossOrigin(origins = "*")
public class SetorController {

    @Autowired
    private SetorService setorService;

    /**
     * Lista todos os setores
     * Endpoint principal para visualização de setores
     */
    @GetMapping
    public ResponseEntity<List<Setor>> listarSetores() {
        log.info("Listando todos os setores");
        try {
            List<Setor> setores = setorService.findAll();
            log.info("Encontrados {} setores", setores.size());
            return ResponseEntity.ok(setores);
        } catch (Exception e) {
            log.error("Erro ao listar setores: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(List.of());
        }
    }

    /**
     * Busca setor por ID
     * Endpoint para detalhamento de setor específico
     */
    @GetMapping("/{id}")
    public ResponseEntity<Setor> buscarSetorPorId(@PathVariable Integer id) {
        log.info("Buscando setor por ID: {}", id);
        try {
            Optional<Setor> setor = setorService.findById(id);
            return setor.map(ResponseEntity::ok)
                       .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Erro ao buscar setor ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Busca setor por nome
     * Endpoint para busca por nome
     */
    @GetMapping("/nome/{nome}")
    public ResponseEntity<Setor> buscarSetorPorNome(@PathVariable String nome) {
        log.info("Buscando setor por nome: {}", nome);
        try {
            Optional<Setor> setor = setorService.findByNome(nome);
            return setor.map(ResponseEntity::ok)
                       .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Erro ao buscar setor por nome {}: {}", nome, e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Cria um novo setor
     * Endpoint para cadastro de setores
     */
    @PostMapping
    public ResponseEntity<Setor> criarSetor(@RequestBody Setor setor) {
        log.info("Criando novo setor: {}", setor.getNome());
        try {
            Setor setorSalvo = setorService.save(setor);
            return ResponseEntity.status(201).body(setorSalvo);
        } catch (Exception e) {
            log.error("Erro ao criar setor: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Atualiza um setor existente
     * Endpoint para edição de informações do setor
     */
    @PutMapping("/{id}")
    public ResponseEntity<Setor> atualizarSetor(@PathVariable Integer id, @RequestBody Setor setor) {
        log.info("Atualizando setor ID: {}", id);
        try {
            setor.setId(id);
            Setor setorAtualizado = setorService.update(setor);
            return ResponseEntity.ok(setorAtualizado);
        } catch (Exception e) {
            log.error("Erro ao atualizar setor ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Remove um setor
     * Endpoint para exclusão de setores
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removerSetor(@PathVariable Integer id) {
        log.info("Removendo setor ID: {}", id);
        try {
            setorService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Erro ao remover setor ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Verifica se setor existe
     * Endpoint para validação de existência
     */
    @GetMapping("/{id}/existe")
    public ResponseEntity<Boolean> verificarExistencia(@PathVariable Integer id) {
        log.info("Verificando existência do setor ID: {}", id);
        try {
            boolean existe = setorService.existsById(id);
            return ResponseEntity.ok(existe);
        } catch (Exception e) {
            log.error("Erro ao verificar existência do setor ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).body(false);
        }
    }

    /**
     * Conta total de setores
     * Endpoint para estatísticas
     */
    @GetMapping("/total")
    public ResponseEntity<Long> contarSetores() {
        log.info("Contando total de setores");
        try {
            long total = setorService.count();
            return ResponseEntity.ok(total);
        } catch (Exception e) {
            log.error("Erro ao contar setores: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(0L);
        }
    }
}