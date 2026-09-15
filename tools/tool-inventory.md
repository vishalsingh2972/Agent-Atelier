# WebMCP Tool Inventory

This document provides a machine-readable inventory of all 34 WebMCP tools registered by Bridge to Agentia.

---

## Auth Tools

### `login`
- **Purpose**: Authenticate a user with email and password
- **Permission**: PUBLIC
- **Required input**: `email` (string), `password` (string)
- **Output**: User profile `{ id, email, name, role }` on success; error message on failure
- **Errors**: Invalid credentials, network failure
- **State requirements**: None (available when logged out)
- **LLM Exposure**: Isolated from LLM function declarations for credential safety (UI-only auth)
- **Side effects**: Sets authentication state, exposes protected tools
- **Underlying API**: `POST /api/auth/login`

### `register`
- **Purpose**: Create a new user account
- **Permission**: PUBLIC
- **Required input**: `name` (string), `email` (string), `password` (string)
- **Output**: Newly created user profile on success
- **Errors**: Duplicate email, validation failure
- **State requirements**: None
- **LLM Exposure**: Isolated from LLM function declarations for credential safety (UI-only auth)
- **Side effects**: Creates user account, auto-login, exposes protected tools
- **Underlying API**: `POST /api/auth/register`

### `logout`
- **Purpose**: End the current user session
- **Permission**: AUTHENTICATED
- **Required input**: None
- **Output**: Logout confirmation
- **Errors**: None (always succeeds)
- **State requirements**: Must be authenticated
- **Side effects**: Clears auth state, hides protected tools, resets cart state
- **Underlying API**: `POST /api/auth/logout`

### `get_account_info`
- **Purpose**: Check current authentication status
- **Permission**: PUBLIC
- **Required input**: None
- **Output**: `{ authenticated: true, user }` or `{ authenticated: false }`
- **Errors**: Network failure
- **State requirements**: None
- **Side effects**: None (read-only)
- **Underlying API**: `GET /api/auth/me`

---

## Product Tools

### `search_products`
- **Purpose**: Search the product catalog by keyword
- **Permission**: PUBLIC
- **Required input**: `query` (string)
- **Optional input**: `limit` (integer, 1–50, default: 10)
- **Output**: Matching products with IDs, names, prices, ratings, stock
- **Errors**: Network failure
- **State requirements**: None
- **Side effects**: None (read-only)
- **Underlying API**: `GET /api/products?q=...&limit=...`

### `get_product_details`
- **Purpose**: Retrieve full details for a specific product
- **Permission**: PUBLIC
- **Required input**: `productId` (string)
- **Output**: Product specs, pricing, stock, reviews, category
- **Errors**: PRODUCT_NOT_FOUND
- **State requirements**: None
- **Side effects**: None (read-only)
- **Underlying API**: `GET /api/products/:id`

### `filter_products`
- **Purpose**: Filter catalog by criteria
- **Permission**: PUBLIC
- **Required input**: None (all params optional)
- **Optional input**: `category`, `brand`, `minPrice`, `maxPrice`, `minRating`, `inStockOnly`, `limit`
- **Output**: Filtered product list
- **Errors**: Network failure
- **State requirements**: None
- **Side effects**: None (read-only)
- **Underlying API**: `GET /api/products?category=...&brand=...`

### `sort_products`
- **Purpose**: Sort catalog by a criterion
- **Permission**: PUBLIC
- **Required input**: `sortBy` (enum: price_asc, price_desc, rating, popularity, newest, discount)
- **Optional input**: `category`, `query`, `limit`
- **Output**: Sorted product list
- **Errors**: Network failure
- **State requirements**: None
- **Side effects**: None (read-only)
- **Underlying API**: `GET /api/products?sort=...`

### `get_product_recommendations`
- **Purpose**: Get product recommendations
- **Permission**: PUBLIC
- **Required input**: None
- **Optional input**: `productId`, `category`, `limit`
- **Output**: Recommended products
- **Errors**: Network failure
- **State requirements**: None
- **Side effects**: None (read-only)
- **Underlying API**: `GET /api/products/recommendations`

### `compare_products`
- **Purpose**: Compare 2–4 products side by side
- **Permission**: PUBLIC
- **Required input**: `productIds` (array of strings)
- **Output**: Product comparison table
- **Errors**: Network failure
- **State requirements**: None
- **Side effects**: None (read-only)
- **Underlying API**: `GET /api/products/compare?ids=...`

