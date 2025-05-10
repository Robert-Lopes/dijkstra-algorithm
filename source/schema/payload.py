"""
Esse arquivo é usado para modelar os principais payloads (Request e Response) da API.
Obs: O proprio FastAPI tem uma lógica interna para ter um retorno padrão associado 
a um status code. Na maioria das vezes, podendo ser um objeto do tipo null.
"""

from pydantic import BaseModel
from typing import Dict, Any

class RequestFailed(BaseModel):
    """
        Modelo básico de resposta de falha
    """
    tipoErro: str
    detalhes: Dict[str, Any]