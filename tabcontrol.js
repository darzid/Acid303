const tabControl = document.getElementById("tab-control");
const tabStrip = tabControl.querySelector(".tab-strip")
const tabContainer = tabControl.querySelector(".tab-container");
const tabs = tabControl.querySelectorAll(".tab-container .tab");
    
let isFirst = true;
tabs.forEach(tab => {
	let tabButton = document.createElement("button");
  tabButton.innerText = tab.title;
  tabButton.className = "px-2 py-1 text-xs font-bold rounded synth-btn text-slate-900";
  tabStrip.appendChild(tabButton);
  if (isFirst) {
  	tabButton.classList.add("active-led");
    tab.classList.add("active-tab");
    tab.style.display = "block";
    isFirst = false;
  }
  else {
    tabButton.classList.remove("active-led");
    tab.classList.remove("active-tab");
    tab.style.display = "none";
  }
   
  tabButton.addEventListener("click", () => {
    let activeTabButton = tabStrip.querySelector(".active-led");
    let activeTab = tabContainer.querySelector(".active-tab")
          
    if (activeTab) {
      if (tab == activeTab) return;
        activeTab.style.display = "none";
        activeTab.classList.remove("active-tab");
        activeTabButton.classList.remove("active-led");
      }
    tab.style.display = "block";
    tab.classList.add("active-tab");
    tabButton.classList.add('active-led');
  });
});