### `check_product_stock`
- **Purpose**: Check real-time stock availability
- **Permission**: PUBLIC
- **Required input**: `productId` (string)
- **Output**: Stock count and status (IN_STOCK/LOW_STOCK/OUT_OF_STOCK)
- **Errors**: PRODUCT_NOT_FOUND
- **State requirements**: None
- **Side effects**: None (read-only)
- **Underlying API**: `GET /api/products/:id`

### `get_current_promotions`
- **Purpose**: Retrieve active promotions and coupons
- **Permission**: PUBLIC
- **Required input**: None
- **Output**: Featured products, discounted products, active coupon codes
- **Errors**: Network failure
- **State requirements**: None
- **Side effects**: None (read-only)
- **Underlying API**: `GET /api/products/promotions`

### `get_available_product_variants`
- **Purpose**: Retrieve product variant options (sizes, colorways, fits, fabrics)
- **Permission**: PUBLIC
- **Required input**: `productId` (string)
- **Output**: Base price, specs, available sizes, colors, and fit options
- **Errors**: PRODUCT_NOT_FOUND
- **State requirements**: None
- **Side effects**: None (read-only)
- **Underlying API**: `GET /api/products/:id`

---

## Apparel & Fashion Tools

### `filter_apparel`
- **Purpose**: Filter the apparel catalog by clothing-specific attributes (gender, category, color, size, price)
- **Permission**: PUBLIC
- **Optional input**:
  - `gender`: string enum ('Women', 'Men', 'All')
  - `category`: string enum ('Tops', 'T-Shirts', 'Jeans', 'All')
  - `color`: string enum ('Red', 'Blue', 'Green', 'Black', 'White', 'Indigo', 'All')
  - `size`: string ('XS', 'S', 'M', 'L', 'XL', '26', '28', '30', '32', '34')
  - `minPrice`: number
  - `maxPrice`: number
  - `inStockOnly`: boolean
  - `limit`: integer (1–50)
- **Output**: Matching apparel items with colors, sizes, fabric specs, prices, and stock status
- **Failure Mode Protections**: Blocks invalid gender/color combinations (e.g. Red for Men) with structured `COLOR_NOT_AVAILABLE_FOR_DEPARTMENT` error and suggested department colors
- **Underlying API**: `GET /api/products?gender=...&color=...&size=...`

### `get_apparel_size_guide`
- **Purpose**: Retrieve verified sizing charts, body measurements, and fit guidelines
- **Permission**: PUBLIC
- **Optional input**: `category` ('WomensTops', 'MensTshirts', 'WomensJeans', 'MensJeans', 'All')
- **Output**: Comprehensive measurement matrix (bust, chest, waist, hips, inseam) and fit recommendations
- **Failure Mode Protections**: Enables conversational agents to confirm user sizing prior to cart operations, mitigating returns
- **Underlying API**: Local authoritative sizing registry

---

## Cart Tools

### `add_to_cart`
- **Purpose**: Add a product to the user's cart
- **Permission**: AUTHENTICATED
- **Required input**: `productId` (string)
- **Optional input**: `quantity` (integer, min: 1, default: 1)
- **Output**: Updated cart with totals
- **Errors**: PRODUCT_NOT_FOUND, INSUFFICIENT_STOCK, EXCEEDS_STOCK
- **State requirements**: Must be authenticated
- **Side effects**: Adds item, updates cart state, may enable `create_order`
- **Underlying API**: `POST /api/cart`

### `get_cart`
- **Purpose**: View current cart contents
- **Permission**: AUTHENTICATED
- **Required input**: None
- **Output**: Line items, quantities, subtotal, discounts, shipping, tax, total
- **Errors**: Network failure
- **State requirements**: Must be authenticated
- **Side effects**: None (read-only)
- **Underlying API**: `GET /api/cart`

### `update_cart_quantity`
- **Purpose**: Change quantity of a cart item
- **Permission**: AUTHENTICATED
- **Required input**: `productId` (string), `quantity` (integer, min: 0)
- **Output**: Updated cart with totals
- **Errors**: PRODUCT_NOT_FOUND, INSUFFICIENT_STOCK, ITEM_NOT_IN_CART
- **State requirements**: Must be authenticated
- **Side effects**: Updates cart item quantity
- **Underlying API**: `PUT /api/cart`

### `remove_from_cart`
- **Purpose**: Remove an item from cart entirely
- **Permission**: AUTHENTICATED
- **Required input**: `productId` (string)
- **Output**: Updated cart with totals
- **Errors**: Network failure
- **State requirements**: Must be authenticated
- **Side effects**: Removes item, may disable `create_order` if cart becomes empty
- **Underlying API**: `DELETE /api/cart?productId=...`

