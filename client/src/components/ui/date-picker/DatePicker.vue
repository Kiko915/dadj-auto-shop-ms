<script setup>
import { computed, ref } from 'vue';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { CalendarDate, DateFormatter, getLocalTimeZone, today } from '@internationalized/date';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const props = defineProps({
  modelValue: {
    type: [Date, null],
    default: null,
  },
  placeholder: {
    type: String,
    default: 'Pick a date',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

// Date formatter for display
const df = new DateFormatter('en-US', {
  dateStyle: 'long',
});

// Convert JavaScript Date to CalendarDate
const toCalendarDate = (date) => {
  if (!date) return undefined;
  const d = new Date(date);
  return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
};

// Convert CalendarDate to JavaScript Date
const toJSDate = (calendarDate) => {
  if (!calendarDate) return null;
  return new Date(calendarDate.year, calendarDate.month - 1, calendarDate.day);
};

// Internal value management
const internalValue = computed({
  get: () => toCalendarDate(props.modelValue),
  set: (val) => {
    const jsDate = toJSDate(val);
    emit('update:modelValue', jsDate);
  },
});

// Generate year options (100 years back from current year, 10 years forward)
const currentYear = new Date().getFullYear();
const yearOptions = computed(() => {
  const years = [];
  for (let year = currentYear - 100; year <= currentYear + 10; year++) {
    years.push(year);
  }
  return years.reverse(); // Most recent years first
});

// Month options
const monthOptions = [
  { value: 0, label: 'January' },
  { value: 1, label: 'February' },
  { value: 2, label: 'March' },
  { value: 3, label: 'April' },
  { value: 4, label: 'May' },
  { value: 5, label: 'June' },
  { value: 6, label: 'July' },
  { value: 7, label: 'August' },
  { value: 8, label: 'September' },
  { value: 9, label: 'October' },
  { value: 10, label: 'November' },
  { value: 11, label: 'December' },
];

// Calendar navigation placeholder
const calendarPlaceholder = ref(
  props.modelValue ? toCalendarDate(props.modelValue) : today(getLocalTimeZone())
);

const selectedMonth = computed({
  get: () => calendarPlaceholder.value.month - 1, // Convert to 0-indexed
  set: (month) => {
    calendarPlaceholder.value = new CalendarDate(
      calendarPlaceholder.value.year,
      month + 1, // Convert back to 1-indexed
      1
    );
  },
});

const selectedYear = computed({
  get: () => calendarPlaceholder.value.year,
  set: (year) => {
    calendarPlaceholder.value = new CalendarDate(
      year,
      calendarPlaceholder.value.month,
      1
    );
  },
});

const formatDate = (date) => {
  if (!date) return null;
  return df.format(toJSDate(date));
};

const goToPreviousMonth = () => {
  const currentMonth = calendarPlaceholder.value.month;
  const currentYear = calendarPlaceholder.value.year;
  
  if (currentMonth === 1) {
    calendarPlaceholder.value = new CalendarDate(currentYear - 1, 12, 1);
  } else {
    calendarPlaceholder.value = new CalendarDate(currentYear, currentMonth - 1, 1);
  }
};

const goToNextMonth = () => {
  const currentMonth = calendarPlaceholder.value.month;
  const currentYear = calendarPlaceholder.value.year;
  
  if (currentMonth === 12) {
    calendarPlaceholder.value = new CalendarDate(currentYear + 1, 1, 1);
  } else {
    calendarPlaceholder.value = new CalendarDate(currentYear, currentMonth + 1, 1);
  }
};
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :class="
          cn(
            'w-full justify-start text-left font-normal',
            !internalValue && 'text-muted-foreground'
          )
        "
        :disabled="disabled"
      >
        <CalendarIcon class="mr-2 h-4 w-4" />
        <span>{{ internalValue ? formatDate(internalValue) : placeholder }}</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0" align="start">
      <!-- Month and Year Selectors -->
      <div class="flex items-center justify-between gap-2 p-3 border-b">
        <Button
          variant="outline"
          size="icon"
          class="h-7 w-7"
          @click="goToPreviousMonth"
        >
          <ChevronLeft class="h-4 w-4" />
        </Button>
        
        <div class="flex items-center gap-2 flex-1">
          <Select :model-value="selectedMonth.toString()" @update:model-value="(val) => selectedMonth = parseInt(val)">
            <SelectTrigger class="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="month in monthOptions"
                :key="month.value"
                :value="month.value.toString()"
              >
                {{ month.label }}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select :model-value="selectedYear.toString()" @update:model-value="(val) => selectedYear = parseInt(val)">
            <SelectTrigger class="h-8 text-sm w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent class="max-h-[200px]">
              <SelectItem
                v-for="year in yearOptions"
                :key="year"
                :value="year.toString()"
              >
                {{ year }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="icon"
          class="h-7 w-7"
          @click="goToNextMonth"
        >
          <ChevronRight class="h-4 w-4" />
        </Button>
      </div>

      <!-- Calendar -->
      <Calendar 
        v-model="internalValue"
        :placeholder="calendarPlaceholder"
      />
    </PopoverContent>
  </Popover>
</template>
