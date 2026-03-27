const { isSameDay, startOfWeek, addDays, isWithinInterval, endOfDay, startOfDay, format } = require('date-fns');

const weekOffset = 0;
const selectedWeekStart = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
const selectedWeekEnd = addDays(selectedWeekStart, 6);

console.log("selectedWeekStart:", selectedWeekStart);
console.log("selectedWeekEnd:", selectedWeekEnd);

const sessionDate = new Date();
const isWithin = isWithinInterval(sessionDate, { start: startOfDay(selectedWeekStart), end: endOfDay(selectedWeekEnd) });

console.log("sessionDate:", sessionDate);
console.log("isWithin:", isWithin);

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const focusData = dayNames.map((d, i) => ({ name: d, minutes: 0 }));

const day = sessionDate.getDay();
const index = day === 0 ? 6 : day - 1;
console.log("Map Day Index:", index, focusData[index].name);