### `clear_cart`
- **Purpose**: Empty the entire cart
- **Permission**: AUTHENTICATED
- **Required input**: None
- **Output**: Empty cart confirmation
- **Errors**: Network failure
- **State requirements**: Must be authenticated
- **Side effects**: Removes all items, disables `create_order`
- **Underlying API**: `DELETE /api/cart?clear=true`

### `apply_coupon`
- **Purpose**: Apply a promotional coupon code
- **Permission**: AUTHENTICATED
- **Required input**: `code` (string)
- **Output**: Recalculated cart with discount
- **Errors**: Invalid/expired coupon, minimum spend not met
- **State requirements**: Must be authenticated
- **Side effects**: Applies discount to cart totals
- **Underlying API**: `POST /api/coupons/apply`

---

## Wishlist Tools

### `add_to_wishlist`
- **Purpose**: Save a product to wishlist
- **Permission**: AUTHENTICATED
- **Required input**: `productId` (string)
- **Output**: Updated wishlist
- **Errors**: PRODUCT_NOT_FOUND, already in wishlist
- **State requirements**: Must be authenticated
- **Side effects**: Adds product to saved wishlist
- **Underlying API**: `POST /api/wishlist`

### `remove_from_wishlist`
- **Purpose**: Remove a product from wishlist
- **Permission**: AUTHENTICATED
- **Required input**: `productId` (string)
- **Output**: Updated wishlist
- **Errors**: Network failure
- **State requirements**: Must be authenticated
- **Side effects**: Removes product from wishlist
- **Underlying API**: `DELETE /api/wishlist?productId=...`

### `get_wishlist`
- **Purpose**: View saved wishlist
- **Permission**: AUTHENTICATED
- **Required input**: None
- **Output**: List of saved products
- **Errors**: Network failure
- **State requirements**: Must be authenticated
- **Side effects**: None (read-only)
- **Underlying API**: `GET /api/wishlist`

---

## Order Tools

### `get_order_history`
- **Purpose**: View user's order history
- **Permission**: AUTHENTICATED
- **Required input**: None
- **Output**: Orders with numbers, statuses, totals, dates
- **Errors**: Network failure
- **State requirements**: Must be authenticated
- **Side effects**: None (read-only)
- **Underlying API**: `GET /api/orders`

### `get_order_details`
- **Purpose**: View detailed order information
- **Permission**: AUTHENTICATED
- **Required input**: `orderId` (string)
- **Output**: Full order details, items, shipping address
- **Errors**: ORDER_NOT_FOUND, UNAUTHORIZED_ACCESS
- **State requirements**: Must be authenticated, must be order owner
- **Side effects**: None (read-only)
- **Underlying API**: `GET /api/orders/:id`

### `cancel_order`
- **Purpose**: Cancel an eligible order
- **Permission**: AUTHENTICATED
- **Required input**: `orderId` (string)
- **Optional input**: `reason` (string)
- **Output**: Cancellation result with previous/current status
- **Errors**: ORDER_NOT_FOUND, UNAUTHORIZED_ACCESS, NOT_CANCELLABLE, ALREADY_CANCELLED
- **State requirements**: Must be authenticated, order must be PENDING or PROCESSING
- **Side effects**: Changes order status to CANCELLED
- **Underlying API**: `POST /api/orders/:id/cancel`

### `create_order`
- **Purpose**: Place a demo order from cart contents
- **Permission**: TRANSACTIONAL
- **Availability**: CART_POPULATED
- **Required input**: `fullName`, `street`, `city`, `state`, `zipCode`, `confirmDemoOrder` (true)
- **Optional input**: `country`, `phone`, `couponCode`, `paymentMethod` (DEMO_CARD only)
- **Output**: Created order with number, status, total, items
- **Errors**: EMPTY_CART, DEMO_PAYMENT_ONLY, DEMO_ORDER_CONFIRMATION_REQUIRED
- **State requirements**: Must be authenticated, cart must have items
- **Side effects**: Creates order, clears cart, disables `create_order`
- **Underlying API**: `POST /api/orders`

---

## Shipping & Account Tools

### `get_shipping_estimate`
- **Purpose**: Estimate shipping costs
- **Permission**: PUBLIC
- **Required input**: `zipCode` (string)
- **Optional input**: `weight` (number), `items` (integer)
- **Output**: Standard, express, overnight options with rates and delivery windows
- **Errors**: Network failure
- **State requirements**: None
- **Side effects**: None (read-only)
- **Underlying API**: `POST /api/shipping/estimate`

