using RcsTechWorld.Api.Models;
using RcsTechWorld.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// ================================
// Services
// ================================

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Google Sheets
builder.Services.AddSingleton<GoogleSheetsService>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("RcsTechWorldFrontend", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// ================================
// Temporary Order Store
// ================================

var orders = new Dictionary<string, Order>();

// ================================
// Swagger
// ================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();

    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint(
            "/swagger/v1/swagger.json",
            "RCS Tech World API v1"
        );
    });
}

// Render handles HTTPS at the proxy/edge level.
// No HTTPS redirection is required inside the container.

// ================================
// CORS
// ================================

app.UseCors("RcsTechWorldFrontend");

// ================================
// API: Status
// ================================

app.MapGet("/", () =>
{
    return Results.Ok(new
    {
        service = "RCS Tech World API",
        status = "Running",
        version = "1.0"
    });
})
.WithName("ApiStatus")
.WithOpenApi();

// ================================
// API: Health
// ================================

app.MapGet("/api/health", () =>
{
    return Results.Ok(new
    {
        status = "Healthy",
        timestamp = DateTime.UtcNow
    });
})
.WithName("HealthCheck")
.WithOpenApi();

// ================================
// API: Create Order
// ================================

app.MapPost(
    "/api/orders",
    async (
        CreateOrderRequest request,
        GoogleSheetsService googleSheets) =>
    {
        var orderId =
            $"RCTW-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(100, 999)}";

        var now = DateTime.UtcNow;

        var order = new Order(
            OrderId: orderId,
            ProductName: request.ProductName,
            ProductUrl: request.ProductUrl,
            Amount: request.Amount,
            CustomerName: request.CustomerName,
            CustomerMobile: request.CustomerMobile,
            CustomerEmail: request.CustomerEmail,
            CustomerAddress: request.CustomerAddress,
            Status: "Pending",
            CreatedAt: now
        );

        // Keep temporary in-memory copy
        orders[orderId] = order;

        // Save transaction to Google Sheets
        await googleSheets.AppendOrderAsync(
            order.OrderId,
            order.ProductName,
            order.ProductUrl,
            order.Amount,
            order.CustomerName,
            order.CustomerMobile,
            order.CustomerEmail,
            order.CustomerAddress,
            order.Status,
            "",
            "",
            order.CreatedAt,
            now
        );

        return Results.Created(
            $"/api/orders/{orderId}",
            order
        );
    })
.WithName("CreateOrder")
.WithOpenApi();

// ================================
// API: Get Order
// ================================

app.MapGet("/api/orders/{orderId}", (string orderId) =>
{
    if (!orders.TryGetValue(orderId, out var order))
    {
        return Results.NotFound(new
        {
            message = "Order not found",
            orderId
        });
    }

    return Results.Ok(order);
})
.WithName("GetOrder")
.WithOpenApi();

// ================================
// Start
// ================================

app.Run();
