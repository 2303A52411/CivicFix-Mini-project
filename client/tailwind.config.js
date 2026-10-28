/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {
    colors: { ink: '#10243e', brand: {50:'#eef8ff',100:'#d9efff',500:'#1689c9',600:'#0873b2',700:'#075c8e'}, teal: {500:'#16a6a1',600:'#0b8583'} },
    fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui'] },
    boxShadow: { card: '0 10px 35px rgba(16,36,62,.08)' }
  }}
};
