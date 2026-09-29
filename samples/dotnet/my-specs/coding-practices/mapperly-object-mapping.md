# Mapperly Object Mapping

Status: Proposed

Created by: Sample Author <sample.author@example.com>

Created on: 2026-08-05

Applies to: `$myspec-implement` and implementation-focused findings from `$myspec-quantify`

## Rule

Use [Mapperly](https://mapperly.riok.app/) for new production mappings between distinct transport, presentation, application, domain, and persistence types. Keep each mapper in the consuming layer's `Mappers/` folder, group it by feature or bounded context, and name it `<Feature>Mapper`. Do not put domain rules, I/O, repository calls, authorization decisions, validation, or side effects in a mapper.

A mapper is preferably a `static partial` class marked with `[Mapper]`; its mapping methods are preferably `static partial` extension methods and use an explicit, direction-oriented name such as `ToCreateCommand`, `ToDetailDto`, or `ApplyUpdate`. This keeps stateless mappings callable directly from their source values without mapper allocation, dependency-injection registration, or service resolution. Map identically named members conventionally. For every rename, ignored member, constant, enum strategy, nested path, or update target, declare the corresponding Mapperly attribute next to the affected method. Do not hide a material mapping decision in hand-written assignment code.

Use an instance mapper only when the mapping genuinely requires injected dependencies or per-instance state that cannot be supplied safely through static mapping methods. Do not introduce an instance mapper merely to follow a service-style abstraction or to make a stateless mapping injectable. Document the dependency or state that justifies the exception next to the mapper declaration.

Keep Mapperly's strict unmapped-member diagnostics enabled. The mapper declaration must set `RequiredMappingStrategy = RequiredMappingStrategy.Both`; a method may relax that only with a comment explaining why the omitted source or target member is intentional. Enum-to-enum mappings must explicitly choose `ByName` or `ByValueCheckDefined`; use `ByName` unless the two enum values are intentionally defined by the same stable numeric values.

Use a `void` mapping method with the existing target as the second argument for an update/merge. For a partial update, set `AllowNullPropertyAssignment = false` and map only optional update data. Do not use Mapperly to mutate domain aggregates when the aggregate exposes behavior that enforces an invariant; call the domain behavior instead.

Hand-written mapping is permitted only when the transformation is business behavior or cannot be expressed safely as a Mapperly configuration. Keep that code small, name it for the transformation, and document why it is not a generated mapping. Existing hand-written mappers are migrated only when a scoped change touches their mapping boundary.

A class does not satisfy this practice merely because it is marked with `[Mapper]`. Do not disguise a hand-written object mapping as a Mapperly mapper by manually constructing the complete target inside a non-`partial` mapping method when Mapperly can select and invoke its constructor. Prefer this order:

1. Let Mapperly map matching members and constructor parameters conventionally.
2. Configure renamed, flattened, ignored, or whole-source members with Mapperly attributes.
3. Register another static mapper with `[UseStaticMapper]` when it already owns a nested conversion.
4. Use a named method through `Use` or `[UserMapping]` only for the smallest value-level transformation Mapperly cannot express directly.
5. Use an instance mapper and `[UseMapper]` only when an injected dependency or per-instance state is required.
6. Write the complete object mapping manually only when the preceding options cannot express it safely or when constructing the object is itself domain behavior.

When focused custom methods exist, consider `AutoUserMappings = false` so Mapperly uses only methods selected explicitly with `Use` or `[UserMapping]`. This keeps helper discovery intentional and prevents an unrelated compatible method from silently becoming a conversion candidate.

## Typical Mapperly Shapes

The following shapes follow the Mapperly documentation and are the preferred starting point. Types shown are illustrative and should live in their normal layer-specific files.

### Convention and renamed members

```csharp
using Riok.Mapperly.Abstractions;

[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Both)]
public static partial class ProductMapper
{
    [MapProperty(nameof(ProductEditorViewModel.ProductName), nameof(CreateProductRequest.Name))]
    public static partial CreateProductRequest ToCreateRequest(this ProductEditorViewModel source);
}
```

Mapperly generates assignments for matching members. `MapProperty` makes the non-matching `ProductName`/`Name` decision visible and checked.

### Mapping an API request into an application command

```csharp
using Riok.Mapperly.Abstractions;

[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Both)]
public static partial class ProductRequestMapper
{
    public static partial CreateProductCommand ToCreateCommand(this CreateProductRequest source);
}
```

Route values and authenticated actor data are not request-body properties. The endpoint supplies them after mapping, and the application/domain layers remain responsible for authorization and invariants.

### Updating an existing presentation model

```csharp
using Riok.Mapperly.Abstractions;

[Mapper(
    RequiredMappingStrategy = RequiredMappingStrategy.Both,
    AllowNullPropertyAssignment = false)]
public static partial class ProductEditorMapper
{
    [MapProperty(nameof(ProductDetailDto.Name), nameof(ProductEditorViewModel.ProductName))]
    public static partial void Apply(this ProductDetailDto source, ProductEditorViewModel target);
}
```

The `void` method updates the supplied target. `AllowNullPropertyAssignment = false` is appropriate only for a merge where `null` means "leave the existing value unchanged"; do not use it when `null` is a meaningful value that must clear the target.

### Explicit enum mapping

```csharp
using Riok.Mapperly.Abstractions;

[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Both)]
public static partial class ProductStatusMapper
{
    [MapEnum(EnumMappingStrategy.ByName)]
    public static partial ProductStatus ToContractStatus(this ProductLifecycleStatus source);
}
```

The explicit strategy prevents an accidental reliance on matching numeric values and preserves Mapperly diagnostics when enum members change.

### Generated constructor mapping with an external static mapper

Use `MapPropertyFromSource` when a target constructor parameter is derived from the entire source object. Register an existing static mapper for a nested value object instead of calling that mapper from a hand-written object-construction method. Keep compatibility or fallback behavior in small named conversions selected through `Use`.

```csharp
using Riok.Mapperly.Abstractions;

[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Both)]
[UseStaticMapper(typeof(PriceMapper))]
public static partial class OrderLineMapper
{
    [MapPropertyFromSource(nameof(OrderLine.UnitPrice))]
    [MapPropertyFromSource(
        nameof(OrderLine.ProductId),
        Use = nameof(ToProductId))]
    [MapPropertyFromSource(
        nameof(OrderLine.VariantId),
        Use = nameof(ToVariantId))]
    [MapperIgnoreSource(nameof(OrderLineEntity.UnitPriceAmount))]
    [MapperIgnoreSource(nameof(OrderLineEntity.UnitPriceCurrency))]
    [MapperIgnoreSource(nameof(OrderLineEntity.LegacyProductId))]
    [MapperIgnoreSource(nameof(OrderLineEntity.LegacyVariantId))]
    [MapperIgnoreSource(nameof(OrderLineEntity.Order))]
    [MapperIgnoreSource(nameof(OrderLineEntity.Product))]
    public static partial OrderLine ToDomain(this OrderLineEntity entity);

    private static Guid ToProductId(OrderLineEntity entity) =>
        entity.ProductId ?? entity.LegacyProductId ?? Guid.Empty;

    private static Guid? ToVariantId(OrderLineEntity entity) =>
        entity.VariantId ?? entity.LegacyVariantId;
}
```

Mapperly owns constructor selection and all conventional member assignments. The external mapper owns `OrderLineEntity` to `Price`, while the two hand-written methods contain only the legacy fallback decisions that require coalescing multiple source members.

### Generated collection mapping with focused user mappings

Let Mapperly generate collection traversal and element conversion. Use `MapPropertyFromSource` for a scalar-to-object conversion and `[UserMapping]` for the inverse element conversion instead of manually projecting the collection in the top-level mapping methods.

```csharp
using Riok.Mapperly.Abstractions;

[Mapper(
    RequiredMappingStrategy = RequiredMappingStrategy.Both,
    AutoUserMappings = false)]
public static partial class ProductPersistenceMapper
{
    [MapperIgnoreTarget(nameof(ProductEntity.OrderLines))]
    [MapperIgnoreTarget(nameof(ProductEntity.Reviews))]
    [MapProperty(
        nameof(Product.Name),
        nameof(ProductEntity.NormalizedName),
        Use = nameof(@Product.NormalizeName))]
    [MapProperty(nameof(Product.Tags), nameof(ProductEntity.ProductTags))]
    public static partial ProductEntity ToEntity(this Product domain);

    [MapperIgnoreSource(nameof(ProductEntity.NormalizedName))]
    [MapperIgnoreSource(nameof(ProductEntity.OrderLines))]
    [MapperIgnoreSource(nameof(ProductEntity.Reviews))]
    [MapProperty(nameof(ProductEntity.ProductTags), nameof(Product.Tags))]
    public static partial Product ToDomain(this ProductEntity entity);

    [MapperIgnoreTarget(nameof(ProductTagEntity.ProductId))]
    [MapperIgnoreTarget(nameof(ProductTagEntity.Product))]
    [MapPropertyFromSource(nameof(ProductTagEntity.Tag))]
    [MapPropertyFromSource(
        nameof(ProductTagEntity.NormalizedTag),
        Use = nameof(@Product.NormalizeTag))]
    private static partial ProductTagEntity ToTagEntity(string tag);

    [UserMapping]
    private static string ToTag(ProductTagEntity productTag) => productTag.Tag;
}
```

The top-level methods remain generated even though the tag collection needs element conversions in both directions. `AutoUserMappings = false` and `[UserMapping]` make the inverse conversion explicit, while `Use` selects normalization behavior without taking over the complete object mapping.

## Verification

- Every new production object-to-object mapping uses a Mapperly mapper or records the permitted hand-written-mapping reason.
- Every new stateless mapper is a `static partial` class marked with `[Mapper]`, uses `RequiredMappingStrategy.Both`, and has direction-oriented `static partial` extension mapping methods.
- Every instance mapper documents the injected dependency or per-instance state that prevents it from being static.
- Every renamed, ignored, constant, enum, nested, or update-specific member decision is represented by an appropriate Mapperly attribute.
- Every Mapperly mapping method that Mapperly can generate is declared `partial`; a `[Mapper]` class does not retain manual whole-object construction for convenience alone.
- Existing static nested mappers are registered with `[UseStaticMapper]` and reused instead of being called from a manual top-level object mapping.
- Hand-written mapper methods are limited to named value-level transformations or documented domain behavior that Mapperly cannot safely generate.
- Mapperly generator diagnostics are resolved; they are not globally suppressed or downgraded.
- Mapping tests cover every explicitly configured member and each permitted hand-written transformation.

## Sources

- [Mapper configuration](https://mapperly.riok.app/docs/configuration/mapper/)
- [Static mappers and extension methods](https://mapperly.riok.app/docs/configuration/static-mappers/)
- [Constructor mappings](https://mapperly.riok.app/docs/configuration/ctor-mappings/)
- [Use external mappings](https://mapperly.riok.app/docs/configuration/external-mappings/)
- [User-implemented mapping methods](https://mapperly.riok.app/docs/configuration/user-implemented-methods/)
- [Existing target object](https://mapperly.riok.app/docs/configuration/existing-target/)
- [Enum mappings](https://mapperly.riok.app/docs/configuration/enum/)

## Approval History

- Approved by: Sample Author <sample.author@example.com>
- Approved on: 2026-08-05
- Approval context: Approved the Mapperly object-mapping convention, strict diagnostics, and documented mapping shapes.
