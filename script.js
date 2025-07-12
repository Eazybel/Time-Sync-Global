const baseCountry = document.getElementById('base-country'),
      baseTime = document.getElementById('base-time'),
      compare1 = document.getElementById('compare1'),
      compareTime1 = document.getElementById('compare-time1'),
      compare2 = document.getElementById('compare2'),
      compareTime2 = document.getElementById('compare-time2'),
      compare3 = document.getElementById('compare3'),
      compareTime3 = document.getElementById('compare-time3'),
      main=document.getElementById("main-wrapper"),
      loading=document.getElementById("loading"),
      body=document.getElementById("body"),
      btn=document.getElementById("convert-btn");
const counter=document.getElementById("counter")
      

const shower=()=>{
        main.style.display="none"
        loading.style.display="block"
        body.style.background="black"
}
const hider=()=>{
     main.style.display="block"
        loading.style.display="none"
        body.style.background="linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)"
}
 
      fetch("https://countriesnow.space/api/v0.1/countries/capital")
      .then(res=>res.json())
      .then(data=>{
       
          for (let i = 0; i < data.data.length; i++) {
          if(data.data.capital===""){
              continue;
          }
              baseCountry.innerHTML+=`<option>${data.data[i].name}</option>`
              compare3.innerHTML+=`<option>${data.data[i].name}</option>`
              compare2.innerHTML+=`<option>${data.data[i].name}</option>`
              compare1.innerHTML+=`<option>${data.data[i].name}</option>`
          }
          
      })
 btn.addEventListener("click",(()=>{
     let counters=5
   shower()
    setInterval(() => {
            if(counters!=0){
                  counter.innerText=counters
                  counters--
            }
           
          
        }, 1000);
         counter.innerText=""
    fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${baseCountry.value}&appid=d99bff6286cc266251816e686344a5f3`).then(
        res=>res.json()
    ).then(data=>{
        console.log(data)
           fetch(`http://api.timezonedb.com/v2.1/get-time-zone?key=9SCC73ZVOL18&format=json&by=position&lat=${data[0].lat}&lng=${data[0].lon}`)
    .then(res=>res.json())
    .then(data=>{
        console.log(data)
        baseTime.innerText=data.formatted
    })
    }

    ).catch(err=>{
        alert("Please make sure you typed correctly")
    })
   
    setTimeout(() => {
        fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${compare1.value}&appid=d99bff6286cc266251816e686344a5f3`).then(
        res=>res.json()
    ).then(data=>{
        console.log(data)
           fetch(`http://api.timezonedb.com/v2.1/get-time-zone?key=9SCC73ZVOL18&format=json&by=position&lat=${data[0].lat}&lng=${data[0].lon}`)
    .then(res=>res.json())
    .then(data=>{
        console.log(data)
        compareTime1.innerText=data.formatted
    })
    }

    )
    }, 2000);
    setTimeout(() => {
        fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${compare2.value}&appid=d99bff6286cc266251816e686344a5f3`).then(
        res=>res.json()
    ).then(data=>{
        console.log(data)
           fetch(`http://api.timezonedb.com/v2.1/get-time-zone?key=9SCC73ZVOL18&format=json&by=position&lat=${data[0].lat}&lng=${data[0].lon}`)
    .then(res=>res.json())
    .then(data=>{
        console.log(data)
        compareTime2.innerText=data.formatted
    })
    }

    )
    }, 3000);
    setTimeout(() => {
        fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${compare3.value}&appid=d99bff6286cc266251816e686344a5f3`).then(
        res=>res.json()
    ).then(data=>{
        console.log(data)
           fetch(`http://api.timezonedb.com/v2.1/get-time-zone?key=9SCC73ZVOL18&format=json&by=position&lat=${data[0].lat}&lng=${data[0].lon}`)
    .then(res=>res.json())
    .then(data=>{
        console.log(data)
        compareTime3.innerText=data.formatted
    })
    }

    )
    }, 4000);
    setTimeout(() => {
       
        hider()
    }, 5000);
   
 }))