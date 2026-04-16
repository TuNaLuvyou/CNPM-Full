
const { getOrderedDayLabels, DAY_KEYS } = require('./lib/CalendarHelper.js');

console.log('DAY_KEYS:', DAY_KEYS);
console.log('Labels (monday):', getOrderedDayLabels('vi', 'monday'));
console.log('Labels (sunday):', getOrderedDayLabels('vi', 'sunday'));
