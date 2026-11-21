export class TabControl {
 	constructor() {
 		this.activeTab = null;
 		
 		this.tabControl = document.getElementById("tab-control");
    this.tabStrip = this.tabControl.querySelector(".tab-strip")
    this.tabContainer = this.tabControl.querySelector(".tab-container");
    this.tabs = this.tabControl.querySelectorAll(".tab-container .tab");
    
    this.tabsByTitle = {};
    this.tabButtonsByTitle = {};
 	}
  
  render() {
    let isFirst = true;
    this.tabs.forEach(tab => {
      this.tabsByTitle[tab.title] = tab;
    	let tabButton = document.createElement("button");
      tabButton.innerText = tab.title;
      tabButton.className = "px-2 py-1 text-xs font-bold rounded synth-btn text-slate-900";
      this.tabStrip.appendChild(tabButton);
      this.tabButtonsByTitle[tab.title] = tabButton;
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
       
      tabButton.addEventListener("click", () => this.showTab(tab.title));
    });
  }
  
  showTab(tabTitle) {
    let tab = this.tabsByTitle[tabTitle];
    let tabButton = this.tabButtonsByTitle[tabTitle];
      
    let activeTabButton = this.tabStrip.querySelector(".active-led");
    let activeTab = this.tabContainer.querySelector(".active-tab")
          
    if (activeTab) {
      if (tab == activeTab) return;
        activeTab.style.display = "none";
        activeTab.classList.remove("active-tab");
        activeTabButton.classList.remove("active-led");
      }
    tab.style.display = "block";
    tab.classList.add("active-tab");
    tabButton.classList.add('active-led');
    this.activeTab = tab.title;
  }
}