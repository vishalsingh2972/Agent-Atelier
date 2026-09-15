import { NextRequest, NextResponse } from 'next/server';

// POST /api/shipping/estimate — Estimate shipping cost and delivery time
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { zipCode, weight, items } = body;

  if (!zipCode) {
    return NextResponse.json(
      { success: false, error: 'VALIDATION_ERROR', message: 'Destination ZIP code is required.' },
      { status: 400 }
    );
  }

  // Realistic shipping estimate logic based on zip code region
  const zip = parseInt(zipCode, 10);
  let region = 'domestic';
  let baseRate = 5.99;
  let estimatedDays = { min: 3, max: 5 };

  // West Coast (90000–96999)
  if (zip >= 90000 && zip <= 96999) {
    region = 'west_coast';
    baseRate = 7.99;
    estimatedDays = { min: 3, max: 5 };
  }
  // Midwest (40000–62999)
  else if (zip >= 40000 && zip <= 62999) {
    region = 'midwest';
    baseRate = 5.99;
    estimatedDays = { min: 2, max: 4 };
  }
  // East Coast (01000–34999)
  else if (zip >= 1000 && zip <= 34999) {
    region = 'east_coast';
    baseRate = 6.99;
    estimatedDays = { min: 2, max: 4 };
  }
  // South (35000–39999, 70000–79999)
  else if ((zip >= 35000 && zip <= 39999) || (zip >= 70000 && zip <= 79999)) {
    region = 'south';
    baseRate = 6.49;
    estimatedDays = { min: 3, max: 5 };
  }
  // Alaska/Hawaii (96700+, 99500+)
  else if (zip >= 96700 || zip >= 99500) {
    region = 'remote';
    baseRate = 14.99;
    estimatedDays = { min: 7, max: 12 };
  }

  // Weight surcharge
  const itemWeight = weight || (items ? items * 1.5 : 2.0);
  const weightSurcharge = itemWeight > 5 ? Math.ceil((itemWeight - 5) / 5) * 2.5 : 0;

  const standardRate = parseFloat((baseRate + weightSurcharge).toFixed(2));
  const expressRate = parseFloat((standardRate * 2.2).toFixed(2));
  const overnightRate = parseFloat((standardRate * 4.5).toFixed(2));

  const today = new Date();
  const standardDelivery = {
    min: new Date(today.getTime() + estimatedDays.min * 86400000).toISOString().split('T')[0],
    max: new Date(today.getTime() + estimatedDays.max * 86400000).toISOString().split('T')[0],
  };
  const expressDelivery = {
    min: new Date(today.getTime() + 1 * 86400000).toISOString().split('T')[0],
    max: new Date(today.getTime() + 2 * 86400000).toISOString().split('T')[0],
  };
  const overnightDelivery = {
    date: new Date(today.getTime() + 1 * 86400000).toISOString().split('T')[0],
  };

  // Free shipping threshold
  const freeShippingThreshold = 75.0;

  return NextResponse.json({
    success: true,
    destination: { zipCode, region },
    estimatedWeight: itemWeight,
    freeShippingThreshold,
    options: [
      {
        method: 'STANDARD',
        label: 'Standard Shipping',
        rate: standardRate,
        deliveryWindow: `${standardDelivery.min} to ${standardDelivery.max}`,
        estimatedDays: `${estimatedDays.min}-${estimatedDays.max} business days`,
      },
      {
        method: 'EXPRESS',
        label: 'Express Shipping',
        rate: expressRate,
        deliveryWindow: `${expressDelivery.min} to ${expressDelivery.max}`,
        estimatedDays: '1-2 business days',
      },
      {
        method: 'OVERNIGHT',
        label: 'Overnight Delivery',
        rate: overnightRate,
        deliveryWindow: overnightDelivery.date,
        estimatedDays: 'Next business day',
      },
    ],
  });
}
