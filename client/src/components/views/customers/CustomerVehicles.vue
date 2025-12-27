<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Car, Plus, Info, MoreHorizontal, Eye, Edit, Trash2, ChevronLeft, ChevronRight, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-vue-next'
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
  currentPage?: number
  totalPages?: number
  totalVehicles?: number
  search?: string
  filterMake?: string
  uniqueMakes?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}>()

const emit = defineEmits<{
  addVehicle: []
  viewVehicle: [vehicle: Vehicle]
  editVehicle: [vehicle: Vehicle]
  deleteVehicle: [vehicle: Vehicle]
  changePage: [page: number]
  'update:search': [value: string]
  'update:filterMake': [value: string]
  'update:sortBy': [value: string]
  'update:sortOrder': [value: 'asc' | 'desc']
}>()

const handleSort = (field: string) => {
    if (props.sortBy === field) {
        emit('update:sortOrder', props.sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
        emit('update:sortBy', field)
        emit('update:sortOrder', 'asc')
    }
}
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
        <div class="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Registered Vehicles</CardTitle>
            <CardDescription>Manage customer's vehicles</CardDescription>
          </div>
          <div class="flex items-center gap-2">
             <!-- Search -->
            <div class="relative w-full max-w-sm">
              <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search vehicles..." 
                class="pl-8 w-[200px] lg:w-[300px]" 
                :model-value="search"
                @update:model-value="(val) => emit('update:search', val.toString())"
              />
            </div>

            <!-- Filter -->
             <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="outline" class="gap-2">
                  <Filter class="h-4 w-4" />
                  {{ filterMake && filterMake !== 'All' ? filterMake : 'Filter' }}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Make</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem @click="emit('update:filterMake', 'All')">
                  All Makes
                </DropdownMenuItem>
                <DropdownMenuItem 
                  v-for="make in uniqueMakes?.filter(m => m !== 'All' && m !== 'All Makes') || []" 
                  :key="make"
                  @click="emit('update:filterMake', make)"
                >
                  {{ make }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button @click="emit('addVehicle')">
              <Plus class="h-4 w-4 mr-2" />
              Add New Vehicle
            </Button>
          </div>
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
                <th 
                    class="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                    @click="handleSort('licensePlate')"
                >
                    <div class="flex items-center gap-2">
                        License Plate
                        <component 
                            :is="sortBy === 'licensePlate' ? (sortOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown" 
                            class="h-3 w-3"
                        />
                    </div>
                </th>
                <th 
                    class="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                    @click="handleSort('make')"
                >
                    <div class="flex items-center gap-2">
                        Make & Model
                        <component 
                            :is="sortBy === 'make' ? (sortOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown" 
                            class="h-3 w-3"
                        />
                    </div>
                </th>
                <th 
                    class="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                    @click="handleSort('year')"
                >
                    <div class="flex items-center gap-2">
                        Year
                        <component 
                            :is="sortBy === 'year' ? (sortOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown" 
                            class="h-3 w-3"
                        />
                    </div>
                </th>
                <th 
                    class="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                    @click="handleSort('vehicleType')"
                >
                     <div class="flex items-center gap-2">
                        Type
                        <component 
                            :is="sortBy === 'vehicleType' ? (sortOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown" 
                            class="h-3 w-3"
                        />
                    </div>
                </th>
                <th 
                    class="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                    @click="handleSort('mileage')"
                >
                     <div class="flex items-center gap-2">
                        Mileage
                        <component 
                            :is="sortBy === 'mileage' ? (sortOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown" 
                            class="h-3 w-3"
                        />
                    </div>
                </th>
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

        <!-- Pagination Footer -->
        <div v-if="totalPages && totalPages > 1" class="flex items-center justify-between space-x-2 py-4 border-t mt-4">
          <div class="text-sm text-muted-foreground">
            Page {{ currentPage }} of {{ totalPages }} ({{ totalVehicles }} vehicles)
          </div>
          <div class="space-x-2">
            <Button
              variant="outline"
              size="sm"
              :disabled="!currentPage || currentPage <= 1"
              @click="$emit('changePage', (currentPage || 1) - 1)"
            >
              <ChevronLeft class="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              :disabled="!currentPage || !totalPages || currentPage >= totalPages"
              @click="$emit('changePage', (currentPage || 1) + 1)"
            >
              Next
              <ChevronRight class="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
