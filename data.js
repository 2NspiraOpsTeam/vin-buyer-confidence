window.PROTOTYPE_DATA = {
  meta: {
    name: 'vehicle-intelligence-seed',
    last_updated: '2026-04-20'
  },
  case: {
    case_id: 'case_proto_001',
    customer_name: 'Prototype Customer',
    vehicle: {
      vin: 'WBA8B9G59JNU12345',
      year: 2018,
      make: 'BMW',
      model: '340i xDrive'
    },
    listing_url: 'https://example.com/listing/340i-demo',
    asking_price: 28995,
    mileage_claimed: 72105,
    seller_type: 'dealer',
    customer_primary_concern: 'I want to know if this is really a well-optioned clean car and whether I should pay for a PPI.',
    status: 'prototype'
  },
  verdict: {
    verdict_type: 'verify_further',
    verdict_label: 'Verify Further',
    summary: 'Worth pursuing only if the seller provides stronger evidence before PPI.',
    rationale: 'The vehicle appears plausible overall, but important uncertainties remain around listing claims and support documentation.'
  },
  scores: [
    { score_type: 'overall_confidence_score', score_value: 72, scale_max: 100, explanation: 'Good enough to continue investigating, not strong enough to commit yet.' },
    { score_type: 'build_authenticity_score', score_value: 78, scale_max: 100, explanation: 'Core build appears plausible, but some claimed options remain unverified.' },
    { score_type: 'ownership_risk_score', score_value: 58, scale_max: 100, explanation: 'Ownership risk is moderate due to incomplete service support.' },
    { score_type: 'price_sanity_score', score_value: 69, scale_max: 100, explanation: 'Price appears fair if seller evidence strengthens.' }
  ],
  findings: [
    {
      finding_type: 'listing_claim_mismatch',
      severity: 'medium',
      title: 'Claimed features need stronger evidence',
      explanation: 'Some advertised feature claims are not yet strongly supported by the currently available evidence.'
    },
    {
      finding_type: 'service_history_gap',
      severity: 'medium',
      title: 'Service confidence is thinner than ideal for asking price',
      explanation: 'The currently available service evidence is not strong enough to treat the listing as low-risk without follow-up questions.'
    },
    {
      finding_type: 'core_spec_plausible',
      severity: 'low',
      title: 'Core vehicle identity appears plausible',
      explanation: 'Available identifying details align well enough to continue review.'
    }
  ],
  seller_questions: [
    {
      priority: 1,
      question_text: 'Can you send close photos or a quick walkaround video that clearly shows the claimed options, trim details, and interior features?',
      reason: 'the listing claims higher-value features that are not yet clearly supported by the current photos.'
    },
    {
      priority: 2,
      question_text: 'What major maintenance has been completed in the last 20,000 miles, and do you have invoices or timestamps for that work?',
      reason: 'service support is thinner than ideal for the asking price, which raises ownership-risk questions.'
    },
    {
      priority: 3,
      question_text: 'Do you have receipts for cooling-system work, brakes, suspension, tires, or other common wear items?',
      reason: 'those records would materially improve confidence in the condition story and help justify the price.'
    },
    {
      priority: 4,
      question_text: 'Can you send a cold-start video and a slow exterior/interior walkaround before I decide on a PPI or travel?',
      reason: 'remote condition clues can help confirm whether this car is worth the next spend.'
    }
  ],
  evidence_timeline: [
    {
      date: '2024-11-15',
      type: 'listing_history',
      title: 'Vehicle appeared in dealer listing history',
      detail: 'Historical listing record shows asking price around $31,900 with mileage near 69k.',
      confidence: 'medium'
    },
    {
      date: '2025-01-08',
      type: 'mileage_signal',
      title: 'Mileage progression appears plausible',
      detail: 'Observed mileage progression does not currently show an obvious rollback pattern.',
      confidence: 'medium'
    },
    {
      date: '2026-04-20',
      type: 'listing_review',
      title: 'Current listing reviewed for option and photo consistency',
      detail: 'Core identity appears plausible, but some higher-value feature claims remain weakly supported.',
      confidence: 'medium'
    },
    {
      date: '2026-04-20',
      type: 'service_signal',
      title: 'Service support judged thinner than ideal',
      detail: 'Current evidence does not strongly support a low-risk ownership story at this price.',
      confidence: 'medium'
    }
  ],
  source_summary: [
    {
      source: 'VIN identity source',
      role: 'vehicle identity',
      status: 'Confirmed: core vehicle identity aligns with the VIN-backed data available today.',
      confidence: 'high'
    },
    {
      source: 'Listing history source',
      role: 'price and mileage history',
      status: 'Partial: useful for pricing and timeline context, but not strong enough on its own to prove title or condition claims.',
      confidence: 'medium'
    },
    {
      source: 'Seller listing',
      role: 'feature and condition claims',
      status: 'Needs verification: seller-provided claims are useful leads, but they should not be treated as confirmed until backed by stronger evidence.',
      confidence: 'low'
    }
  ]
};
