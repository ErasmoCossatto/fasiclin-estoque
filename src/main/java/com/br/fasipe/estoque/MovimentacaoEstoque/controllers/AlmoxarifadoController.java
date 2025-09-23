package com.br.fasipe.estoque.MovimentacaoEstoque.controllers;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.Almoxarifado;
import com.br.fasipe.estoque.MovimentacaoEstoque.services.AlmoxarifadoService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Controller para gerenciar as requisições HTTP relacionadas a Almoxarifados.
 */
@Slf4j
@RestController
@RequestMapping("/api/almoxarifados")
@CrossOrigin(origins = "http://localhost:8080", allowCredentials = "true")
public class AlmoxarifadoController {

    @Autowired
    private AlmoxarifadoService almoxarifadoService;

    /**
     * Lista todos os almoxarifados
     */
    @GetMapping
    public ResponseEntity<Page<Almoxarifado>> listarTodos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Listando almoxarifados - Página: {}, Tamanho: {}", page, size);
        Page<Almoxarifado> almoxarifados = almoxarifadoService.findAllPaginated(page, size);
        return ResponseEntity.ok(almoxarifados);
    }

    /**
     * Busca um almoxarifado por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Almoxarifado> buscarPorId(@PathVariable Integer id) {
        log.info("Buscando almoxarifado com ID: {}", id);
        return almoxarifadoService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Cadastra um novo almoxarifado
     */
    @PostMapping
    public ResponseEntity<Almoxarifado> criar(@Valid @RequestBody Almoxarifado almoxarifado) {
        log.info("Criando novo almoxarifado: {}", almoxarifado.getNome());
        Almoxarifado novoAlmoxarifado = almoxarifadoService.save(almoxarifado);
        return ResponseEntity.status(HttpStatus.CREATED).body(novoAlmoxarifado);
    }

    /**
     * Atualiza um almoxarifado existente
     */
    @PutMapping("/{id}")
    public ResponseEntity<Almoxarifado> atualizar(
            @PathVariable Integer id,
            @Valid @RequestBody Almoxarifado almoxarifado) {
        log.info("Atualizando almoxarifado ID: {}", id);
        
        if (!almoxarifadoService.findById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }

        almoxarifado.setId(id);
        Almoxarifado atualizado = almoxarifadoService.save(almoxarifado);
        return ResponseEntity.ok(atualizado);
    }

    /**
     * Remove um almoxarifado
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(@PathVariable Integer id) {
        log.info("Removendo almoxarifado ID: {}", id);
        
        if (!almoxarifadoService.findById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }

        almoxarifadoService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

