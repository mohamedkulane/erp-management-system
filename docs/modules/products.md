# Products and Pricing Module

**Status:** Ready for implementation planning  
**Module Code:** `products`

## 1. Purpose

The Products module manages products, categories, units of measure, barcodes, tracking configuration, costing methods and prices.

## 2. Responsibilities

- Product master
- Product categories
- Units of measure
- UOM conversion
- Barcodes
- Product status
- Lot and serial tracking
- Costing configuration
- Accounting configuration
- Price lists
- Discount rules

## 3. Core Entities

### Product

- `id`
- `tenant_id`
- `sku`
- `name`
- `description`
- `product_type`
- `category_id`
- `base_uom_id`
- `status`
- `tracking_method`
- `costing_method`
- `tax_category_id`

Product types:

- `STOCK`
- `SERVICE`
- `NON_STOCK`
- `BUNDLE`

Tracking methods:

- `NONE`
- `LOT`
- `SERIAL`

Costing methods:

- `WEIGHTED_AVERAGE`
- `FIFO`
- `STANDARD_COST`
- `SPECIFIC_IDENTIFICATION`

### UnitOfMeasure

- Code
- Name
- Category
- Decimal precision

### UOMConversion

- From UOM
- To UOM
- Conversion factor

### PriceList

- Name
- Currency
- Effective dates
- Customer scope

### PriceListItem

- Product
- Unit price
- Minimum quantity
- Effective dates

## 4. Business Rules

- SKU is unique within tenant.
- Product status controls transaction eligibility.
- Base UOM cannot change after posted stock exists without controlled migration.
- Serial-tracked products require unique serial numbers.
- Lot-tracked products require lot information for controlled movements.
- Costing method changes require approval and migration rules.
- Price-list date ranges must not conflict unexpectedly.
- Product cost is restricted information.

## 5. Main Use Cases

- Create product
- Update product
- Activate or deactivate product
- Create UOM
- Configure UOM conversion
- Add barcode
- Configure tracking
- Configure costing
- Create price list
- Add price-list item
- Create discount rule

## 6. API Endpoints

```text
POST   /api/v1/products
GET    /api/v1/products
GET    /api/v1/products/{id}
PATCH  /api/v1/products/{id}
POST   /api/v1/products/{id}/activate
POST   /api/v1/products/{id}/deactivate

POST   /api/v1/products/uoms
POST   /api/v1/products/uom-conversions

POST   /api/v1/pricing/price-lists
POST   /api/v1/pricing/price-lists/{id}/items
GET    /api/v1/pricing/resolve-price
```

## 7. Permissions

- `product.view`
- `product.create`
- `product.update`
- `product.activate`
- `product.cost_view`
- `product.cost_manage`
- `pricing.view`
- `pricing.manage`
- `discount_rule.manage`

## 8. Domain Events

- `ProductCreated`
- `ProductUpdated`
- `ProductActivated`
- `ProductDeactivated`
- `ProductTrackingChanged`
- `ProductCostingChanged`
- `PriceListCreated`
- `PriceListUpdated`

## 9. Testing Requirements

- SKU uniqueness
- UOM conversion accuracy
- Tracking requirements
- Cost field security
- Price resolution
- Effective-date rules
- Product deactivation enforcement
- Tenant isolation
