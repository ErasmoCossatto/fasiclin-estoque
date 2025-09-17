package com.br.fasipe.estoque.MovimentacaoEstoque.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.PessoaJuridica;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.PessoaJuridicaRepository;

import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class PessoaJuridicaService {

    @Autowired
    private PessoaJuridicaRepository pessoaJuridicaRepository;

    public Optional<PessoaJuridica> findById(Integer id) {
        return pessoaJuridicaRepository.findById(id);
    }

    @Transactional
    public PessoaJuridica save(PessoaJuridica pessoaJuridica) {
        return pessoaJuridicaRepository.save(pessoaJuridica);
    }
}
