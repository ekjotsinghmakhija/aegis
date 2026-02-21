package scraper

import (
	"context"
	"strings"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/ekjotsinghmakhija/aegis/internal/models"
)

type DockerPlugin struct{}

func (p *DockerPlugin) Name() string { return "docker" }

func (p *DockerPlugin) Collect(ctx context.Context, _ *Registry) (interface{}, error) {
	containerList := make([]models.Container, 0)
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return containerList, nil
	}
	defer cli.Close()

	containers, err := cli.ContainerList(ctx, container.ListOptions{All: true})
	if err != nil {
		return containerList, nil
	}

	for _, c := range containers {
		name := ""
		if len(c.Names) > 0 {
			name = strings.TrimPrefix(c.Names[0], "/")
		}
		containerList = append(containerList, models.Container{
			ID:     c.ID[:8],
			Name:   name,
			Status: c.State,
		})
	}
	return containerList, nil
}

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
