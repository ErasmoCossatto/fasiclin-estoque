package com.br.fasipe.estoque.MovimentacaoEstoque.controllers;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.Almoxarifado;
import com.br.fasipe.estoque.MovimentacaoEstoque.services.AlmoxarifadoService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
/**
 * Controller para gerenciar as requisições HTTP relacionadas a Almoxarifados.
 */
@Slf4j
@RestController
@RequestMapping("/api/almoxarifados")
@CrossOrigin(origins = "*")
public class AlmoxarifadoController {

    @Autowired
    private AlmoxarifadoService almoxarifadoService;

    /**
     * Lista todos os almoxarifados
     */
    @GetMapping
    public ResponseEntity<Page<Almoxarifado>> listarTodos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction) {
        log.info("Listando almoxarifados - Página: {}, Tamanho: {}, Ordenação: {}", page, size, sortBy);
        
        try {
            Sort.Direction sortDirection = Sort.Direction.fromString(direction);
            Page<Almoxarifado> almoxarifados = almoxarifadoService.findAllPaginated(page, size, sortBy, sortDirection);
            return ResponseEntity.ok(almoxarifados);
        } catch (Exception e) {
            log.error("Erro ao listar almoxarifados: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Busca um almoxarifado por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Almoxarifado> buscarPorId(@PathVariable Integer id) {
        log.info("Buscando almoxarifado com ID: {}", id);
        
        try {
            return almoxarifadoService.findById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Erro ao buscar almoxarifado ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Cadastra um novo almoxarifado
     */
    @PostMapping
    public ResponseEntity<Almoxarifado> criar(@Valid @RequestBody Almoxarifado almoxarifado) {
        log.info("Criando novo almoxarifado: {}", almoxarifado.getNome());
        
        try {
            Almoxarifado novoAlmoxarifado = almoxarifadoService.save(almoxarifado);
            return ResponseEntity.status(HttpStatus.CREATED).body(novoAlmoxarifado);
        } catch (Exception e) {
            log.error("Erro ao criar almoxarifado: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Atualiza um almoxarifado existente
     */
    @PutMapping("/{id}")
    public ResponseEntity<Almoxarifado> atualizar(
            @PathVariable Integer id,
            @Valid @RequestBody Almoxarifado almoxarifado) {
        log.info("Atualizando almoxarifado ID: {}", id);
        
        try {
            if (!almoxarifadoService.existsById(id)) {
                return ResponseEntity.notFound().build();
            }

            almoxarifado.setId(id);
            Almoxarifado atualizado = almoxarifadoService.update(almoxarifado);
            return ResponseEntity.ok(atualizado);
        } catch (Exception e) {
            log.error("Erro ao atualizar almoxarifado ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Remove um almoxarifado
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(@PathVariable Integer id) {
        log.info("Removendo almoxarifado ID: {}", id);
        
        try {
            if (!almoxarifadoService.existsById(id)) {
                return ResponseEntity.notFound().build();
            }

            almoxarifadoService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Erro ao remover almoxarifado ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

