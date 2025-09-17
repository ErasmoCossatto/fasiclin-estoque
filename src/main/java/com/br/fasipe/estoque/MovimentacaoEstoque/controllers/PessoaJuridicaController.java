package com.br.fasipe.estoque.MovimentacaoEstoque.controllers;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.PessoaJuridica;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.PessoaJuridicaRepository;

import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Optional;

/**
 * Controller para gerenciamento de pessoas jurídicas
 * Endpoints para controle de entidades jurídicas
 */
@Slf4j
@RestController
@RequestMapping("/api/pessoas-juridicas")
@CrossOrigin(origins = "*")
public class PessoaJuridicaController {

    @Autowired
    private PessoaJuridicaRepository pessoaJuridicaRepository;

    /**
     * Lista todas as pessoas jurídicas com paginação
     * Endpoint principal para visualização de pessoas jurídicas
     */
    @GetMapping
    public ResponseEntity<List<PessoaJuridica>> listarPessoasJuridicas() {
        log.info("Listando todas as pessoas jurídicas");
        List<PessoaJuridica> pessoasJuridicas = pessoaJuridicaRepository.findAll();
        return ResponseEntity.ok(pessoasJuridicas);
    }

    /**
     * Busca pessoa jurídica por ID
     * Endpoint para detalhamento de pessoa jurídica específica
     */
    @GetMapping("/{id}")
    public ResponseEntity<PessoaJuridica> buscarPessoaJuridicaPorId(@PathVariable Integer id) {
        log.info("Buscando pessoa jurídica por ID: {}", id);
        
        Optional<PessoaJuridica> pessoaJuridica = pessoaJuridicaRepository.findById(id);
        
        return pessoaJuridica.map(ResponseEntity::ok)
                          .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Busca pessoa jurídica por CNPJ
     * Endpoint para busca por documento
     */
    @GetMapping("/cnpj/{cnpj}")
    public ResponseEntity<PessoaJuridica> buscarPorCnpj(@PathVariable String cnpj) {
        log.info("Buscando pessoa jurídica por CNPJ: {}", cnpj);
        
        Optional<PessoaJuridica> pessoaJuridica = pessoaJuridicaRepository.findByCnpj(cnpj);
        
        return pessoaJuridica.map(ResponseEntity::ok)
                          .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Cria uma nova pessoa jurídica
     * Endpoint para cadastro de pessoas jurídicas
     */
    @PostMapping
    public ResponseEntity<PessoaJuridica> criarPessoaJuridica(@RequestBody PessoaJuridica pessoaJuridica) {
        log.info("Criando nova pessoa jurídica: {}", pessoaJuridica.getRazaoSocial());
        
        PessoaJuridica pessoaJuridicaSalva = pessoaJuridicaRepository.save(pessoaJuridica);
        
        return ResponseEntity.ok(pessoaJuridicaSalva);
    }

    /**
     * Atualiza uma pessoa jurídica existente
     * Endpoint para edição de informações da pessoa jurídica
     */
    @PutMapping("/{id}")
    public ResponseEntity<PessoaJuridica> atualizarPessoaJuridica(@PathVariable Integer id, @RequestBody PessoaJuridica pessoaJuridica) {
        log.info("Atualizando pessoa jurídica ID: {}", id);
        
        if (!pessoaJuridicaRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        pessoaJuridica.setId(id);
        PessoaJuridica pessoaJuridicaAtualizada = pessoaJuridicaRepository.save(pessoaJuridica);
        
        return ResponseEntity.ok(pessoaJuridicaAtualizada);
    }

    /**
     * Remove uma pessoa jurídica
     * Endpoint para exclusão de pessoas jurídicas (usar com cuidado)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removerPessoaJuridica(@PathVariable Integer id) {
        log.info("Removendo pessoa jurídica ID: {}", id);
        
        if (!pessoaJuridicaRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        pessoaJuridicaRepository.deleteById(id);
        
        return ResponseEntity.noContent().build();
    }

    /**
     * Busca pessoa jurídica por razão social
     * Endpoint para busca por nome empresarial
     */
    @GetMapping("/razao-social/{razaoSocial}")
    public ResponseEntity<PessoaJuridica> buscarPorRazaoSocial(@PathVariable String razaoSocial) {
        log.info("Buscando pessoa jurídica por razão social: {}", razaoSocial);
        
        Optional<PessoaJuridica> pessoaJuridica = pessoaJuridicaRepository.findByRazaoSocial(razaoSocial);
        
        return pessoaJuridica.map(ResponseEntity::ok)
                          .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Verifica se pessoa jurídica existe por CNPJ
     * Endpoint para validação de documento
     */
    @GetMapping("/cnpj/{cnpj}/existe")
    public ResponseEntity<Boolean> verificarExistenciaPorCnpj(@PathVariable String cnpj) {
        log.info("Verificando existência de pessoa jurídica por CNPJ: {}", cnpj);
        
        boolean existe = pessoaJuridicaRepository.findByCnpj(cnpj).isPresent();
        
        return ResponseEntity.ok(existe);
    }
}
