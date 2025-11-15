package com.br.fasipe.estoque.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Conversor JPA para mapear Boolean (Java) para CHAR(1) 'S'/'N' (Banco de dados).
 * 
 * @author Sistema de Estoque FasiClin
 */
@Converter
public class BooleanToCharConverter implements AttributeConverter<Boolean, String> {

    /**
     * Converte Boolean para String ('S' ou 'N')
     */
    @Override
    public String convertToDatabaseColumn(Boolean attribute) {
        if (attribute == null) {
            return "N";
        }
        return attribute ? "S" : "N";
    }

    /**
     * Converte String ('S' ou 'N') para Boolean
     */
    @Override
    public Boolean convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return false;
        }
        return "S".equalsIgnoreCase(dbData.trim());
    }
}
