# Arquivo de teste para validar hooks backend
import json
from typing import Dict, Any

def test_medical_function(patient_data: Dict[str, Any]) -> bool:
    """
    Função de teste para validação médica
    TODO: Implementar validação completa
    """

    # Test data should not contain real medical info
    required_fields = ['nome', 'idade', 'medicamento']

    for field in required_fields:
        if field not in patient_data:
            print(f"Campo obrigatório ausente: {field}")
            return False

    return True

# Test configuration
config = {
    "database_url": "sqlite:///medical.db",
    "api_timeout": 30,
    "debug": False
}

print("Backend configuration test file created")