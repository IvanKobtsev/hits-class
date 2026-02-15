using Team13.HitsClass.Domain;

namespace Team13.HitsClass.App.Features.Products.Dto;

public class ProductDto
{
    public int Id { get; set; }
    public string Title { get; set; }
    public ProductType ProductType { get; set; }

    public DateOnly LastStockUpdatedAt { get; set; }
}
