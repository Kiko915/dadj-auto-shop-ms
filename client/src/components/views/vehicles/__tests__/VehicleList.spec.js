import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import VehicleList from '../VehicleList.vue'

const CardStub = { template: '<div><slot/></div>' }
const CardContentStub = { template: '<div><slot/></div>' }
const CardHeaderStub = { template: '<div><slot/></div>' }
const CardTitleStub = { template: '<div><slot/></div>' }
const ButtonStub = { props: ['variant','size'], template: '<button><slot/></button>' }

describe('VehicleList', () => {
  it('renders vehicles and emits delete when delete clicked', async () => {
    const vehicles = [
      { id: '1', make: 'Honda', model: 'Civic', year: '2015', licensePlate: 'XYZ-111', vehicleType: 'Sedan', currentMileage: '80000' },
      { id: '2', make: 'Ford', model: 'Ranger', year: '2020', licensePlate: 'ABC-222', vehicleType: 'Pickup', currentMileage: '30000' },
    ]

    const wrapper = mount(VehicleList, {
      props: { vehicles },
      global: {
        components: {
          Card: CardStub,
          CardContent: CardContentStub,
          CardHeader: CardHeaderStub,
          CardTitle: CardTitleStub,
          Button: ButtonStub,
          VehicleForm: { template: '<div />' },
        }
      }
    })

    // ensure both vehicles are rendered
    expect(wrapper.text()).toContain('Honda')
    expect(wrapper.text()).toContain('Ford')

    // find delete button for first item (there are two buttons per item, Edit then Delete)
    const buttons = wrapper.findAll('button')
    // buttons include header Add Vehicle button + 2 buttons per item; compute index of first item's delete
    // Header add button is the first button, so first item's delete is at index 1 + (0 * 2) + 1 = 2
    const firstItemDeleteBtn = buttons[2]
    await firstItemDeleteBtn.trigger('click')

    expect(wrapper.emitted()).toHaveProperty('delete')
    const payload = wrapper.emitted('delete')[0][0]
    expect(payload).toMatchObject({ id: '1', licensePlate: 'XYZ-111' })
  })
})
