
function getTimezoneOffsetMinutes(timezone) {
    const d = new Date();
    // Get the local time string in the target timezone
    const tzString = d.toLocaleString('en-US', { timeZone: timezone, hour12: false });
    const parts = tzString.match(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+)/);
    if (!parts) return 0;
    
    // Create a date object as if it were in UTC
    const year = parseInt(parts[3]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    const hour = parseInt(parts[4]);
    const min = parseInt(parts[5]);
    const sec = parseInt(parts[6]);
    
    const tzDate = Date.UTC(year, month, day, hour, min, sec);
    const utcDate = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
    
    return Math.round((utcDate - tzDate) / 60000);
}

function formatTimezoneOffset(timezone) {
    const d = new Date();
    const options = { timeZone: timezone, timeZoneName: 'shortOffset' };
    const parts = Intl.DateTimeFormat('en-US', options).formatToParts(d);
    const offsetPart = parts.find(p => p.type === 'timeZoneName');
    return offsetPart ? offsetPart.value : "GMT";
}

console.log("Asia/Ho_Chi_Minh:", getTimezoneOffsetMinutes("Asia/Ho_Chi_Minh"), formatTimezoneOffset("Asia/Ho_Chi_Minh"));
console.log("America/New_York:", getTimezoneOffsetMinutes("America/New_York"), formatTimezoneOffset("America/New_York"));
console.log("Europe/London:", getTimezoneOffsetMinutes("Europe/London"), formatTimezoneOffset("Europe/London"));
console.log("Asia/Tokyo:", getTimezoneOffsetMinutes("Asia/Tokyo"), formatTimezoneOffset("Asia/Tokyo"));
