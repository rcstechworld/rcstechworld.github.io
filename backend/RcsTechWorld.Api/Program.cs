using RcsTechWorld.Api.Models;

var builder = WebApplication.CreateBuilder(args);

// ================================
// Services
// ================================

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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

app.UseHttpsRedirection();

app.UseCors("RcsTechWorldFrontend");

// ================================
// API: Health
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

app.MapPost("/api/orders", (CreateOrderRequest request) =>
{
    var orderId =
        $"RCTW-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(100, 999)}";

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
        CreatedAt: DateTime.UtcNow
    );

    orders[orderId] = order;

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
