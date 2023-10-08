
let parser, xmlDoc, ds;

let reader = new FileReader(),
handleFiles = function() {
  let file, fileList = this.files;
    if(fileList.length == 1){
      file = fileList.item(0);
      // console.log(file.type);
      if ((file.type == "text/xml") || (file.type == "application/gpx+xml") || (file.type == "application/xml")) { ds = "XML"; } else {ds = "WTF?! " + file.type;}
      reader.readAsText(file);
    }
},
handleDataset = function() {
  if(ds == "XML"){
    parser = new DOMParser();
    xmlDoc = parser.parseFromString(reader.result,"text/xml");
    plotIt(xmlDoc.getElementsByTagName("trkpt"), trekChart);
  } else {console.log("Data set: " + ds);}
},
handleSort = function() {
  plotIt(xmlDoc.getElementsByTagName("trkpt"), trekChart);
}

document.getElementById("decimator").addEventListener("change", handleSort, false);
document.getElementById("dataset").addEventListener("change", handleFiles, false);
reader.addEventListener("loadend", handleDataset, false);

const trekChart = new Chart("trekChart", {
  type: "line",
  data: {
    datasets: [{
      label: 'кривая Лоренца',
      data: {},
      borderColor: "lightblue",
      fill: true
    },
    {
      label: 'кривая равенства',
      data: {0:0, 100:100},
      borderColor: "green",
      fill: false
    }
    ]
  },
  options: {
    aspectRatio: 1,
    scales: {
      x: {
        title: {
          color: 'navy',
          display: true,
          text: 'Время (%)'
        }
      },
      y: { 
        max: 100,
        title: {
          color: 'navy',
          display: true,
          text: 'Расстояние (%)'
        }

      }
    },
    plugins: {
      title: {
        display: true,
        text: "Распределение скоростей",
      }
    }
  }
});

let plotIt = function(tags, chart) {
  let pts = [], ft, dist = 0, time = 0, pp = {},
  e = document.getElementById("decimator").value;
  for(i=0;i<tags.length; i++){
    let p = {};
    y=tags[i].firstChild;
    for(c=0;c<tags[i].childNodes.length;c++){
      if(y.nodeType == 1) {
        if(y.nodeName == 'time'){
          const d = new Date(y.childNodes[0].nodeValue);
          let t = d.getTime()/1000;
          if(i==0){ft = t; p['time'] = 0;}
          else {
            p['time'] = t - ft;
          }
        }
      }
      y = y.nextSibling;
    }

    if(!(i % e)){
      p['latitude'] = tags[i].getAttribute("lat"), p['longitude'] = tags[i].getAttribute("lon");
      if(p['time'] == 0){
        p['dist'] = 0;
        p['speed'] = 0;
      } else {
        p['time'] -= pp['time'];
        p['dist'] = haversine(pp, p, {unit: 'meter'});
        p['speed'] = p['dist'] / p['time'];
        dist += p['dist'];
      }
      time += p['time'];
      pts.push(p);
      pp = p;
    }
  }

  pts.sort(function(a, b){return a.speed - b.speed});

  let curve = {}, d = 0, t = 0, tt, Xi1 = 0, Yi1 = 0, Xi = 0, Yi = 0, G = 0;

  for(i=0;i<pts.length;i++){
    d += pts[i].dist;
    t += pts[i].time;
    Xi = t / time;
    Yi = d / dist;
    if(i>0){ G += (Xi-Xi1)*(Yi+Yi1)*0.5; }
    Xi1 = Xi; Yi1 = Yi;
    tt = Math.round(Xi * 100); // chart.js странно работает с дробными значениями по оси абсцисс, если есть и целые и дробные
    curve[tt] = Yi * 100.0;
  }
  G = 1 - G * 2;
  document.getElementById("idxGini").innerHTML = 'Индекс Джини = ' + G + '<br/>';
  chart.data.datasets[0].data = curve;
  chart.update();
}
