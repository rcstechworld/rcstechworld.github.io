namespace RcsTechWorld.Api.Models;

public record CreateOrderRequest(
    string ProductName,
    string ProductUrl,
    decimal Amount,
    string CustomerName,
    string CustomerMobile,
    string CustomerEmail,
    string CustomerAddress
);

public record Order(
    string OrderId,
    string ProductName,
    string ProductUrl,
    decimal Amount,
    string CustomerName,
    string CustomerMobile,
    string CustomerEmail,
    string CustomerAddress,
    string Status,
    DateTime CreatedAt
);
