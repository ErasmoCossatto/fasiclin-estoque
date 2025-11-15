package com.br.fasipe.estoque.exception;

/**
 * Exceção lançada quando uma entidade não é encontrada no banco de dados.
 */
public class EntidadeNaoEncontradaException extends RuntimeException {
    
    public EntidadeNaoEncontradaException(String mensagem) {
        super(mensagem);
    }
    
    public EntidadeNaoEncontradaException(String entidade, Integer id) {
        super(String.format("%s com ID %d não encontrado(a)", entidade, id));
    }
}
