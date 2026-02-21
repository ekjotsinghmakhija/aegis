package scraper

import (
	"context"
	"github.com/ekjotsinghmakhija/aegis/internal/models"
	"github.com/jaypipes/ghw"
)

type GPUPlugin struct{}

func (p *GPUPlugin) Name() string { return "gpu" }

func (p *GPUPlugin) Collect(ctx context.Context, _ *Registry) (interface{}, error) {
	gpuList := make([]models.GPU, 0)
	gpu, err := ghw.GPU()
	if err != nil {
		return gpuList, nil
	}

	for _, card := range gpu.GraphicsCards {
		device := card.DeviceInfo
		vendor := "Unknown"; if device != nil && device.Vendor != nil { vendor = device.Vendor.Name }
		model := "Unknown Graphics Card"; if device != nil && device.Product != nil { model = device.Product.Name }

		gpuList = append(gpuList, models.GPU{
			Vendor:        vendor,
			Model:         model,
			Utilization:   0.0,
			MemoryUsedMB:  0,
			MemoryTotalMB: 0,
		})
	}
	return gpuList, nil
}
