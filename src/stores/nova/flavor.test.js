import { FlavorStore } from './flavor';

const GPU_CATEGORY = 'compute_optimized_type_with_gpu';

const gpuInfo = (extraSpecs) =>
  new FlavorStore().getGpuInfo({ extra_specs: extraSpecs });

describe('FlavorStore.getGpuInfo', () => {
  it('reads the GPU of a vGPU flavor from pci_passthrough:alias', () => {
    expect(
      gpuInfo({
        ':category': GPU_CATEGORY,
        'pci_passthrough:alias': 'Inference_Small:1',
      })
    ).toEqual({
      gpuType: 'Inference_Small',
      gpuCount: '1',
      usbType: '-',
      usbCount: '-',
    });
  });

  it('reads the GPU and the USB controller of a vGPU + USB flavor', () => {
    expect(
      gpuInfo({
        ':category': GPU_CATEGORY,
        'pci_passthrough:alias': 'Inference_Small:1,usb_c:2',
      })
    ).toEqual({
      gpuType: 'Inference_Small',
      gpuCount: '1',
      usbType: 'usb_c',
      usbCount: '2',
    });
  });

  it('reads the USB controller of a USB-only flavor', () => {
    expect(
      gpuInfo({
        ':category': 'visualization_compute_optimized_type_with_gpu',
        'pci_passthrough:alias': 'usb_c:2',
      })
    ).toEqual({
      gpuType: '-',
      gpuCount: '-',
      usbType: 'usb_c',
      usbCount: '2',
    });
  });

  it('reads the device profile name of a pGPU flavor, with no count', () => {
    expect(
      gpuInfo({
        ':category': GPU_CATEGORY,
        'accel:device_profile': 'pgpu-profile',
      })
    ).toEqual({
      gpuType: 'pgpu-profile',
      gpuCount: '-',
      usbType: '-',
      usbCount: '-',
    });
  });

  it('reads the device profile of a pGPU flavor that also has a USB controller', () => {
    expect(
      gpuInfo({
        ':category': GPU_CATEGORY,
        'accel:device_profile': 'pgpu-profile',
        'pci_passthrough:alias': 'usb_c:2',
      })
    ).toEqual({
      gpuType: 'pgpu-profile',
      gpuCount: '-',
      usbType: 'usb_c',
      usbCount: '2',
    });
  });

  it('shows no GPU for a flavor with no GPU keys', () => {
    expect(gpuInfo({ ':category': GPU_CATEGORY })).toEqual({
      gpuType: '-',
      gpuCount: '-',
      usbType: '-',
      usbCount: '-',
    });
  });
});