### `get_saved_addresses`
- **Purpose**: View saved shipping addresses
- **Permission**: AUTHENTICATED
- **Required input**: None
- **Output**: Address list with default indicator
- **Errors**: Network failure
- **State requirements**: Must be authenticated
- **Side effects**: None (read-only)
- **Underlying API**: `GET /api/addresses`

### `update_shipping_address`
- **Purpose**: Add or update a shipping address
- **Permission**: AUTHENTICATED
- **Required input**: `fullName`, `street`, `city`, `state`, `zipCode`
- **Optional input**: `addressId` (to update), `country`, `phone`, `isDefault`
- **Output**: Created or updated address
- **Errors**: Network failure
- **State requirements**: Must be authenticated
- **Side effects**: Creates or updates address record
- **Underlying API**: `POST /api/addresses` or `PUT /api/addresses`

---

## Navigation Tools

### `navigate_to_page`
- **Purpose**: Navigate the user's browser to an allowed store page with proper authorization, state validation, and flow controls
- **Permission**: PUBLIC (enforces auth/cart gates for protected destinations)
- **Required input**: `page` ('home' | 'products' | 'product_detail' | 'compare' | 'cart' | 'checkout' | 'account' | 'orders' | 'wishlist')
- **Optional input**: `productId` (for product_detail), `productIds` (for compare), `category`, `searchQuery`, `view` ('auto' | 'parallel' | 'serial')
- **Output**: `{ success: true, navigatedTo: url, page, message }`
- **Errors**: INVALID_INPUT (unlisted page or missing productId), AUTHENTICATION_REQUIRED (checkout/account/orders/wishlist without login), CART_EMPTY (checkout with empty cart)
- **State requirements**: Destination-dependent
- **Side effects**: Dispatches `webmcp-navigation` browser event; triggers Next.js client-side navigation
- **Underlying API**: Browser navigation / Next.js client router

### `view_product_page`
- **Purpose**: Directly navigate the user's browser to a specific product detail page to display photos, specifications, and customer reviews
- **Permission**: PUBLIC
- **Required input**: `productId` (string)
- **Output**: `{ success: true, navigatedTo: url, productId, message }`
- **Errors**: INVALID_INPUT (missing or invalid productId)
- **State requirements**: None
- **Side effects**: Dispatches `webmcp-navigation` browser event; loads `/products/{productId}`
- **Underlying API**: Browser navigation / Next.js client router

### `view_comparison_page`
- **Purpose**: Directly navigate the user's browser to the product comparison page to compare 2 to 4 luxury garments side-by-side (parallel) or stacked (serial)
- **Permission**: PUBLIC
- **Required input**: `productIds` (array of strings, min 2 products)
- **Optional input**: `view` ('auto' | 'parallel' | 'serial')
- **Output**: `{ success: true, navigatedTo: url, productCount, view, message }`
- **Errors**: INVALID_INPUT (fewer than 2 product IDs)
- **State requirements**: None
- **Side effects**: Dispatches `webmcp-navigation` browser event; loads `/compare?ids=...&view=...`
- **Underlying API**: Browser navigation / Next.js client router

---

## Apparel & Fashion Tools

### `filter_apparel`
- **Purpose**: Filter fashion catalog by clothing attributes: gender, category, color, size, and price
- **Permission**: PUBLIC
- **Required input**: None (all parameters optional)
- **Optional input**: `gender` ('Women' | 'Men' | 'All'), `category` ('Tops' | 'T-Shirts' | 'Jeans' | 'All'), `color` ('Red' | 'Blue' | 'Green' | 'Black' | 'White' | 'Indigo' | 'All'), `size` (string), `minPrice` (number), `maxPrice` (number), `inStockOnly` (boolean), `limit` (integer, 1–50)
- **Output**: List of matching garments with colors, available sizes, fabric compositions, prices, and stock
- **Errors**: `COLOR_NOT_AVAILABLE_FOR_DEPARTMENT` (prevents selecting Red or Green for Men; provides suggested available palettes)
- **State requirements**: None
- **Side effects**: None (read-only)
- **Underlying API**: `GET /api/products?gender=...&color=...`

### `get_apparel_size_guide`
- **Purpose**: Retrieve verified atelier size charts, fit recommendations, and body measurements (bust, chest, waist, hips, inseam)
- **Permission**: PUBLIC
- **Required input**: None
- **Optional input**: `category` ('WomensTops' | 'MensTshirts' | 'WomensJeans' | 'MensJeans' | 'All')
- **Output**: Detailed size chart tables, measurements in inches and cm, and fabric-specific fit advice
- **Errors**: None (returns default guide if unlisted)
- **State requirements**: None
- **Side effects**: None (read-only)
- **Underlying API**: Native WebMCP in-memory verified sizing matrix

