import { prisma } from '../db';
import { getUserCart, clearCart } from './cartService';
import { validateCoupon } from './couponService';

export interface CreateOrderInput {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  phone?: string;
  couponCode?: string;
  paymentMethod?: string;
}

export async function getUserOrders(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    subtotal: order.subtotal,
    discount: order.discount,
    shippingFee: order.shippingFee,
    total: order.total,
    couponCode: order.couponCode,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
    itemCount: order.items.reduce((acc, i) => acc + i.quantity, 0),
    items: order.items,
    shippingAddress: typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : order.shippingAddress,
    isCancellable: order.status === 'PENDING' || order.status === 'PROCESSING',
  }));

  return {
    success: true,
    orders: formatted,
  };
}

export async function getOrderDetails(userId: string, orderIdentifier: string) {
  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: orderIdentifier }, { orderNumber: orderIdentifier }],
    },
    include: {
      items: {
        include: {
          product: {
            select: { slug: true, category: { select: { name: true } } },
          },
        },
      },
    },
  });

  if (!order) {
    return {
      success: false,
      error: 'ORDER_NOT_FOUND',
      message: `Order "${orderIdentifier}" not found.`,
    };
  }

  // Security & Authorization verification
  if (order.userId !== userId) {
    return {
      success: false,
      error: 'UNAUTHORIZED_ACCESS',
      message: 'You do not have permission to view this order.',
    };
  }

  return {
    success: true,
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: order.subtotal,
      discount: order.discount,
      shippingFee: order.shippingFee,
      total: order.total,
      couponCode: order.couponCode,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      shippingAddress: typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : order.shippingAddress,
      isCancellable: order.status === 'PENDING' || order.status === 'PROCESSING',
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        productSlug: item.product?.slug,
      })),
    },
  };
}

export async function cancelOrder(userId: string, orderIdentifier: string, reason?: string) {
  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: orderIdentifier }, { orderNumber: orderIdentifier }],
    },
  });

  if (!order) {
    return {
      success: false,
      error: 'ORDER_NOT_FOUND',
      message: `Order "${orderIdentifier}" not found.`,
    };
  }

  // Verify ownership
  if (order.userId !== userId) {
    return {
      success: false,
      error: 'UNAUTHORIZED_ACCESS',
      message: 'You do not have permission to cancel this order.',
    };
  }

  // Check state eligibility
  if (order.status === 'CANCELLED') {
    return {
      success: false,
      error: 'ALREADY_CANCELLED',
      message: 'This order has already been cancelled.',
    };
  }

  if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
    return {
      success: false,
      error: 'NOT_CANCELLABLE',
      message: `Order cannot be cancelled because its status is "${order.status}". Items that are shipped or delivered must follow the return process.`,
    };
  }

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'CANCELLED',
    },
  });

  return {
    success: true,
    message: `Order ${updatedOrder.orderNumber} was cancelled successfully.`,
    orderId: updatedOrder.id,
    orderNumber: updatedOrder.orderNumber,
    previousStatus: order.status,
    currentStatus: 'CANCELLED',
    cancellationReason: reason || 'Customer requested cancellation',
  };
}

export async function createOrder(userId: string, input: CreateOrderInput) {
  let discountPercent = 0;
  if (input.couponCode) {
    const couponValidation = await validateCoupon(input.couponCode);
    if (couponValidation.valid && couponValidation.coupon) {
      discountPercent = couponValidation.coupon.discountPercent;
    }
  }

  const cart = await getUserCart(userId, discountPercent);

  if (!cart.items || cart.items.length === 0) {
    return {
      success: false,
      error: 'EMPTY_CART',
      message: 'Cannot place an order with an empty cart. Please add items to your cart first.',
    };
  }

  // Generate unique order number (e.g. ORD-618492)
  const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

  const shippingAddressObj = {
    fullName: input.fullName,
    street: input.street,
    city: input.city,
    state: input.state,
    zipCode: input.zipCode,
    country: input.country || 'United States',
    phone: input.phone || '',
  };

  const newOrder = await prisma.order.create({
    data: {
      orderNumber,
      userId,
      status: 'PROCESSING',
      subtotal: cart.subtotal,
      discount: cart.couponDiscount,
      shippingFee: cart.shippingFee,
      total: cart.estimatedTotal,
      shippingAddress: JSON.stringify(shippingAddressObj),
      paymentMethod: input.paymentMethod || 'DEMO_CARD',
      paymentStatus: 'COMPLETED',
      couponCode: input.couponCode || null,
      items: {
        create: cart.items.map((item) => ({
          productId: item.productId,
          productName: item.product.name,
          price: item.product.discountedPrice,
          quantity: item.quantity,
          image: item.product.image,
        })),
      },
    },
    include: {
      items: true,
    },
  });

  // Clear user's cart
  await clearCart(userId);
  const clearedCart = await getUserCart(userId);

  return {
    success: true,
    message: `Order ${orderNumber} created successfully!`,
    orderId: newOrder.id,
    orderNumber: newOrder.orderNumber,
    status: newOrder.status,
    total: newOrder.total,
    itemCount: newOrder.items.reduce((acc, i) => acc + i.quantity, 0),
    items: newOrder.items,
    shippingAddress: shippingAddressObj,
    createdAt: newOrder.createdAt,
    cart: clearedCart,
  };
}
