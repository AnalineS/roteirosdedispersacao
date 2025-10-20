# -*- coding: utf-8 -*-
"""
Improved AI Personas System - Clean Architecture
Replaces simple personas.py with better structure and validation
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, List, Optional, Any
from enum import Enum
import logging


logger = logging.getLogger(__name__)


class PersonaType(Enum):
    """Persona type enumeration"""
    TECHNICAL = "technical"
    EMPATHETIC = "empathetic"
    EDUCATIONAL = "educational"
    CLINICAL = "clinical"


class AudienceType(Enum):
    """Target audience enumeration"""
    HEALTHCARE_PROFESSIONALS = "healthcare_professionals"
    PATIENTS = "patients"
    STUDENTS = "students"
    GENERAL_PUBLIC = "general_public"


@dataclass
class PersonaCapabilities:
    """Persona capabilities definition"""
    expertise_areas: List[str]
    languages: List[str]
    response_formats: List[str]
    interaction_modes: List[str]

    def validate(self) -> List[str]:
        """Validate persona capabilities"""
        errors = []

        if not self.expertise_areas:
            errors.append("At least one expertise area must be defined")

        if not self.languages:
            errors.append("At least one language must be supported")

        return errors


@dataclass
class PersonaConfiguration:
    """Complete persona configuration"""
    persona_id: str
    name: str
    description: str
    persona_type: PersonaType
    target_audience: AudienceType
    avatar: str
    personality_traits: List[str]
    capabilities: PersonaCapabilities
    system_prompt: str
    response_style: str

    def validate(self) -> List[str]:
        """Validate persona configuration"""
        errors = []

        if not self.persona_id or not self.persona_id.replace('_', '').isalnum():
            errors.append("Persona ID must be alphanumeric (underscore allowed)")

        if not self.name or len(self.name) < 2:
            errors.append("Persona name must be at least 2 characters")

        if not self.system_prompt or len(self.system_prompt) < 50:
            errors.append("System prompt must be at least 50 characters")

        # Validate capabilities
        errors.extend(self.capabilities.validate())

        return errors


class BasePersona(ABC):
    """Abstract base class for personas"""

    def __init__(self, config: PersonaConfiguration):
        self.config = config
        self._validate_config()

    def _validate_config(self) -> None:
        """Validate persona configuration"""
        errors = self.config.validate()
        if errors:
            raise ValueError(f"Invalid persona configuration: {', '.join(errors)}")

    @abstractmethod
    def customize_response(self, base_response: str, context: Dict[str, Any]) -> str:
        """Customize response based on persona characteristics"""
        pass

    @abstractmethod
    def validate_input(self, user_input: str) -> bool:
        """Validate if input is appropriate for this persona"""
        pass

    def get_capabilities(self) -> PersonaCapabilities:
        """Get persona capabilities"""
        return self.config.capabilities

    def get_system_prompt(self, context: Optional[Dict[str, Any]] = None) -> str:
        """Get system prompt, optionally customized with context"""
        base_prompt = self.config.system_prompt

        if context:
            # Add context-specific instructions
            if context.get('user_type'):
                base_prompt += f"\nUser type: {context['user_type']}"
            if context.get('session_history'):
                base_prompt += "\nConsider previous conversation context."

        return base_prompt


class DrGasnelioPersona(BasePersona):
    """Dr. Gasnelio - Technical pharmacist persona"""

    def __init__(self):
        config = PersonaConfiguration(
            persona_id="dr_gasnelio",
            name="Dr. Gasnelio",
            description="Clinical pharmacist specialist in leprosy PQT-U treatment",
            persona_type=PersonaType.TECHNICAL,
            target_audience=AudienceType.HEALTHCARE_PROFESSIONALS,
            avatar="👨‍⚕️",
            personality_traits=[
                "technical", "scientific", "precise", "evidence-based",
                "professional", "methodical", "detail-oriented"
            ],
            capabilities=PersonaCapabilities(
                expertise_areas=[
                    "Poliquimioterapia Única (PQT-U)",
                    "Rifampicin, clofazimine, dapsone pharmacology",
                    "Pharmaceutical dispensing protocols",
                    "Pharmacovigilance in leprosy",
                    "Professional technical guidance",
                    "Drug interactions and contraindications",
                    "Dosage calculations and adjustments"
                ],
                languages=["pt-BR", "en"],
                response_formats=["structured", "clinical", "technical"],
                interaction_modes=["consultation", "education", "protocol_guidance"]
            ),
            system_prompt="""You are Dr. Gasnelio, a clinical pharmacist specialist in leprosy treatment.

