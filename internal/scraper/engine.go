package scraper

import (
	"context"
	"sync"
	"time"

	"github.com/ekjotsinghmakhija/aegis/internal/models"
)

// Registry acts as a thread-safe state store for plugins
type Registry struct {
	mu    sync.RWMutex
	State map[string]interface{}
}

func (r *Registry) Set(key string, val interface{}) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.State[key] = val
}

func (r *Registry) Get(key string) (interface{}, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	val, ok := r.State[key]
	return val, ok
}

// Scraper defines the interface for all telemetry plugins
type Scraper interface {
	Name() string
	Collect(ctx context.Context, reg *Registry) (interface{}, error)
}

type Engine struct {
	Registry *Registry
	Scrapers []Scraper
}

func NewEngine() *Engine {
	return &Engine{
		Registry: &Registry{State: make(map[string]interface{})},
		Scrapers: []Scraper{},
	}
}

func (e *Engine) Register(s Scraper) {
	e.Scrapers = append(e.Scrapers, s)
}

func (e *Engine) RunCycle(timeout time.Duration) models.Payload {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	payload := models.Payload{
		TopProcesses: []models.Process{},
		Containers:   []models.Container{},
		GPUs:         []models.GPU{},
	}

	var wg sync.WaitGroup
	var mu sync.Mutex

	for _, s := range e.Scrapers {
		wg.Add(1)
		go func(scraper Scraper) {
			defer wg.Done()
			result, err := scraper.Collect(ctx, e.Registry)
			if err != nil {
				return
			}

			mu.Lock()
			e.mapToPayload(&payload, scraper.Name(), result)
			mu.Unlock()
		}(s)
	}

	wg.Wait()
	payload.Metadata.Timestamp = time.Now().UTC()
	return payload
}

func (e *Engine) mapToPayload(p *models.Payload, name string, res interface{}) {
	switch name {
	case "host": p.Metadata = res.(models.Metadata)
	case "cpu": p.CPU = res.(models.CPU)
	case "memory": p.Memory = res.(models.Memory)
	case "disk": p.Disks = res.([]models.Disk)
	case "network": p.Networks = res.([]models.Network)
	case "processes": p.TopProcesses = res.([]models.Process)
	case "docker": p.Containers = res.([]models.Container)
	case "gpu": p.GPUs = res.([]models.GPU)
	}
}
