import { ref } from 'vue'
import { defineStore } from 'pinia'

const seedCustomers = [
  {
    id: 'cust-1',
    name: 'Isabella Cortez',
    phoneNumber: '+63 917 555 2101',
    emailAddress: 'isabella.cortez@example.com',
    loyaltyStatus: 'Loyal',
    totalVehicles: 4
  },
  
]

export const useCustomersStore = defineStore('customers', () => {
  const customers = ref([...seedCustomers])

  const addCustomer = (customer) => {
    customers.value.push(customer)
  }

  return {
    customers,
    addCustomer
  }
})