Your expertise includes:
- Poliquimioterapia Única (PQT-U) protocols
- Advanced pharmacology of rifampicin, clofazimine, and dapsone
- Evidence-based pharmaceutical dispensing protocols
- Pharmacovigilance and drug safety monitoring
- Professional technical guidance for healthcare providers

Communication style:
- Use precise technical terminology appropriately
- Provide evidence-based information with citations when possible
- Structure responses clearly with clinical protocols
- Include safety considerations and contraindications
- Maintain professional medical communication standards

Always prioritize patient safety and follow established medical protocols.""",
            response_style="Technical, structured, with scientific citations and protocols"
        )
        super().__init__(config)

    def customize_response(self, base_response: str, context: Dict[str, Any]) -> str:
        """Customize response with technical formatting"""
        # Add technical structure
        if "dosage" in base_response.lower() or "dose" in base_response.lower():
            base_response = f"⚕️ **Clinical Guidance**: {base_response}"

        if "interaction" in base_response.lower():
            base_response = f"⚠️ **Drug Interaction Alert**: {base_response}"

        # Add professional signature
        base_response += "\n\n*Dr. Gasnelio - Clinical Pharmacist*"

        return base_response

    def validate_input(self, user_input: str) -> bool:
        """Validate input is appropriate for technical consultation"""
        # Technical persona can handle all medical queries
        return True


class GaPersona(BasePersona):
    """Gá - Empathetic assistant persona"""

    def __init__(self):
        config = PersonaConfiguration(
            persona_id="ga",
            name="Gá",
            description="Empathetic pharmacist who explains leprosy in accessible language",
            persona_type=PersonaType.EMPATHETIC,
            target_audience=AudienceType.PATIENTS,
            avatar="👨‍💼",
            personality_traits=[
                "empathetic", "caring", "accessible", "patient",
                "encouraging", "supportive", "understanding"
            ],
            capabilities=PersonaCapabilities(
                expertise_areas=[
                    "Patient-centered communication",
                    "Translation of technical terms",
                    "Basic psychological support",
                    "Practical patient guidance",
                    "Simplified health education",
                    "Medication adherence support",
                    "Emotional wellness guidance"
                ],
                languages=["pt-BR"],
                response_formats=["conversational", "simple", "supportive"],
                interaction_modes=["support", "education", "guidance"]
            ),
            system_prompt="""You are Gá, an empathetic and experienced pharmacist who specializes in patient-centered care.

Your approach:
- Explain medical information in simple, understandable language
- Translate technical terms into everyday language
- Maintain a warm, caring, and professional tone
- Provide emotional support appropriate to the situation
- Focus on practical, actionable guidance for patients
- Encourage questions and create a safe space for concerns

Communication principles:
- Use simple, clear language avoiding medical jargon
- Show empathy and understanding for patient concerns
- Provide reassurance while being honest about treatment
- Include practical tips for daily life and medication management
- Always encourage patients to maintain contact with their healthcare team

Remember: You genuinely care about each patient's wellbeing and want to support them through their treatment journey.""",
            response_style="Warm, simple language, empathetic and supportive"
        )
        super().__init__(config)

    def customize_response(self, base_response: str, context: Dict[str, Any]) -> str:
        """Customize response with empathetic tone"""
        # Add empathetic elements
        if any(word in base_response.lower() for word in ["side effect", "concern", "worry", "afraid"]):
            base_response = "😊 Entendo sua preocupação. " + base_response

        if "medication" in base_response.lower() or "medicamento" in base_response.lower():
            base_response += "\n\n💙 Lembre-se: estou aqui para ajudar você durante todo o tratamento."

        # Add caring signature
        base_response += "\n\n*Com carinho, Gá - Seu farmacêutico de confiança*"

        return base_response

    def validate_input(self, user_input: str) -> bool:
        """Validate input is appropriate for patient support"""
        # Empathetic persona handles patient-oriented queries
        # Could add filters for overly technical requests
        return True


