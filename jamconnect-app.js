export class App {
  constructor() {
    let swRegistration = null;
    if (location.origin !== "file://") {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("./jamconnect-service-worker.js", "./")
          .then((reg) => {
            swRegistration = reg;
          });
      }
    }
  }
}

const app = new App();