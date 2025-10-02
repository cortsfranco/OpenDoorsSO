"""
Workflow de aprobación de pagos usando LangGraph.
"""

import logging
from typing import Dict, Any, Optional, Literal
from datetime import datetime
from langgraph.graph import StateGraph, END
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from src.models.invoice import Invoice
from src.models.user import User
from src.services.activity_logger import ActivityLogger

logger = logging.getLogger(__name__)


class ApprovalState:
    """Estado del workflow de aprobación."""
    invoice_id: int
    approver_id: int
    action: Literal["approve", "reject", "pending"]
    reason: Optional[str]
    messages: list[BaseMessage]
    result: Dict[str, Any]


class ApprovalWorkflow:
    """Workflow de aprobación de pagos con human-in-the-loop."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
        self.activity_logger = ActivityLogger(session)
        self.graph = self._build_graph()
    
    def _build_graph(self) -> StateGraph:
        """Construye el grafo de aprobación."""
        workflow = StateGraph(ApprovalState)
        
        # Agregar nodos
        workflow.add_node("validate_invoice", self._validate_invoice)
        workflow.add_node("check_approver_permissions", self._check_approver_permissions)
        workflow.add_node("process_approval", self._process_approval)
        workflow.add_node("process_rejection", self._process_rejection)
        workflow.add_node("log_activity", self._log_activity)
        workflow.add_node("send_notification", self._send_notification)
        
        # Definir flujo
        workflow.set_entry_point("validate_invoice")
        
        workflow.add_edge("validate_invoice", "check_approver_permissions")
        workflow.add_conditional_edges(
            "check_approver_permissions",
            self._route_approval_action,
            {
                "approve": "process_approval",
                "reject": "process_rejection",
                "error": END
            }
        )
        workflow.add_edge("process_approval", "log_activity")
        workflow.add_edge("process_rejection", "log_activity")
        workflow.add_edge("log_activity", "send_notification")
        workflow.add_edge("send_notification", END)
        
        return workflow.compile()
    
    async def _validate_invoice(self, state: ApprovalState) -> ApprovalState:
        """Valida que la factura existe y está en estado correcto."""
        try:
            logger.info(f"Validando factura {state.invoice_id}")
            
            result = await self.session.execute(
                select(Invoice).where(Invoice.id == state.invoice_id)
            )
            invoice = result.scalar_one_or_none()
            
            if not invoice:
                state.messages.append(AIMessage(content="Factura no encontrada"))
                state.result = {"error": "Factura no encontrada"}
                return state
            
            if invoice.payment_status not in ["pending_approval", "approved", "rejected"]:
                state.messages.append(AIMessage(content="Factura no está en estado de aprobación"))
                state.result = {"error": "Factura no está en estado de aprobación"}
                return state
            
            state.messages.append(AIMessage(content="Factura validada correctamente"))
            return state
            
        except Exception as e:
            logger.error(f"Error validando factura: {str(e)}")
            state.messages.append(AIMessage(content=f"Error en validación: {str(e)}"))
            state.result = {"error": str(e)}
            return state
    
    async def _check_approver_permissions(self, state: ApprovalState) -> ApprovalState:
        """Verifica que el usuario tiene permisos para aprobar."""
        try:
            logger.info(f"Verificando permisos del aprobador {state.approver_id}")
            
            result = await self.session.execute(
                select(User).where(User.id == state.approver_id)
            )
            approver = result.scalar_one_or_none()
            
            if not approver:
                state.messages.append(AIMessage(content="Usuario aprobador no encontrado"))
                state.result = {"error": "Usuario aprobador no encontrado"}
                return state
            
            if approver.role not in ["approver", "admin"]:
                state.messages.append(AIMessage(content="Usuario no tiene permisos para aprobar"))
                state.result = {"error": "Usuario no tiene permisos para aprobar"}
                return state
            
            state.messages.append(AIMessage(content="Permisos verificados correctamente"))
            return state
            
        except Exception as e:
            logger.error(f"Error verificando permisos: {str(e)}")
            state.messages.append(AIMessage(content=f"Error en verificación: {str(e)}"))
            state.result = {"error": str(e)}
            return state
    
    def _route_approval_action(self, state: ApprovalState) -> str:
        """Rutea la acción de aprobación."""
        if state.result.get("error"):
            return "error"
        
        if state.action == "approve":
            return "approve"
        elif state.action == "reject":
            return "reject"
        else:
            return "error"
    
    async def _process_approval(self, state: ApprovalState) -> ApprovalState:
        """Procesa la aprobación de la factura."""
        try:
            logger.info(f"Aprobando factura {state.invoice_id}")
            
            await self.session.execute(
                update(Invoice)
                .where(Invoice.id == state.invoice_id)
                .values(
                    payment_status="approved",
                    approver_id=state.approver_id,
                    approved_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
            )
            
            await self.session.commit()
            
            state.messages.append(AIMessage(content="Factura aprobada exitosamente"))
            state.result = {"status": "approved", "message": "Factura aprobada"}
            return state
            
        except Exception as e:
            logger.error(f"Error aprobando factura: {str(e)}")
            await self.session.rollback()
            state.messages.append(AIMessage(content=f"Error en aprobación: {str(e)}"))
            state.result = {"error": str(e)}
            return state
    
    async def _process_rejection(self, state: ApprovalState) -> ApprovalState:
        """Procesa el rechazo de la factura."""
        try:
            logger.info(f"Rechazando factura {state.invoice_id}")
            
            await self.session.execute(
                update(Invoice)
                .where(Invoice.id == state.invoice_id)
                .values(
                    payment_status="rejected",
                    approver_id=state.approver_id,
                    approved_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
            )
            
            await self.session.commit()
            
            state.messages.append(AIMessage(content="Factura rechazada exitosamente"))
            state.result = {"status": "rejected", "message": "Factura rechazada", "reason": state.reason}
            return state
            
        except Exception as e:
            logger.error(f"Error rechazando factura: {str(e)}")
            await self.session.rollback()
            state.messages.append(AIMessage(content=f"Error en rechazo: {str(e)}"))
            state.result = {"error": str(e)}
            return state
    
    async def _log_activity(self, state: ApprovalState) -> ApprovalState:
        """Registra la actividad en el log."""
        try:
            action = "APROBACION_FACTURA" if state.action == "approve" else "RECHAZO_FACTURA"
            details = {
                "invoice_id": state.invoice_id,
                "action": state.action,
                "reason": state.reason
            }
            
            await self.activity_logger.log_activity(
                user_id=state.approver_id,
                action=action,
                details=details
            )
            
            state.messages.append(AIMessage(content="Actividad registrada en el log"))
            return state
            
        except Exception as e:
            logger.error(f"Error registrando actividad: {str(e)}")
            state.messages.append(AIMessage(content=f"Error en log: {str(e)}"))
            return state
    
    async def _send_notification(self, state: ApprovalState) -> ApprovalState:
        """Envía notificación al usuario que creó la factura."""
        try:
            # Aquí se implementaría la lógica de notificaciones
            # Por ahora solo loggeamos
            logger.info(f"Notificación enviada para factura {state.invoice_id}")
            state.messages.append(AIMessage(content="Notificación enviada"))
            return state
            
        except Exception as e:
            logger.error(f"Error enviando notificación: {str(e)}")
            state.messages.append(AIMessage(content=f"Error en notificación: {str(e)}"))
            return state
    
    async def process_approval(
        self,
        invoice_id: int,
        approver_id: int,
        action: Literal["approve", "reject"],
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """Procesa una aprobación o rechazo de factura."""
        try:
            initial_state = ApprovalState(
                invoice_id=invoice_id,
                approver_id=approver_id,
                action=action,
                reason=reason,
                messages=[],
                result={}
            )
            
            final_state = await self.graph.ainvoke(initial_state)
            return final_state.result
            
        except Exception as e:
            logger.error(f"Error en workflow de aprobación: {str(e)}")
            return {"error": str(e)}