class PersonaRegistry:
    """Registry for managing available personas"""

    def __init__(self):
        self._personas: Dict[str, BasePersona] = {}
        self._initialize_default_personas()

    def _initialize_default_personas(self) -> None:
        """Initialize default personas"""
        try:
            self.register_persona(DrGasnelioPersona())
            self.register_persona(GaPersona())
            logger.info("Default personas initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize default personas: {e}")

    def register_persona(self, persona: BasePersona) -> None:
        """Register a new persona"""
        if not isinstance(persona, BasePersona):
            raise TypeError("Persona must inherit from BasePersona")

        persona_id = persona.config.persona_id
        if persona_id in self._personas:
            logger.warning(f"Persona {persona_id} already registered, replacing")

        self._personas[persona_id] = persona
        logger.info(f"Persona registered: {persona_id}")

    def get_persona(self, persona_id: str) -> Optional[BasePersona]:
        """Get persona by ID"""
        return self._personas.get(persona_id)

    def get_all_personas(self) -> Dict[str, BasePersona]:
        """Get all registered personas"""
        return self._personas.copy()

    def get_persona_info(self, persona_id: str) -> Optional[Dict[str, Any]]:
        """Get persona information"""
        persona = self.get_persona(persona_id)
        if not persona:
            return None

        config = persona.config
        return {
            "persona_id": config.persona_id,
            "name": config.name,
            "description": config.description,
            "avatar": config.avatar,
            "persona_type": config.persona_type.value,
            "target_audience": config.target_audience.value,
            "personality_traits": config.personality_traits,
            "expertise_areas": config.capabilities.expertise_areas,
            "response_style": config.response_style
        }

    def validate_persona_id(self, persona_id: str) -> bool:
        """Validate if persona ID exists"""
        return persona_id in self._personas

    def get_personas_by_audience(self, audience: AudienceType) -> List[str]:
        """Get personas suitable for specific audience"""
        matching_personas = []

        for persona_id, persona in self._personas.items():
            if persona.config.target_audience == audience:
                matching_personas.append(persona_id)

        return matching_personas

    def get_registry_stats(self) -> Dict[str, Any]:
        """Get registry statistics"""
        personas_by_type = {}
        personas_by_audience = {}

        for persona in self._personas.values():
            # Count by type
            persona_type = persona.config.persona_type.value
            personas_by_type[persona_type] = personas_by_type.get(persona_type, 0) + 1

            # Count by audience
            audience = persona.config.target_audience.value
            personas_by_audience[audience] = personas_by_audience.get(audience, 0) + 1

        return {
            "total_personas": len(self._personas),
            "personas_by_type": personas_by_type,
            "personas_by_audience": personas_by_audience,
            "available_ids": list(self._personas.keys())
        }


# Global persona registry
_persona_registry: Optional[PersonaRegistry] = None


def get_persona_registry() -> PersonaRegistry:
    """Get global persona registry"""
    global _persona_registry
    if _persona_registry is None:
        _persona_registry = PersonaRegistry()
    return _persona_registry


# Compatibility functions for existing code
def get_personas() -> Dict[str, Any]:
    """Get all personas (compatibility function)"""
    registry = get_persona_registry()
    personas_info = {}

    for persona_id in registry.get_all_personas():
        persona_info = registry.get_persona_info(persona_id)
        if persona_info:
            personas_info[persona_id] = persona_info

    return personas_info


def get_persona_prompt(persona_id: str) -> str:
    """Get persona prompt (compatibility function)"""
    registry = get_persona_registry()
    persona = registry.get_persona(persona_id)

    if persona:
        return persona.get_system_prompt()

    return "Respond clearly and helpfully based on leprosy treatment guidelines."


def validate_persona(persona_id: str) -> bool:
    """Validate persona exists (compatibility function)"""
    registry = get_persona_registry()
    return registry.validate_persona_id(persona_id)


def get_persona_capabilities(persona_id: str) -> List[str]:
    """Get persona capabilities (compatibility function)"""
    registry = get_persona_registry()
    persona_info = registry.get_persona_info(persona_id)

    if persona_info:
        return persona_info.get("expertise_areas", [])

    return []