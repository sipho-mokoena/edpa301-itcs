import { initLogger, log } from "utils";

initLogger({ name: "scada" });

export function setupCounter(element: HTMLButtonElement) {
  let counter = 0
  const setCounter = (count: number) => {
    counter = count
    element.innerHTML = `Count is ${counter}`
  }
  element.addEventListener('click', () => {
    log.info('Counter clicked')
    setCounter(counter + 1)
  })
  setCounter(0)
}
