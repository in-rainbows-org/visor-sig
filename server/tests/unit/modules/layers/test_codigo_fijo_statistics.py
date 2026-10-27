from unittest.mock import MagicMock

from app.modules.layers.application.ports.readers.codigo_fijo_statistics_reader import (
    CodigoFijoStatisticsReader,
)
from app.modules.layers.application.queries.get_codigo_fijo_statistics import (
    CodigoFijoStatisticsDTO,
    GetCodigoFijoStatisticsQuery,
    GetCodigoFijoStatisticsQueryHandler,
)


def test_get_codigo_fijo_statistics_query_handler_delegates_to_reader() -> None:
    # Arrange
    mock_reader = MagicMock(spec=CodigoFijoStatisticsReader)
    expected_dto = CodigoFijoStatisticsDTO(
        total=150,
        normal=100,
        para_corte=20,
        cortado=15,
        baja_parcial=10,
        baja_total=5,
    )
    mock_reader.get_statistics.return_value = expected_dto

    handler = GetCodigoFijoStatisticsQueryHandler(reader=mock_reader)

    # Act
    result = handler.execute(GetCodigoFijoStatisticsQuery())

    # Assert
    assert result == expected_dto
    mock_reader.get_statistics.assert_called_once()


def test_get_codigo_fijo_statistics_query_handler_with_none_query() -> None:
    # Arrange
    mock_reader = MagicMock(spec=CodigoFijoStatisticsReader)
    expected_dto = CodigoFijoStatisticsDTO(
        total=0,
        normal=0,
        para_corte=0,
        cortado=0,
        baja_parcial=0,
        baja_total=0,
    )
    mock_reader.get_statistics.return_value = expected_dto

    handler = GetCodigoFijoStatisticsQueryHandler(reader=mock_reader)

    # Act
    result = handler.execute(None)

    # Assert
    assert result == expected_dto
    mock_reader.get_statistics.assert_called_once()
