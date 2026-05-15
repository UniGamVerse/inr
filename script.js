const csvUrl="https://docs.google.com/spreadsheets/d/e/2PACX-1vQYux2ZQEccMhorKoMo_GuqImRjEqlf__wRVQo7gYLG9cVBdvDpb0lvDnneiYJHUMaCdG1oEoJjMcQF/pub?output=csv";

let foods=[];

let currentSemFilter="all";
let currentTypeFilter="all";
let currentSort="alpha";

const semRank={
  verde:1,
  giallo:2,
  arancione:3,
  rosso:4
};

const stabRank={
  bassa:1,
  media:2,
  alta:3
};

const inrRank={
  "↓↓↓":1,
  "↓↓":2,
  "↓ lieve":3,
  "↓":4,
  "=":5,
  "↑":6,
  "↑/↓":7
};

const typeLabels={
  alimento:"Alimenti",
  piatto:"Piatti",
  bbq:"BBQ / Griglia",
  stabilizzatore:"Stabilizzatori",
  safe:"Safe foods"
};

function clean(value){
  return String(value || "")
    .replace(/^\uFEFF/,"")
    .trim();
}

function normalizeList(value){
  return clean(value)
    .toLowerCase()
    .split(",")
    .map(item=>item.trim())
    .filter(Boolean);
}

function getSemEmoji(value){
  if(value==="verde") return "🟢";
  if(value==="giallo") return "🟡";
  if(value==="arancione") return "🟠";
  if(value==="rosso") return "🔴";
  return "";
}

function getInrKey(value){
  return clean(value).replace(/^'/,"");
}

async function loadFoods(){

  Papa.parse(csvUrl,{
    download:true,
    header:true,
    skipEmptyLines:true,

    complete:function(results){

      foods=results.data
        .map(food=>({
          voce:clean(food.voce),
          tipo:clean(food.tipo).toLowerCase(),
          semaforo:clean(food.semaforo).toLowerCase(),
          inr:clean(food.inr),
          variabilita:clean(food.variabilita),
          stabilita:clean(food.stabilita).toLowerCase(),
          tempoEffetto:clean(food.tempoEffetto),
          abituale:clean(food.abituale),
          critica:clean(food.critica),
          note:clean(food.note)
        }))
        .filter(food=>food.voce);

      renderFoods();

    },

    error:function(){
      const container=document.getElementById("foodContainer");
      container.innerHTML=`
        <div class="empty">
          Errore nel caricamento dei dati
        </div>
      `;
    }
  });

}

function sortFiltered(items){

  if(currentSort==="alpha"){
    items.sort((a,b)=>a.voce.localeCompare(b.voce,"it"));
  }

  if(currentSort==="semAsc"){
    items.sort((a,b)=>
      (semRank[a.semaforo] || 999) -
      (semRank[b.semaforo] || 999)
    );
  }

  if(currentSort==="semDesc"){
    items.sort((a,b)=>
      (semRank[b.semaforo] || 999) -
      (semRank[a.semaforo] || 999)
    );
  }

  if(currentSort==="stabAsc"){
    items.sort((a,b)=>
      (stabRank[a.stabilita] || 999) -
      (stabRank[b.stabilita] || 999)
    );
  }

  if(currentSort==="stabDesc"){
    items.sort((a,b)=>
      (stabRank[b.stabilita] || 999) -
      (stabRank[a.stabilita] || 999)
    );
  }

  if(currentSort==="inrAsc"){
    items.sort((a,b)=>
      (inrRank[getInrKey(a.inr)] || 999) -
      (inrRank[getInrKey(b.inr)] || 999)
    );
  }

  if(currentSort==="inrDesc"){
    items.sort((a,b)=>
      (inrRank[getInrKey(b.inr)] || 999) -
      (inrRank[getInrKey(a.inr)] || 999)
    );
  }

}

function groupByType(items){

  const grouped={};

  items.forEach(item=>{

    const types=normalizeList(item.tipo);

    if(types.length===0) return;

    const groupType=
      currentTypeFilter!=="all"
        ? currentTypeFilter
        : types[0];

    if(!grouped[groupType]){
      grouped[groupType]=[];
    }

    grouped[groupType].push(item);

  });

  return grouped;

}

function renderFoods(){

  const container=document.getElementById("foodContainer");
  const search=document.getElementById("search").value.toLowerCase();

  let filtered=foods.filter(food=>{

    const rowText=Object.values(food).join(" ").toLowerCase();
    const types=normalizeList(food.tipo);

    return(
      (search==="" || rowText.includes(search)) &&
      (currentSemFilter==="all" || food.semaforo===currentSemFilter) &&
      (currentTypeFilter==="all" || types.includes(currentTypeFilter))
    );

  });

  sortFiltered(filtered);

  const grouped=groupByType(filtered);

  container.innerHTML="";

  if(filtered.length===0){
    container.innerHTML=`
      <div class="empty">
        Nessun risultato trovato
      </div>
    `;
    return;
  }

  Object.keys(grouped).forEach(type=>{

    container.innerHTML+=`
      <div class="section-title">
        ${typeLabels[type] || type}
      </div>
    `;

    grouped[type].forEach(food=>{

      container.innerHTML+=`
        <div class="table-row table-grid">

          <div class="col voce">
            ${food.voce}
          </div>

          <div class="col semaforo desktop-only">
            ${getSemEmoji(food.semaforo)}
          </div>

          <div class="col inr desktop-only">
            ${food.inr}
          </div>

          <div class="col mobile-top mobile-only">
            <div class="mobile-sem">
              ${getSemEmoji(food.semaforo)}
            </div>
            <div class="mobile-inr">
              ${food.inr}
            </div>
          </div>

          <div class="col variabilita">
            ${food.variabilita}
          </div>

          <div class="col stabilita">
            ${food.stabilita}
          </div>

          <div class="col effetto">
            ${food.tempoEffetto}
          </div>

          <div class="col dose">
            <span class="dose-normal">
              ${food.abituale}
            </span>
            <span class="dose-sep">
              |
            </span>
            <span class="dose-critica">
              ${food.critica}
            </span>
          </div>

          <div class="col note">
            ${food.note}
          </div>

        </div>
      `;

    });

  });

}

function setActive(group,button){

  document
    .querySelectorAll(`[data-group="${group}"]`)
    .forEach(btn=>btn.classList.remove("active"));

  button.classList.add("active");

}

function setSemFilter(value){
  currentSemFilter=value;
  renderFoods();
}

function setTypeFilter(value){
  currentTypeFilter=value;
  renderFoods();
}

function sortFoods(value){
  currentSort=value;
  renderFoods();
}

function toggleTheme(){
  document.body.classList.toggle("light");
}

document
  .getElementById("search")
  .addEventListener("input",renderFoods);

const backToTop=document.getElementById("backToTop");

window.addEventListener("scroll",()=>{

  if(window.scrollY > 500){
    backToTop.classList.add("show");
  }else{
    backToTop.classList.remove("show");
  }

});

function scrollToTop(){
  window.scrollTo({
    top:0,
    behavior:"smooth"
  });
}

loadFoods();
