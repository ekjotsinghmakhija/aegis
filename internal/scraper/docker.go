package scraper

import (
	"context"
	"strings"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/ekjotsinghmakhija/aegis/internal/models"
)

// GetDockerContainers connects to the Docker socket and extracts container states
func GetDockerContainers() []models.Container {
	// Initialize as an empty array so it serializes to JSON [] instead of null
	containerList := make([]models.Container, 0)

	// 1. Connect to the local Docker daemon
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return containerList // Return empty array if Docker is not installed/running
	}
	defer cli.Close()

	ctx := context.Background()

	// 2. List running containers
	containers, err := cli.ContainerList(ctx, container.ListOptions{})
	if err != nil {
		return containerList
	}

	for _, c := range containers {
		name := ""
		if len(c.Names) > 0 {
			name = strings.TrimPrefix(c.Names[0], "/") // Remove the leading slash Docker adds
		}

		// Note: For v1.0, we map the active containers and their lifecycle states.
		containerList = append(containerList, models.Container{
			ID:         c.ID[:8], // Short ID for the UI
			Name:       name,
			Status:     c.State,
			CPUPercent: 0.0,
			MemoryMB:   0.0,
		})
	}

	return containerList
}

// PerformDockerAction executes start/stop/restart commands on a specific container
func PerformDockerAction(containerID string, action string) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return
	}
	defer cli.Close()

	ctx := context.Background()

	switch action {
	case "stop":
		cli.ContainerStop(ctx, containerID, container.StopOptions{})
	case "start":
		cli.ContainerStart(ctx, containerID, container.StartOptions{})
	case "restart":
		cli.ContainerRestart(ctx, containerID, container.StopOptions{})
	}
}
