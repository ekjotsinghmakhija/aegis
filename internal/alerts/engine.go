package alerts

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/ekjotsinghmakhija/aegis/internal/models"
)

type Rule struct {
	ID        string
	Metric    string  // "cpu", "mem", "disk"
	Threshold float64
	Enabled   bool
	LastFired time.Time
}

var ActiveRules = []Rule{
	{ID: "cpu_high", Metric: "cpu", Threshold: 90.0, Enabled: true},
	{ID: "mem_critical", Metric: "mem", Threshold: 95.0, Enabled: true},
}

// CheckRules evaluates a payload and sends alerts if needed
func CheckRules(p models.Payload) {
	for i, rule := range ActiveRules {
		if !rule.Enabled || time.Since(rule.LastFired) < 5*time.Minute {
			continue
		}

		triggered := false
		val := 0.0

		switch rule.Metric {
		case "cpu":
			val = p.CPU.GlobalUsagePercent
			triggered = val > rule.Threshold
		case "mem":
			val = float64(p.Memory.UsedMB) / float64(p.Memory.TotalMB) * 100
			triggered = val > rule.Threshold
		}

		if triggered {
			sendDiscordAlert(rule, val)
			ActiveRules[i].LastFired = time.Now()
		}
	}
}

func sendDiscordAlert(r Rule, val float64) {
	webhookURL := "YOUR_DISCORD_WEBHOOK_URL" // Move to Environment Variable
	if webhookURL == "YOUR_DISCORD_WEBHOOK_URL" { return }

	msg := map[string]string{
		"content": fmt.Sprintf("🚨 **AEGIS ALERT**: %s threshold breached! Current: %.1f%% (Limit: %.1f%%)", r.Metric, val, r.Threshold),
	}
	body, _ := json.Marshal(msg)
	http.Post(webhookURL, "application/json", bytes.NewBuffer(body))
}
