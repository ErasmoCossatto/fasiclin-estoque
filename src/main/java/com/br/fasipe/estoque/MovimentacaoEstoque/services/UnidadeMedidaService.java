package com.br.fasipe.estoque.MovimentacaoEstoque.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.UnidadeMedida;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.UnidadeMedidaRepository;

import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class UnidadeMedidaService {

    @Autowired
    private UnidadeMedidaRepository unidadeMedidaRepository;

    public Optional<UnidadeMedida> findById(Integer id) {
        return unidadeMedidaRepository.findById(id);
    }

    public Optional<UnidadeMedida> findByAbreviacao(String abreviacao) {
        return unidadeMedidaRepository.findByAbreviacao(abreviacao);
    }

    @Transactional
    public UnidadeMedida save(UnidadeMedida unidadeMedida) {
        return unidadeMedidaRepository.save(unidadeMedida);
    }
}
