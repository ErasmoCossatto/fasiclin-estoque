package com.br.fasipe.estoque.controller;

import com.br.fasipe.estoque.model.Lote;
import com.br.fasipe.estoque.repository.LoteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Controller REST para operações de lote.
 */
@RestController
@RequestMapping("/api/lote")
public class LoteController {

    private final LoteRepository loteRepository;

    public LoteController(LoteRepository loteRepository) {
        this.loteRepository = loteRepository;
    }

    @GetMapping
    public ResponseEntity<List<Lote>> listarTodos() {
        return ResponseEntity.ok(loteRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Lote> buscarPorId(@PathVariable Integer id) {
        Optional<Lote> lote = loteRepository.findById(id);
        return lote.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/vencidos")
    public ResponseEntity<List<Lote>> listarVencidos() {
        List<Lote> vencidos = loteRepository.findByDataValidadeBefore(LocalDate.now());
        return ResponseEntity.ok(vencidos);
    }

    @GetMapping("/proximo-vencimento")
    public ResponseEntity<List<Lote>> listarProximoVencimento() {
        LocalDate hoje = LocalDate.now();
        LocalDate daquiA30Dias = hoje.plusDays(30);
        List<Lote> proximoVencimento = loteRepository.findByDataValidadeBetween(hoje, daquiA30Dias);
        return ResponseEntity.ok(proximoVencimento);
    }

    @PostMapping
    public ResponseEntity<Lote> criar(@RequestBody Lote lote) {
        Lote salvo = loteRepository.save(lote);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Lote> atualizar(@PathVariable Integer id, @RequestBody Lote lote) {
        if (!loteRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        lote.setId(id);
        Lote atualizado = loteRepository.save(lote);
        return ResponseEntity.ok(atualizado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Integer id) {
        if (!loteRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        loteRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
