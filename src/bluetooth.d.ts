interface Navigator {
  bluetooth: {
    getDevices(): Promise<BluetoothDevice[]>;
    requestDevice(options?: any): Promise<BluetoothDevice>;
  };
}

interface BluetoothDevice extends EventTarget {
  readonly name?: string;
  readonly gatt?: {
    connect(): Promise<any>;
    disconnect(): void;
  };
}
