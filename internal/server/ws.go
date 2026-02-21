package server

import (
	"database/sql"
	"embed"
	"encoding/json"
	"io/fs"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/ekjotsinghmakhija/aegis/internal/scraper"
	"github.com/gorilla/websocket"
	_ "github.com/mattn/go-sqlite3"
)

// This directive embeds the static dashboard files into the binary
//go:embed all:dashboard/out
var staticFiles embed.FS

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func StartServer(engine *scraper.Engine) {
	db, _ := sql.Open("sqlite3", "./aegis_history.db")
	db.Exec("CREATE TABLE IF NOT EXISTS metrics (ts DATETIME, cpu REAL, mem INTEGER)")

	// 1. Prepare Embedded Files
	public, _ := fs.Sub(staticFiles, "dashboard/out")
	fileServer := http.FileServer(http.FS(public))

	// 2. Telemetry WebSocket
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("token") != os.Getenv("AEGIS_TOKEN") {
			http.Error(w, "Unauthorized", 401); return
		}
		ws, _ := upgrader.Upgrade(w, r, nil)
		defer ws.Close()

		ticker := time.NewTicker(1 * time.Second)
		for range ticker.C {
			payload := engine.RunCycle(800 * time.Millisecond)
			db.Exec("INSERT INTO metrics VALUES (?, ?, ?)", time.Now(), payload.CPU.GlobalUsagePercent, payload.Memory.UsedMB)
			ws.WriteJSON(payload)
		}
	})

	// 3. Serve the GUI at the root
	http.Handle("/", fileServer)

	log.Println("Aegis Dashboard (GUI) available at http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}
