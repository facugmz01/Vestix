export enum DeliveryStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_TRANSIT = 'IN_TRANSIT',
  ARRIVED = 'ARRIVED',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
}

export enum ValidationMethod {
  OTP = 'OTP',
  MANUAL = 'MANUAL',
  CUSTOMER_CONFIRM = 'CUSTOMER_CONFIRM',
  GEOFENCE = 'GEOFENCE',
  PHOTO = 'PHOTO',
}

export enum ValidationStatus {
  PENDING = 'PENDING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
}
