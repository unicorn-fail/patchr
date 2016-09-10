export default class Event {

  /**
   * @class Event
   *
   * @param {String} type
   *   The event type.
   *
   * @constructor
   */
  constructor(type) {
    // Read-only/internal variables.
    let defaultPrevented = false;
    let eventTarget = null;
    let namespace = type.split('.').filter(Boolean);
    let eventType = namespace.shift();
    Object.defineProperty(this, 'defaultPrevented', {
      get: function () {
        return defaultPrevented;
      }
    });
    Object.defineProperty(this, 'namespace', {value: [''].concat(namespace).join('.')});
    Object.defineProperty(this, 'timeStamp', {value: Date.now()});
    Object.defineProperty(this, 'type', {value: eventType});
    Object.defineProperty(this, 'preventDefault', {
      value() {
        defaultPrevented = true;
      }
    });
    Object.defineProperty(this, 'setTarget', {
      value(object) {
        if (eventTarget === null) {
          eventTarget = object;
        }
      }
    });
    Object.defineProperty(this, 'target', {
      get() {
        return eventTarget;
      }
    });

  }

}
