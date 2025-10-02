"""
Clase base abstracta para todos los agentes de IA.
Define el contrato común para la orquestación con LangGraph.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from langgraph.graph import StateGraph, END
from langchain_core.tools import BaseTool
from pydantic import BaseModel


class AgentState(BaseModel):
    """
    Estado base para todos los agentes.
    Puede ser extendido por agentes específicos.
    """
    messages: List[Dict[str, Any]] = []
    user_input: Optional[str] = None
    context: Dict[str, Any] = {}
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class BaseAgent(ABC):
    """
    Clase base abstracta para todos los agentes de IA.
    Define el contrato común que debe implementar cada agente.
    """
    
    def __init__(self, name: str, description: str):
        """
        Inicializa el agente base.
        
        Args:
            name: Nombre del agente
            description: Descripción de las capacidades del agente
        """
        self.name = name
        self.description = description
        self._graph: Optional[StateGraph] = None
        self._tools: List[BaseTool] = []
    
    @abstractmethod
    def build_graph(self) -> StateGraph:
        """
        Construye el grafo de LangGraph para este agente.
        
        Returns:
            Grafo de LangGraph configurado
        """
        pass
    
    @abstractmethod
    def get_tools(self) -> List[BaseTool]:
        """
        Obtiene las herramientas disponibles para este agente.
        
        Returns:
            Lista de herramientas LangChain
        """
        pass
    
    def get_graph(self) -> StateGraph:
        """
        Obtiene el grafo del agente, construyéndolo si es necesario.
        
        Returns:
            Grafo de LangGraph del agente
        """
        if self._graph is None:
            self._graph = self.build_graph()
        return self._graph
    
    def get_available_tools(self) -> List[BaseTool]:
        """
        Obtiene las herramientas disponibles, inicializándolas si es necesario.
        
        Returns:
            Lista de herramientas disponibles
        """
        if not self._tools:
            self._tools = self.get_tools()
        return self._tools
    
    async def execute(self, user_input: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Ejecuta el agente con la entrada del usuario.
        
        Args:
            user_input: Entrada del usuario
            context: Contexto adicional para el agente
            
        Returns:
            Resultado de la ejecución del agente
        """
        try:
            # Construir el estado inicial
            initial_state = AgentState(
                user_input=user_input,
                context=context or {},
                messages=[{"role": "user", "content": user_input}]
            )
            
            # Obtener el grafo y ejecutar
            graph = self.get_graph()
            result = await graph.ainvoke(initial_state.dict())
            
            return {
                "success": True,
                "result": result,
                "agent": self.name
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "agent": self.name
            }
    
    def get_description(self) -> str:
        """
        Obtiene la descripción del agente.
        
        Returns:
            Descripción del agente
        """
        return self.description
    
    def get_name(self) -> str:
        """
        Obtiene el nombre del agente.
        
        Returns:
            Nombre del agente
        """
        return self.name
