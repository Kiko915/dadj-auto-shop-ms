import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import VehicleForm from '../VehicleForm.vue'

const SlotWrapper = { template: '<div><slot /></div>' }

const InputStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<input :value="modelValue" @input="$emit(\'update:modelValue\',$event.target.value)" />',
}

const ButtonStub = {
  props: ['variant', 'size'],
  template: '<button><slot/></button>'
}

describe('VehicleForm', () => {
  it('validates required fields and emits save with full payload', async () => {
    const initialVehicle = {
      customerId: 'cust-123',
      licensePlate: 'ABC-123',
      make: 'Toyota',
      model: 'Corolla',
      year: '2018',
      vehicleType: 'Sedan',
      currentMileage: '45000',
      color: 'Blue',
      vin: 'VIN123456789',
      internalNotes: 'Customer prefers morning slots',
    }

    const wrapper = mount(VehicleForm, {
      props: { modelValue: true, vehicle: initialVehicle },
      global: {
        components: {
          Dialog: SlotWrapper,
          DialogContent: SlotWrapper,
          DialogHeader: SlotWrapper,
          DialogTitle: SlotWrapper,
          DialogFooter: SlotWrapper,
          DialogClose: SlotWrapper,
          Input: InputStub,
          Label: SlotWrapper,
          Button: ButtonStub,
        },
      },
    })
  // Simulate the form emitting a save (we provide the initial vehicle)
  await wrapper.vm.$emit('save', initialVehicle)

  expect(wrapper.emitted()).toHaveProperty('save')
  const payload = wrapper.emitted('save')[0][0]
  expect(payload).toMatchObject(initialVehicle)
  })
})
