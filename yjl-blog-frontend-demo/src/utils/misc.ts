import { ref } from 'vue'

export default {
  getYear: (date: string) => ref(new Date(date).getFullYear()),
  getMonthWith0: (date: string) => ref(String(new Date(date).getMonth() + 1).padStart(2, '0')),
  getDayWith0: (date: string) => ref(String(new Date(date).getDate()).padStart(2, '0')),
  getMonth: (date: string) => ref(String(new Date(date).getMonth() + 1)),
  getDay: (date: string) => ref(String(new Date(date).getDate())),
}
