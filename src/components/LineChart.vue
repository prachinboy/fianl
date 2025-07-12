<template>
  <div>
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup>
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale
} from 'chart.js'
import { Line } from 'vue-chartjs'
import { computed } from 'vue'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale
)

const props = defineProps({
  labels: Array,
  data: Array
})

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      label: 'จำนวนคำแนะนำ',
      data: props.data,
      fill: false,
      borderColor: 'orange',
      backgroundColor: '#f59e0b',
      tension: 0.3,
      pointBackgroundColor: '#f97316',
      pointBorderWidth: 2
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top'
    },
    title: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1
      }
    }
  }
}
</script>

<style scoped>
div {
  height: 300px;
}
</style>
