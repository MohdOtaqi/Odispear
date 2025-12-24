// Type declaration for @jitsi/rnnoise-wasm
declare module '@jitsi/rnnoise-wasm' {
    interface RNNoiseModule {
        _rnnoise_create: (vad?: null) => number;
        _rnnoise_destroy: (state: number) => void;
        _rnnoise_process_frame: (state: number, output: number, input: number) => number;
        _malloc: (bytes: number) => number;
        _free: (ptr: number) => void;
        HEAPF32: Float32Array;
    }

    export function createRNNWasmModule(): Promise<RNNoiseModule>;
    export function createRNNWasmModuleSync(): RNNoiseModule;
}
