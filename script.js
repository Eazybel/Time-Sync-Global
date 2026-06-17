const dataList=document.getElementById("timezone-list")
fetch("https://api.opentimezone.com/timezones")
.then(res=>{
return res.json()
}).then(data=>{
console.log(data)
data.forEach(zone => {
    dataList.insertAdjacentHTML("beforeend",`<option value="${zone.displayName}">${zone.displayName}</option>`)
});
})