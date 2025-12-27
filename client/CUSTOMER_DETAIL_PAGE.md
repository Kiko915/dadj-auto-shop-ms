# Customer Detail Page Implementation

## Overview
The Customer Detail Page (`/dashboard/customers/[id]`) provides a comprehensive view of individual customer information organized into three main tabs for efficient staff use.

## File Structure
```
client/src/
├── pages/dashboard/customers/
│   └── [id].vue                 # Main customer detail page
├── api/
│   ├── customers.js             # Customer API functions
│   ├── vehicles.js              # Vehicle API functions (NEW)
│   └── serviceOrders.js         # Service order API functions (NEW)
└── router/
    └── index.js                 # Updated with customer detail route
```

## Page Structure

### Route
- **Path**: `/dashboard/customers/:id`
- **Name**: `customer-detail`
- **Auth Required**: Yes
- **Access**: Staff, Admin

### Navigation
- Clicking the eye icon (View button) in the Customer table navigates to this page
- Back button returns to the customer list (`/dashboard/customers`)

## Tab Layout

The page uses a multi-tabbed interface with three main sections:

### 1. General Info Tab
**Purpose**: Display complete customer profile and metrics

**Content**:
- **Profile Header**:
  - Profile image (avatar with initials fallback)
  - Full name with loyalty status badge
  - Phone number and email address
  - Quick metrics: Total Vehicles, Service Count, Total Spent

- **Personal Details Section**:
  - First Name
  - Last Name
  - Middle Name (if provided)
  - Suffix (if provided)

- **Contact Information Section**:
  - Phone Number
  - Email Address

- **Customer Metrics** (3 metric cards):
  - Registered Vehicles (with car icon)
  - Service Count (with package icon)
  - Total Spent in PHP currency (with dollar sign icon)

- **Notes Section**:
  - Display customer notes if available

- **Timestamps**:
  - Customer Since (dateCreated)
  - Last Modified (lastModified)

**Actions**:
- **Edit Profile** button - Navigates to edit customer page
- **New Service Order** button - Starts a new service order for this customer

### 2. Vehicles Tab
**Purpose**: Manage customer's registered vehicles

**Content**:
- **Registered Vehicles Table**:
  - License Plate
  - Make & Model
  - Year
  - Type (Sedan, SUV, etc.)
  - Mileage (in kilometers)
  - Actions (View Details button)

**Empty State**:
- Shows when customer has no vehicles
- Displays car icon, message, and "Add First Vehicle" button

**Actions**:
- **Add New Vehicle** button (top right) - Opens vehicle form
- **View Details** button per vehicle - View specific vehicle details

### 3. Service History Tab
**Purpose**: Display complete transaction history

**Content**:
- **Transaction History Table**:
  - Date (formatted)
  - Vehicle (with license plate)
  - Total Amount (in PHP currency)
  - Payment Status (badge: Paid/Outstanding/Partial)
  - Actions (View Receipt button)

**Empty State**:
- Shows when customer has no service history
- Displays history icon, message, and "Create First Service Order" button

**Actions**:
- **View Receipt** button per service - View service order details/receipt

## Features

### Visual Design
- **Color-coded Loyalty Badges**:
  - VIP: Purple (`bg-purple-100 text-purple-800`)
  - Loyal: Amber (`bg-amber-100 text-amber-800`)
  - Regular: Gray (default)

- **Metric Cards**: Individual cards with icons showing key customer statistics

- **Responsive Layout**: Grid-based layout that adapts to screen size

### Loading States
- Skeleton loaders shown while fetching data
- Graceful error handling with toast notifications
- Empty states for tabs with no data

### Data Formatting
- **Currency**: PHP format with thousand separators (₱5,000.00)
- **Dates**: Short format (Oct 15, 2025)
- **Customer ID**: Truncated with ellipsis for readability

## API Integration

### Endpoints Used

1. **Get Customer**
   - `GET /api/customers/:id`
   - Returns: Customer object with all details

2. **Get Customer Vehicles** (NEW)
   - `GET /api/customers/:customerId/vehicles`
   - Returns: Array of vehicles for the customer

3. **Get Customer Service Orders** (NEW)
   - `GET /api/customers/:customerId/service-orders`
   - Returns: Array of service orders for the customer

### API Files Created

#### `vehicles.js`
New API functions for vehicle management:
- `getCustomerVehicles(customerId)` - Fetch all vehicles for a customer
- `getVehicle(vehicleId)` - Get single vehicle details
- `createVehicle(vehicleData)` - Create new vehicle
- `updateVehicle(vehicleId, vehicleData)` - Update vehicle
- `deleteVehicle(vehicleId)` - Delete vehicle

#### `serviceOrders.js`
New API functions for service order management:
- `getServiceOrders()` - Get all service orders
- `getCustomerServiceOrders(customerId)` - Get customer's service orders
- `getServiceOrder(serviceOrderId)` - Get single service order
- `createServiceOrder(serviceOrderData)` - Create new service order
- `updateServiceOrder(serviceOrderId, serviceOrderData)` - Update service order
- `deleteServiceOrder(serviceOrderId)` - Delete service order

