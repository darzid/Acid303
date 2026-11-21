export class Action {
  constructor(id, actionMethod) {
    this.id = id;
    this.actionContainer = document.getElementById(id);
    this.actionContainer.innerHTML = "<div class='action-status' style='display: none'></div>" + this.actionContainer.innerHTML;
    this.actionStatus = this.actionContainer.querySelector(".action-status");
    this.actionStatus.style.display = "none";
    this.actionOutputElements = this.actionContainer.querySelectorAll(".action-output");
    this.actionMethod = actionMethod;
  }
  
  get actionDescription() { return this.actionContainer.title; }
  
  execute() {
    this._showDescription();
    try {
      var output = this.actionMethod();
      this._showSucceededAndHide();
      return new OkActionResult(output);
    }
    catch(error) {
      this._showError(this.actionDescription, error);
      return new FailedActionResult(error);
    }
  }
  
  async executeAsync() {
    this._showDescription();
    try {
      var output = await this.actionMethod();
      this._showSucceededAndHide();
      return new OkActionResult(output);
    }
    catch(error) {
      this._showError(this.actionDescription, error);
      return new FailedActionResult(error);
    }
  }
  
  _showDescription() {
    this.actionStatus.style.display = "block";
    this.actionStatus.innerText = this.actionDesciption;
    console.log(`Executing "${this.actionDescription}"`);
  }
  
  _showSucceededAndHide() {
    this.actionStatus.style.color = "darkgreen";
    this.actionStatus.innerText = `${this.actionDescription} succeeded`;
      window.setTimeout(() => {
        this.actionStatus.innerText = "";
        this.actionStatus.style.display = "none";
      }, 5000);
  }
  
  _showError(description, error) {
    this.actionStatus.style.color = "darkred";
    this.actionStatus.innerHTML = `${description} failed! <br>${error}`;
    this.actionOutputElements.forEach(element => element.style.display = "none")
    console.error(`${description} failed!`, error, error.stack);
  }
}

export class ActionResult {
  constructor(succeeded, output) {
    this.succeeded = succeeded;
    this.output = output;
  }
}

export class OkActionResult extends ActionResult {
  constructor(output) {
    super(true, output);
  }
}

export class FailedActionResult extends ActionResult {
  constructor(error) {
    super(false, error);
  }
}