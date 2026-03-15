export class FlowStorage {
  private static instance: Storage;
  private constructor(value: Storage) {
    FlowStorage.instance = value;
  }
  static getInstance() {
    if (!FlowStorage.instance) {
      FlowStorage.instance = window.localStorage;
    }
    return FlowStorage.instance;
  }
  static setInstanceToSessionStorage() {
    FlowStorage.instance = window.sessionStorage;
  }
}
