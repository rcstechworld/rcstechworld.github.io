using Google.Apis.Auth.OAuth2;
using Google.Apis.Services;
using Google.Apis.Sheets.v4;
using Google.Apis.Sheets.v4.Data;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;

namespace RcsTechWorld.Api.Services;

public class GoogleSheetsService
{
    private readonly SheetsService _sheets;
    private readonly string _spreadsheetId;

    public GoogleSheetsService()
    {
        var clientId = GetRequired("GOOGLE_CLIENT_ID");
        var clientSecret = GetRequired("GOOGLE_CLIENT_SECRET");
        var refreshToken = GetRequired("GOOGLE_REFRESH_TOKEN");

        _spreadsheetId = GetRequired("GOOGLE_SPREADSHEET_ID");

        var token = new TokenResponse
        {
            RefreshToken = refreshToken
        };

        var flow = new GoogleAuthorizationCodeFlow(
            new GoogleAuthorizationCodeFlow.Initializer
            {
                ClientSecrets = new ClientSecrets
                {
                    ClientId = clientId,
                    ClientSecret = clientSecret
                },
                Scopes = new[]
                {
                    SheetsService.Scope.Spreadsheets
                }
            });

        var credential = new UserCredential(
            flow,
            "rcs-tech-world",
            token);

        _sheets = new SheetsService(
            new BaseClientService.Initializer
            {
                HttpClientInitializer = credential,
                ApplicationName = "RCS Tech World API"
            });
    }

    public async Task AppendOrderAsync(
        string orderId,
        string productName,
        string productUrl,
        decimal amount,
        string customerName,
        string customerMobile,
        string customerEmail,
        string customerAddress,
        string status,
        string paymentId,
        string paymentGateway,
        DateTime createdAt,
        DateTime updatedAt)
    {
        var values = new List<IList<object>>
        {
            new List<object>
            {
                orderId,
                productName,
                productUrl,
                amount,
                customerName,
                customerMobile,
                customerEmail,
                customerAddress,
                status,
                paymentId,
                paymentGateway,
                createdAt.ToString("O"),
                updatedAt.ToString("O")
            }
        };

        var body = new ValueRange
        {
            Values = values
        };

        var request = _sheets.Spreadsheets.Values.Append(
            body,
            _spreadsheetId,
            "A:M");

        request.ValueInputOption =
            SpreadsheetsResource.ValuesResource.AppendRequest
                .ValueInputOptionEnum.USERENTERED;

        request.InsertDataOption =
            SpreadsheetsResource.ValuesResource.AppendRequest
                .InsertDataOptionEnum.INSERTROWS;

        await request.ExecuteAsync();
    }

    private static string GetRequired(string name)
    {
        var value = Environment.GetEnvironmentVariable(name);

        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException(
                $"Missing environment variable: {name}");
        }

        return value;
    }
}
