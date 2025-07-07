/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  safelist: [
    'border-orange-200',
    'border-orange-400',
    'border-orange-500',
    'bg-orange-50',
    'bg-orange-100',
    'bg-orange-200',
    'text-orange-600',
    'text-orange-700',
    'font-semibold',
    'rounded-full',
    'px-4',
    'py-1',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
