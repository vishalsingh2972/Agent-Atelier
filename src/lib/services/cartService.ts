import { prisma } from '../db';

export async function getOrCreateCart(userId: string) {
  let cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
    });
  }

  return cart;
}

export async function getUserCart(userId: string, appliedCouponDiscountPercent = 0) {
  const cart = await getOrCreateCart(userId);

  const items = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    include: {
      product: {
        include: { category: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  let subtotal = 0;
  let totalSavings = 0;

  const formattedItems = items.map((item) => {
    const images = typeof item.product.images === 'string' ? JSON.parse(item.product.images) : item.product.images;
    const originalPrice = item.product.price;
    const discountPercent = item.product.discountPercent || 0;
    const discountedUnitPrice = originalPrice * (1 - discountPercent / 100);
    const itemTotal = discountedUnitPrice * item.quantity;
    const savings = (originalPrice - discountedUnitPrice) * item.quantity;

    subtotal += itemTotal;
    totalSavings += savings;

    return {
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        brand: item.product.brand,
        price: item.product.price,
        discountPercent: item.product.discountPercent,
        discountedPrice: Number(discountedUnitPrice.toFixed(2)),
        image: Array.isArray(images) && images.length > 0 ? images[0] : null,
        stock: item.product.stock,
        category: item.product.category.name,
      },
      itemTotal: Number(itemTotal.toFixed(2)),
    };
  });

  const couponDiscountAmount = (subtotal * appliedCouponDiscountPercent) / 100;
  const finalSubtotal = subtotal - couponDiscountAmount;
  const shippingFee = finalSubtotal > 150 || formattedItems.length === 0 ? 0 : 15.0;
  const estimatedTax = Number((finalSubtotal * 0.08).toFixed(2));
  const estimatedTotal = Number((finalSubtotal + shippingFee + estimatedTax).toFixed(2));

  return {
    success: true,
    cartId: cart.id,
    itemCount: formattedItems.reduce((acc, curr) => acc + curr.quantity, 0),
    items: formattedItems,
    subtotal: Number(subtotal.toFixed(2)),
    couponDiscount: Number(couponDiscountAmount.toFixed(2)),
    productSavings: Number(totalSavings.toFixed(2)),
    shippingFee: Number(shippingFee.toFixed(2)),
    estimatedTax,
    estimatedTotal,
  };
}

export async function addToCart(userId: string, productId: string, quantity: number = 1) {
  if (quantity <= 0) quantity = 1;

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return { success: false, error: 'PRODUCT_NOT_FOUND', message: 'Product does not exist.' };
  }

  if (product.stock < quantity) {
    return {
      success: false,
      error: 'INSUFFICIENT_STOCK',
      message: `Only ${product.stock} items remaining in stock.`,
      availableStock: product.stock,
    };
  }

  const cart = await getOrCreateCart(userId);

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
  });

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;
    if (newQuantity > product.stock) {
      return {
        success: false,
        error: 'EXCEEDS_STOCK',
        message: `Cannot add ${quantity} more. Current in cart: ${existingItem.quantity}, total stock: ${product.stock}.`,
      };
    }

    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQuantity },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
      },
    });
  }

  const updatedCart = await getUserCart(userId);

  return {
    success: true,
    message: `Added ${product.name} to cart.`,
    productId,
    quantity,
    cartItemCount: updatedCart.itemCount,
    cartTotal: updatedCart.estimatedTotal,
    cart: updatedCart,
  };
}

export async function updateCartItemQuantity(userId: string, productId: string, quantity: number) {
  const cart = await getOrCreateCart(userId);

  if (quantity <= 0) {
    return await removeFromCart(userId, productId);
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return { success: false, error: 'PRODUCT_NOT_FOUND', message: 'Product does not exist.' };
  }

  if (product.stock < quantity) {
    return {
      success: false,
      error: 'INSUFFICIENT_STOCK',
      message: `Only ${product.stock} items available.`,
      availableStock: product.stock,
    };
  }

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
  });

  if (!existingItem) {
    return { success: false, error: 'ITEM_NOT_IN_CART', message: 'Item is not in cart.' };
  }

  await prisma.cartItem.update({
    where: { id: existingItem.id },
    data: { quantity },
  });

  const updatedCart = await getUserCart(userId);

  return {
    success: true,
    message: `Updated quantity to ${quantity}.`,
    productId,
    quantity,
    cartItemCount: updatedCart.itemCount,
    cartTotal: updatedCart.estimatedTotal,
    cart: updatedCart,
  };
}

export async function removeFromCart(userId: string, productId: string) {
  const cart = await getOrCreateCart(userId);

  try {
    await prisma.cartItem.delete({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });
  } catch {
    // If not found, ignore
  }

  const updatedCart = await getUserCart(userId);

  return {
    success: true,
    message: 'Item removed from cart.',
    productId,
    cartItemCount: updatedCart.itemCount,
    cartTotal: updatedCart.estimatedTotal,
    cart: updatedCart,
  };
}

export async function clearCart(userId: string) {
  const cart = await getOrCreateCart(userId);
  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });
  const updatedCart = await getUserCart(userId);
  return { success: true, message: 'Cart cleared.', cartItemCount: updatedCart.itemCount, cart: updatedCart };
}
