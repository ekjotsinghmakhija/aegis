package main

import (
	"fmt"
	"time"

	"github.com/ekjotsinghmakhija/aegis/internal/scraper"
	"github.com/ekjotsinghmakhija/aegis/internal/server"
)

func main() {
	engine := scraper.NewEngine()

	// Register modular plugins
	engine.Register(&scraper.HostPlugin{})
	engine.Register(&scraper.CPUScraper{})
	engine.Register(&scraper.MemPlugin{})
	engine.Register(&scraper.NetPlugin{})
	engine.Register(&scraper.ProcessPlugin{})
	engine.Register(&scraper.DockerPlugin{}) //

	// Start GUI server in a background routine
	go server.StartServer(engine)

	// --- TERMINAL FORMAT OUTPUT ---
	fmt.Println("\033[H\033[2J") // Clear screen
	fmt.Println("Aegis Terminal Monitor v3.0 | GUI at http://localhost:8080")
	fmt.Println("-------------------------------------------------------------")

	for {
		data := engine.RunCycle(500 * time.Millisecond)
		fmt.Printf("\rCPU: %.1f%% | RAM: %dMB / %dMB | Host: %s ",
			data.CPU.GlobalUsagePercent,
			data.Memory.UsedMB,
			data.Memory.TotalMB,
			data.Metadata.Hostname)
		time.Sleep(1 * time.Second)
	}
}
