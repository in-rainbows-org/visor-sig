import asyncio
import logging
from collections import defaultdict
from typing import Any
from uuid import UUID

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class AssignmentWebSocketManager:
    """Gestor en memoria de conexiones WebSocket agrupadas en salas por assignment_id."""

    def __init__(self) -> None:
        self._rooms: dict[UUID, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect(self, assignment_id: UUID, websocket: WebSocket) -> None:
        """Acepta la conexión WebSocket y la registra en la sala correspondiente a la asignación."""
        await websocket.accept()
        async with self._lock:
            self._rooms[assignment_id].add(websocket)
        logger.info(
            "WebSocket conectado a la sala de asignación %s (Conexiones activas: %d)",
            assignment_id,
            len(self._rooms[assignment_id]),
        )

    async def disconnect(self, assignment_id: UUID, websocket: WebSocket) -> None:
        """Elimina una conexión WebSocket de la sala correspondiente."""
        async with self._lock:
            if assignment_id in self._rooms:
                self._rooms[assignment_id].discard(websocket)
                if not self._rooms[assignment_id]:
                    del self._rooms[assignment_id]
        logger.info(
            "WebSocket desconectado de la sala %s (Conexiones restantes: %d)",
            assignment_id,
            len(self._rooms.get(assignment_id, set())),
        )

    async def broadcast_to_room(
        self,
        assignment_id: UUID,
        message: dict[str, Any],
        exclude: WebSocket | None = None,
    ) -> None:
        """Difunde un mensaje JSON a todas las conexiones registradas en la sala de la asignación."""
        async with self._lock:
            connections = list(self._rooms.get(assignment_id, set()))

        if not connections:
            return

        dead_connections: list[WebSocket] = []
        for connection in connections:
            if exclude is not None and connection == exclude:
                continue
            try:
                await connection.send_json(message)
            except Exception as exc:
                logger.warning(
                    "Error al enviar mensaje WebSocket a cliente en sala %s: %s",
                    assignment_id,
                    exc,
                )
                dead_connections.append(connection)

        if dead_connections:
            async with self._lock:
                for dead_conn in dead_connections:
                    if assignment_id in self._rooms:
                        self._rooms[assignment_id].discard(dead_conn)
                        if not self._rooms[assignment_id]:
                            del self._rooms[assignment_id]

    async def close_room(
        self,
        assignment_id: UUID,
        code: int = 1000,
        reason: str = "Assignment completed",
    ) -> None:
        """Cierra ordenadamente todas las conexiones de una sala y la elimina."""
        async with self._lock:
            connections = list(self._rooms.pop(assignment_id, set()))

        for connection in connections:
            try:
                await connection.close(code=code, reason=reason)
            except Exception as exc:
                logger.debug(
                    "Excepción ignorada al cerrar WebSocket en sala %s: %s",
                    assignment_id,
                    exc,
                )

        logger.info("Sala WebSocket para asignación %s cerrada con código %d", assignment_id, code)

    def get_room_connections_count(self, assignment_id: UUID) -> int:
        """Retorna la cantidad actual de conexiones activas en una sala."""
        return len(self._rooms.get(assignment_id, set()))


# Instancia singleton para compartir en el ciclo de vida de la aplicación
assignment_connection_manager = AssignmentWebSocketManager()
