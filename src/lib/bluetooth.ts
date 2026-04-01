/**
 * ESC/POS Command Encoder for 58mm Thermal Printers
 */
const ESC = 0x1b;

export class EscPosEncoder {
  private buffer: number[] = [];

  initialize() {
    this.buffer.push(ESC, 0x40);
    return this;
  }

  alignCenter() {
    this.buffer.push(ESC, 0x61, 1);
    return this;
  }

  alignLeft() {
    this.buffer.push(ESC, 0x61, 0);
    return this;
  }

  alignRight() {
    this.buffer.push(ESC, 0x61, 2);
    return this;
  }

  bold(enabled: boolean) {
    this.buffer.push(ESC, 0x45, enabled ? 1 : 0);
    return this;
  }

  text(content: string) {
    const bytes = new TextEncoder().encode(content);
    this.buffer.push(...Array.from(bytes));
    return this;
  }

  line(content: string = '') {
    this.text(content + '\n');
    return this;
  }

  separator() {
    this.line('--------------------------------');
    return this;
  }

  feed(lines: number = 3) {
    this.buffer.push(ESC, 0x64, lines);
    return this;
  }

  encode(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

const PRINT_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb';
const PRINT_CHARACTERISTIC_UUID = '00002af1-0000-1000-8000-00805f9b34fb';

export async function selectPrinter(): Promise<BluetoothDevice> {
  if (!navigator.bluetooth) {
    throw new Error('Web Bluetooth tidak didukung di browser ini. Gunakan Chrome di Android/Desktop.');
  }

  try {
    console.log('Requesting new Bluetooth device...');
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [PRINT_SERVICE_UUID]
    });
    console.log('Device selected:', device.name);
    return device;
  } catch (error: any) {
    const message = error.message || '';
    if (error.name === 'NotFoundError' || message.includes('cancelled')) {
      throw new Error('Pencarian printer dibatalkan.');
    }
    throw new Error(message || 'Gagal memilih printer.');
  }
}

export async function printReceipt(
  transaction: any, 
  device?: BluetoothDevice, 
  storeName: string = 'CAFE BAJIBUN',
  address: string = 'Jalan Andi Tonro Gowa'
) {
  console.log('Starting printReceipt...', transaction);
  
  if (!navigator.bluetooth) {
    console.error('Web Bluetooth is not supported');
    throw new Error('Web Bluetooth tidak didukung di browser ini. Gunakan Chrome di Android/Desktop.');
  }

  try {
    let targetDevice = device;

    // 1. Jika device tidak diberikan, cari perangkat yang sudah pernah diberi izin (Paired di browser)
    if (!targetDevice && navigator.bluetooth.getDevices) {
      console.log('Checking for paired devices...');
      const pairedDevices = await navigator.bluetooth.getDevices();
      console.log('Paired devices found:', pairedDevices.length);
      targetDevice = pairedDevices.find(d => 
        /printer|mtp|pos|thermal|58mm/i.test(d.name || '')
      );
      if (targetDevice) console.log('Found matching paired device:', targetDevice.name);
    }

    // 2. Jika masih tidak ada device, minta izin baru
    if (!targetDevice) {
      targetDevice = await selectPrinter();
    }

    const server = await targetDevice.gatt?.connect();
    if (!server) throw new Error('Gagal terhubung ke printer.');

    const service = await server.getPrimaryService(PRINT_SERVICE_UUID);
    const characteristic = await service.getCharacteristic(PRINT_CHARACTERISTIC_UUID);

    const encoder = new EscPosEncoder();
    encoder.initialize()
      .alignCenter()
      .bold(true)
      .line(storeName.toUpperCase())
      .bold(false)
      .line(address)
      .separator()
      .alignLeft();

    // Header Info
    if (transaction.queueNumber) encoder.line(`Antrian: #${transaction.queueNumber}`);
    if (transaction.customerName) encoder.line(`Nama: ${transaction.customerName}`);
    if (transaction.tableNumber) encoder.line(`Meja: ${transaction.tableNumber}`);
    if (transaction.date) {
      const date = new Date(transaction.date).toLocaleString('id-ID');
      encoder.line(`Waktu: ${date}`);
    }
    
    encoder.separator();

    // Items
    transaction.items.forEach((item: any) => {
      encoder.line(item.name);
      const priceStr = `${item.quantity} x ${item.price.toLocaleString()}`;
      const subtotal = (item.quantity * item.price).toLocaleString();
      const padding = 32 - priceStr.length - subtotal.length;
      encoder.line(priceStr + ' '.repeat(Math.max(1, padding)) + subtotal);
    });

    encoder.separator()
      .alignRight()
      .line(`TOTAL: ${transaction.total.toLocaleString()}`);
      
    if (transaction.cash) encoder.line(`TUNAI: ${transaction.cash.toLocaleString()}`);
    if (transaction.change) encoder.line(`KEMBALI: ${transaction.change.toLocaleString()}`);
    
    encoder.separator()
      .alignCenter()
      .line('Terima kasih atas kunjungan anda')
      .feed(4);

    const data = encoder.encode();
    const CHUNK_SIZE = 20;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      await characteristic.writeValue(chunk);
    }

    await server.disconnect();
  } catch (error: any) {
    const message = error.message || '';
    if (error.name === 'NotFoundError' || message.includes('cancelled')) {
      throw new Error('Pencarian printer dibatalkan.');
    }
    throw new Error(message || 'Gagal mencetak struk.');
  }
}
