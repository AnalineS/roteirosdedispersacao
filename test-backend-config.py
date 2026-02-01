# Arquivo de teste para validar hooks backend
import json
from typing import Dict, Any

def test_medical_function(patient_data: Dict[str, Any]) -> bool:
    """
    Função de teste para validação médica.
    Validates required fields, types, and value constraints.
    """

    required_fields = ['nome', 'idade', 'medicamento']

    for field in required_fields:
        if field not in patient_data:
            print(f"Campo obrigatório ausente: {field}")
            return False

    if not isinstance(patient_data['nome'], str) or not patient_data['nome'].strip():
        print("Campo 'nome' deve ser uma string não vazia")
        return False

    if not isinstance(patient_data['idade'], (int, float)) or patient_data['idade'] <= 0 or patient_data['idade'] > 150:
        print("Campo 'idade' deve ser um número entre 1 e 150")
        return False

    if not isinstance(patient_data['medicamento'], str) or not patient_data['medicamento'].strip():
        print("Campo 'medicamento' deve ser uma string não vazia")
        return False

    return True

# Test configuration
config = {
    "database_url": "sqlite:///medical.db",
    "api_timeout": 30,
    "debug": False
}

print("Backend configuration test file created")