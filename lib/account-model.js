export const CUSTOMER_MODEL = {
  customer_id: 'cust_demo_001',
  email: 'buyer@example.com',
  stripe_customer_id: null,
  created_at: '2026-04-21T00:00:00Z',
  updated_at: '2026-04-21T00:00:00Z'
};

export const SAVED_CARS_MODEL = [
  {
    saved_car_id: 'car_001',
    customer_id: 'cust_demo_001',
    vin: 'WBA8B9G59JNU12345',
    listing_url: 'https://example.com/listing/bmw-340i',
    asking_price: 28400,
    mileage: 61240,
    label: 'Current shortlist car',
    verdict: 'Verify Further',
    confidence_score: 74,
    created_at: '2026-04-21T00:00:00Z',
    updated_at: '2026-04-21T00:00:00Z'
  }
];
