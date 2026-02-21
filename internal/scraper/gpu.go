package scraper

import (
	"github.com/ekjotsinghmakhija/aegis/internal/models"
	"github.com/jaypipes/ghw"
)

// GetGPUInfo discovers GPU hardware across different vendors
func GetGPUInfo() []models.GPU {
	gpuList := make([]models.GPU, 0)

	gpu, err := ghw.GPU()
	if err != nil {
		return gpuList
	}

	for _, card := range gpu.GraphicsCards {
		device := card.DeviceInfo
		vendor := "Unknown"
		if device != nil && device.Vendor != nil {
			vendor = device.Vendor.Name
		}

		model := "Unknown Graphics Card"
		if device != nil && device.Product != nil {
			model = device.Product.Name
		}

		gpuList = append(gpuList, models.GPU{
			Vendor:        vendor,
			Model:         model,
			MemoryTotalMB: 0,   // Detailed VRAM often requires vendor-specific drivers
			Utilization:   0.0, // Detailed usage requires vendor-specific tools (NVML, ROCm)
		})
	}

	return gpuList
}
