package com.br.fasipe.estoque.controller;

import com.br.fasipe.estoque.dto.AlmoxarifadoDTO;
import com.br.fasipe.estoque.model.Almoxarifado;
import com.br.fasipe.estoque.model.ItensAlmoxarifados;
import com.br.fasipe.estoque.repository.AlmoxarifadoRepository;
import com.br.fasipe.estoque.service.MovimentacaoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Controller REST para operações de almoxarifado.
 */
@RestController
@RequestMapping("/api/almoxarifado")
public class AlmoxarifadoController {

    private final AlmoxarifadoRepository almoxarifadoRepository;
    private final MovimentacaoService movimentacaoService;

    public AlmoxarifadoController(
            AlmoxarifadoRepository almoxarifadoRepository,
            MovimentacaoService movimentacaoService) {
        this.almoxarifadoRepository = almoxarifadoRepository;
        this.movimentacaoService = movimentacaoService;
    }

    @GetMapping
    public ResponseEntity<List<AlmoxarifadoDTO>> listarTodos() {
        List<AlmoxarifadoDTO> dtos = almoxarifadoRepository.findAll()
                .stream()
                .map(AlmoxarifadoDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlmoxarifadoDTO> buscarPorId(@PathVariable Integer id) {
        Optional<Almoxarifado> almoxarifado = almoxarifadoRepository.findById(id);
        return almoxarifado
                .map(AlmoxarifadoDTO::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/ativos")
    public ResponseEntity<List<AlmoxarifadoDTO>> listarAtivos() {
        List<AlmoxarifadoDTO> dtos = almoxarifadoRepository.findByAtivoTrue()
                .stream()
                .map(AlmoxarifadoDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}/saldo")
    public ResponseEntity<List<ItensAlmoxarifados>> consultarSaldo(@PathVariable Integer id) {
        List<ItensAlmoxarifados> saldo = movimentacaoService.consultarSaldo(id, null);
        return ResponseEntity.ok(saldo);
    }

    @PostMapping
    public ResponseEntity<Almoxarifado> criar(@RequestBody Almoxarifado almoxarifado) {
        Almoxarifado salvo = almoxarifadoRepository.save(almoxarifado);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Almoxarifado> atualizar(@PathVariable Integer id, @RequestBody Almoxarifado almoxarifado) {
        if (!almoxarifadoRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        almoxarifado.setId(id);
        Almoxarifado atualizado = almoxarifadoRepository.save(almoxarifado);
        return ResponseEntity.ok(atualizado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Integer id) {
        if (!almoxarifadoRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        almoxarifadoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