## TypeScript Types

```typescript
type Customer = {
  id: string
  firstName: string
  lastName: string
  middleName?: string | null
  suffix?: string | null
  phoneNumber: string
  email: string
  profilePicture?: string | null
  loyaltyStatus: 'Loyal' | 'Regular' | 'VIP'
  totalVehicles: number
  serviceCount: number
  totalSpent: number
  notes?: string | null
  dateCreated: string
  lastModified: string
}

type Vehicle = {
  id: string
  licensePlate: string
  make: string
  model: string
  year?: number
  vehicleType?: string
  mileage?: number
}

type ServiceRecord = {
  id: string
  date: string
  vehicleId: string
  vehicleName: string
  totalAmount: number
  paymentStatus: 'Paid' | 'Outstanding' | 'Partial'
}
```

## UI Components Used

### shadcn-vue Components
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` - Tab navigation
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` - Card layouts
- `Button` - All action buttons
- `Badge` - Status indicators
- `Avatar`, `AvatarFallback`, `AvatarImage` - Profile image
- `Skeleton` - Loading states
- `Separator` - Visual dividers

### lucide-vue-next Icons
- `User` - General info tab icon
- `Car` - Vehicles tab icon and metrics
- `History` - Service history tab icon
- `Phone`, `Mail` - Contact info icons
- `Edit` - Edit profile button
- `Plus` - Add/create buttons
- `Receipt` - View receipt button
- `ArrowLeft` - Back navigation
- `DollarSign` - Total spent metric
- `Package` - Service count metric

## Navigation Flow

```
Customer List (/dashboard/customers)
    ↓ [Click View Button]
Customer Detail (/dashboard/customers/:id)
    ↓ [Click Edit Profile]
Edit Customer (/dashboard/customers/:id/edit)
    OR
    ↓ [Click New Service Order]
New Service Order (/dashboard/service-orders/new?customerId=:id)
    OR
    ↓ [Click Add New Vehicle]
Add Vehicle (/dashboard/customers/:id/vehicles/new)
    OR
    ↓ [Click View Receipt]
Service Order Detail (/dashboard/service-orders/:serviceId)
```

## Error Handling

### Customer Not Found
- Displays error toast: "Failed to load customer details"
- Automatically redirects to customer list
- Logs error to console

### Partial Data Failures
- Vehicles fetch failure: Shows empty state, logs warning
- Service history fetch failure: Shows empty state, logs warning
- Customer still displays even if related data fails

### Network Errors
- Toast notifications for user feedback
- Console logging for debugging
- Graceful fallbacks to empty states

## Future Enhancements

### Backend Requirements
The following backend endpoints need to be implemented:

1. **Vehicle Endpoints**:
   - `GET /api/customers/:customerId/vehicles`
   - `GET /api/vehicles/:vehicleId`
   - `POST /api/vehicles`
   - `PUT /api/vehicles/:vehicleId`
   - `DELETE /api/vehicles/:vehicleId`

2. **Service Order Endpoints**:
   - `GET /api/customers/:customerId/service-orders`
   - `GET /api/service-orders/:serviceOrderId`
   - `POST /api/service-orders`
   - `PUT /api/service-orders/:serviceOrderId`
   - `DELETE /api/service-orders/:serviceOrderId`

3. **Edit Customer Page**:
   - Route: `/dashboard/customers/:id/edit`
   - Reuse customer form component with pre-filled data

4. **Add Vehicle Page**:
   - Route: `/dashboard/customers/:id/vehicles/new`
   - Create vehicle form component

5. **Service Order Pages**:
   - Route: `/dashboard/service-orders/new`
   - Route: `/dashboard/service-orders/:id`

## Testing Checklist

- [ ] Navigate to customer detail from customer list
- [ ] Verify all three tabs display correctly
- [ ] Check loading states appear while fetching data
- [ ] Verify customer information displays in General Info tab
- [ ] Test loyalty badge colors (VIP, Loyal, Regular)
- [ ] Verify metrics display correct values
- [ ] Test Edit Profile button navigation
- [ ] Test New Service Order button navigation
- [ ] Check vehicles table displays correctly (or empty state)
- [ ] Test Add New Vehicle button
- [ ] Check service history table displays correctly (or empty state)
- [ ] Test View Receipt button for each service
- [ ] Verify back button returns to customer list
- [ ] Test error handling with invalid customer ID
- [ ] Verify responsive layout on different screen sizes
- [ ] Test currency and date formatting

## Summary

The Customer Detail Page provides a comprehensive, organized view of customer information with:
- ✅ Multi-tabbed interface for easy navigation
- ✅ Complete customer profile with metrics
- ✅ Vehicle management interface
- ✅ Service history tracking
- ✅ Responsive design with loading and error states
- ✅ Type-safe implementation with TypeScript
- ✅ Integrated with existing customer list
- ✅ Ready for backend API integration

**Total Lines of Code**: ~650 lines
**Components Created**: 1 page component
**API Files Created**: 2 new API modules
**Router Updates**: 1 new route added
