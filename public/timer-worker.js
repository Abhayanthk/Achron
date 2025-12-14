/* eslint-disable no-restricted-globals */
self.onmessage = function (e) {
  const { command, interval } = e.data;

  if (command === "START") {
    if (self.timerId) clearInterval(self.timerId);

    self.timerId = setInterval(() => {
      self.postMessage({ type: "TICK" });
    }, interval || 100);
  } else if (command === "STOP") {
    if (self.timerId) clearInterval(self.timerId);
    self.timerId = null;
  }
};
