using System.ComponentModel.DataAnnotations;
using Team13.HitsClass.Domain;
using Team13.WebApi.Patching.Models;

namespace Team13.HitsClass.App.Features.Products.Dto;

public class PatchProductDto : PatchRequest<Product>
{
    [MinLength(3)]
    public string Title { get; set; }
    public ProductType ProductType { get; set; }

    public DateOnly LastStockUpdatedAt { get; set; }
}
