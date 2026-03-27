import '@testing-library/jest-dom';

// Polyfill DataTransfer for drag-and-drop tests in jsdom
class SimpleDataTransfer {
	data: Record<string, string> = {};
	setData(type: string, val: string) { this.data[type] = val; }
	getData(type: string) { return this.data[type] || ''; }
	clearData() { this.data = {}; }
}

(global as any).DataTransfer = (global as any).DataTransfer || SimpleDataTransfer;
(window as any).DataTransfer = (window as any).DataTransfer || SimpleDataTransfer;
