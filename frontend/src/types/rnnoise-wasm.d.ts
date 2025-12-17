declare module 'rnnoise-wasm' {
  interface RNNoiseModule {
    newState(): any;
    deleteState(state: any): void;
    processFrame(state: any, frame: Int16Array): void;
  }
  
  export default function(): Promise<RNNoiseModule>;
}
