<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Car, Plus, Info, MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-vue-next'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Vehicle = {
  id: string
  licensePlate: string
  make: string
  model: string
  year?: number
  vehicleType?: string
  mileage?: number
}

const props = defineProps<{
  vehicles: Vehicle[]
  showNotice?: boolean
  customerFullName: string
}>()

const emit = defineEmits<{
  addVehicle: []
  viewVehicle: [vehicle: Vehicle]
  editVehicle: [vehicle: Vehicle]
  deleteVehicle: [vehicle: Vehicle]
}>()
</script>

<template>
  <div class="space-y-4">
    <!-- New Customer Notice -->
    <Alert v-if="showNotice" class="border-blue-500 bg-blue-50 dark:bg-blue-950">
      <Info class="h-5 w-5 text-blue-600 dark:text-blue-400" />
      <AlertTitle class="text-blue-900 dark:text-blue-100">Welcome! Customer Successfully Created</AlertTitle>
      <AlertDescription class="text-blue-800 dark:text-blue-200">
        <p class="mb-2">
          {{ customerFullName }} has been added to your customer database. 
        </p>
        <p>
          To get started, add their first vehicle by clicking the button below. This will help you track service history and maintenance schedules for their vehicles.
        </p>
      </AlertDescription>
    </Alert>

    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>Registered Vehicles</CardTitle>
            <CardDescription>Manage customer's vehicles</CardDescription>
          </div>
          <Button @click="emit('addVehicle')">
            <Plus class="h-4 w-4 mr-2" />
            Add New Vehicle
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <!-- Empty State -->
        <div v-if="vehicles.length === 0" class="text-center py-12">
          <Car class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 class="text-lg font-semibold mb-2">No Vehicles Registered</h3>
          <p class="text-muted-foreground mb-4">
            This customer hasn't registered any vehicles yet.
          </p>
          <Button @click="emit('addVehicle')">
            <Plus class="h-4 w-4 mr-2" />
            Add First Vehicle
          </Button>
        </div>

        <!-- Vehicles Table -->
        <div v-else class="rounded-md border">
          <table class="w-full">
            <thead class="bg-muted/50">
              <tr class="border-b">
                <th class="px-4 py-3 text-left text-sm font-medium">License Plate</th>
                <th class="px-4 py-3 text-left text-sm font-medium">Make & Model</th>
                <th class="px-4 py-3 text-left text-sm font-medium">Year</th>
                <th class="px-4 py-3 text-left text-sm font-medium">Type</th>
                <th class="px-4 py-3 text-left text-sm font-medium">Mileage</th>
                <th class="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="vehicle in vehicles" :key="vehicle.id" class="border-b hover:bg-muted/50">
                <td class="px-4 py-3 font-medium">{{ vehicle.licensePlate }}</td>
                <td class="px-4 py-3">{{ vehicle.make }} {{ vehicle.model }}</td>
                <td class="px-4 py-3">{{ vehicle.year || 'N/A' }}</td>
                <td class="px-4 py-3">{{ vehicle.vehicleType || 'N/A' }}</td>
                <td class="px-4 py-3">{{ vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : 'N/A' }}</td>
                <td class="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" class="h-8 w-8 p-0">
                        <span class="sr-only">Open menu</span>
                        <MoreHorizontal class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem @click="emit('viewVehicle', vehicle)">
                        <Eye class="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="emit('editVehicle', vehicle)">
                        <Edit class="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem @click="emit('deleteVehicle', vehicle)" class="text-destructive">
                        <Trash2 class="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
